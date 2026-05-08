<!-- ## 角色对练：WebSocket 全双工对话，三栏 PC 布局（目标+角色 | 对话 | 输入+回合） -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { showToast } from '@/composables/toast'
import { ttsApi, tasksApi, filesApi } from '@/api'
import type { Task, FileItem } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const taskId = route.params.id as string
const mode = (route.query.mode as string) || 'practice'

const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
window.addEventListener('resize', onResize)
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

// ── 五状态机 ──────────────────────────────────────────────────
type UIState = 'CONNECTING' | 'AI_SPEAKING' | 'USER_TURN' | 'USER_RECORDING' | 'PROCESSING' | 'SESSION_ENDED'
const uiState = ref<UIState>('CONNECTING')

// ── 会话信息 ──────────────────────────────────────────────────
const personaName = ref('')
const personaInitial = computed(() => personaName.value.charAt(0) || '?')
const personaAvatarUrl = ref('')
const submissionId = ref('')
const error = ref('')
const task = ref<Task | null>(null)
const materials = ref<FileItem[]>([])

// 任务目标
const taskObjective = computed(() => {
  const cfg = (task.value as any)?.config
  return cfg?.objective || task.value?.description || ''
})
// 评分维度
const scoringDimensions = computed<string[]>(() => {
  const cfg = (task.value as any)?.config
  return cfg?.dimensions || ['开场白', '需求挖掘', '异议处理', '产品介绍', '促成成交']
})

// ── 对话记录 ──────────────────────────────────────────────────
interface Turn { role: 'user' | 'ai'; text: string; display: string }
const turns = ref<Turn[]>([])
const chatRef = ref<HTMLElement | null>(null)
const roundCount = computed(() => turns.value.filter(t => t.role === 'user').length)

// ── 计时器 ────────────────────────────────────────────────────
const elapsed = ref(0)
let timerInterval = 0
const timerDisplay = computed(() => {
  const m = Math.floor(elapsed.value / 60).toString().padStart(2, '0')
  const s = (elapsed.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

// ── 处理中状态文字 ────────────────────────────────────────────
const processingText = ref('上传中...')
const processingSteps = ['上传中...', '识别中...', 'AI 思考中...']
let processingTimer = 0

// ── 录音 ──────────────────────────────────────────────────────
const audioChunks = ref<BlobPart[]>([])
let ws: WebSocket | null = null
let mediaRecorder: MediaRecorder | null = null
let stream: MediaStream | null = null

const apiBase = import.meta.env.VITE_API_BASE || window.location.host

// 将后端返回的相对路径（如 /uploads/xxx.png）补全为完整 URL
function resolveBackendUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8000/api/v1'
  const backendOrigin = baseUrl.replace(/\/api\/v1\/?$/, '')
  return backendOrigin + path
}

// ── TTS ────────────────────────────────────────────────────────
const ttsEnabled = ref(true)
let currentAudio: HTMLAudioElement | null = null

function toggleTTS() {
  ttsEnabled.value = !ttsEnabled.value
  if (currentAudio) { currentAudio.pause(); currentAudio = null }
}

async function speak(text: string) {
  if (!ttsEnabled.value) return
  if (currentAudio) { currentAudio.pause(); currentAudio = null }
  try {
    const url = await ttsApi.synthesize(text)
    const audio = new Audio(url)
    currentAudio = audio
    audio.play()
    audio.onended = () => { currentAudio = null }
  } catch {}
}

// ── 打字机效果 ────────────────────────────────────────────────
let typewriterTimer = 0
function typewriter(text: string, idx: number, onDone: () => void) {
  let i = 0
  clearInterval(typewriterTimer)
  typewriterTimer = setInterval(() => {
    turns.value[idx].display = text.slice(0, i)
    i++
    scrollToBottom()
    if (i > text.length) { clearInterval(typewriterTimer); onDone() }
  }, 16)
}

// ── WebSocket ─────────────────────────────────────────────────
onMounted(async () => {
  const token = auth.token
  if (!token) { router.push('/login'); return }

  // 加载任务信息和材料
  try {
    const taskRes = await tasksApi.get(taskId)
    task.value = taskRes
    const materialIds: string[] = taskRes.material_ids || []
    if (materialIds.length > 0) {
      const results = await Promise.all(materialIds.map((id: string) => filesApi.get(id).catch(() => null)))
      materials.value = results.filter(Boolean) as FileItem[]
    }
  } catch {}

  const personaId = (route.query.persona_id as string) || ''
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(`${proto}://${apiBase}/api/v1/ws/roleplay/${taskId}?token=${token}&persona_id=${personaId}&mode=${mode}`)

  ws.onopen = () => {}

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      switch (msg.type) {
        case 'session_ready':
          personaName.value = msg.persona_name
          personaAvatarUrl.value = resolveBackendUrl(msg.persona_avatar_url || '')
          submissionId.value = msg.submission_id
          timerInterval = setInterval(() => elapsed.value++, 1000)
          break
        case 'ai_response': {
          uiState.value = 'AI_SPEAKING'
          if (msg.user_text) {
            turns.value.push({ role: 'user', text: msg.user_text, display: msg.user_text })
          }
          const idx = turns.value.length
          turns.value.push({ role: 'ai', text: msg.text, display: '' })
          speak(msg.text)
          const isEnd = !!msg.end_signal
          typewriter(msg.text, idx, () => {
            if (isEnd) uiState.value = 'SESSION_ENDED'
            else uiState.value = 'USER_TURN'
          })
          break
        }
        case 'session_ended':
          uiState.value = 'SESSION_ENDED'
          setTimeout(() => {
            if (uiState.value === 'SESSION_ENDED' && submissionId.value)
              router.replace(`/roleplay/${submissionId.value}/result`)
          }, 45000)
          break
        case 'evaluation_ready':
          showToast('评估完成，正在跳转...', 'success')
          setTimeout(() => router.replace(`/roleplay/${msg.submission_id}/result`), 1200)
          break
        case 'asr_progress':
          processingText.value = '识别中...'
          break
        case 'asr_error':
          uiState.value = 'USER_TURN'
          showToast(msg.message || '语音识别失败，请重试', 'error')
          break
        case 'error':
          error.value = msg.message
          break
        case 'ping':
          ws?.send(JSON.stringify({ type: 'pong' }))
          break
      }
    } catch {}
  }

  ws.onerror = () => { error.value = '连接失败，请检查网络' }
  ws.onclose = () => {
    if (uiState.value === 'SESSION_ENDED' && submissionId.value) {
      setTimeout(() => router.replace(`/roleplay/${submissionId.value}/result`), 2000)
    } else if (uiState.value === 'PROCESSING') {
      uiState.value = 'USER_TURN'
      showToast('连接中断，请重试', 'error')
    }
  }
})

onBeforeUnmount(() => {
  if (currentAudio) { currentAudio.pause(); currentAudio = null }
  if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop()
  stream?.getTracks().forEach(t => t.stop())
  ws?.close()
  clearInterval(timerInterval)
  clearInterval(processingTimer)
  clearInterval(typewriterTimer)
})

// ── 录音控制 ──────────────────────────────────────────────────
async function startRecording() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    audioChunks.value = []
    mediaRecorder.ondataavailable = e => audioChunks.value.push(e.data)
    mediaRecorder.onstop = sendAudio
    mediaRecorder.start()
    uiState.value = 'USER_RECORDING'
  } catch {
    showToast('无法访问麦克风，请检查权限设置', 'error')
  }
}

function stopRecording() {
  if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop()
  stream?.getTracks().forEach(t => t.stop())
  if (uiState.value === 'USER_RECORDING') {
    uiState.value = 'PROCESSING'
    startProcessingAnim()
  }
}

function startProcessingAnim() {
  let step = 0
  processingText.value = processingSteps[0]
  clearInterval(processingTimer)
  processingTimer = setInterval(() => {
    step = (step + 1) % processingSteps.length
    processingText.value = processingSteps[step]
  }, 1200)
}

async function sendAudio() {
  clearInterval(processingTimer)
  if (!ws || audioChunks.value.length === 0) { uiState.value = 'USER_TURN'; return }
  const blob = new Blob(audioChunks.value, { type: 'audio/webm' })
  const reader = new FileReader()
  reader.onload = () => {
    ws?.send(JSON.stringify({ type: 'user_audio', audio: (reader.result as string).split(',')[1], format: 'webm' }))
    audioChunks.value = []
  }
  reader.readAsDataURL(blob)
}


function endSession() {
  ws?.send(JSON.stringify({ type: 'end_session' }))
  uiState.value = 'SESSION_ENDED'
}

function scrollToBottom() {
  nextTick(() => { const el = chatRef.value; if (el) el.scrollTop = el.scrollHeight })
}

watch(() => turns.value.length, scrollToBottom)

function openPdf(fileId: string) {
  window.open(`#/tasks/${taskId}/pdf?file_id=${fileId}`, '_blank')
}
</script>

<template>
  <!-- ========== PC 三栏布局 ========== -->
  <div v-if="isPC" class="pc-rp-page">

    <!-- PC Header -->
    <div class="rp-header">
      <button class="rp-close" @click="endSession">
        <AppIcon name="close" :size="12" /> 结束对练
      </button>
      <div class="rp-center-info">
        <div class="rp-mini-avatar" v-if="personaName">
          <img v-if="personaAvatarUrl" :src="personaAvatarUrl" class="av-photo" alt="" />
          <template v-else>{{ personaInitial }}</template>
        </div>
        <div>
          <div class="rp-name">{{ personaName || '连接中...' }}</div>
          <div class="rp-mode-badge" :class="mode">{{ mode === 'exam' ? '考核模式' : '练习模式' }}</div>
        </div>
      </div>
      <div class="rp-header-right">
        <div class="rp-timer">{{ timerDisplay }}</div>
        <button class="tts-toggle" @click="toggleTTS" :title="ttsEnabled ? '关闭语音' : '开启语音'">
          <AppIcon :name="ttsEnabled ? 'volume' : 'volume-off'" :size="16" />
        </button>
      </div>
    </div>

    <div v-if="error" class="rp-error">
      <div class="rp-error-text">{{ error }}</div>
      <button class="btn-ghost" @click="router.back()">返回</button>
    </div>

    <div v-else class="pc-rp-body">

      <!-- ── 左栏：任务目标 + 角色信息 + 材料 ── -->
      <div class="pc-left-panel">

        <!-- 角色头像 -->
        <div class="pc-persona-hero">
          <div class="pc-persona-avatar">
            <img v-if="personaAvatarUrl" :src="personaAvatarUrl" class="av-photo" alt="" />
            <template v-else>{{ personaInitial }}</template>
          </div>
          <div class="pc-persona-name">{{ personaName || '连接中...' }}</div>
          <div class="rp-mode-badge" :class="mode">{{ mode === 'exam' ? '考核模式' : '练习模式' }}</div>
        </div>

        <!-- 任务目标 -->
        <div v-if="taskObjective" class="objective-box">
          <div class="obj-title">
            <AppIcon name="target" :size="13" style="margin-right:4px" />对话目标
          </div>
          <div class="obj-text">{{ taskObjective }}</div>
        </div>

        <!-- 当前状态 -->
        <div class="status-card">
          <div class="status-label">当前状态</div>
          <div class="status-val" :class="{
            'st-ai': uiState === 'AI_SPEAKING',
            'st-user': uiState === 'USER_TURN' || uiState === 'USER_RECORDING',
            'st-proc': uiState === 'PROCESSING',
          }">
            <span v-if="uiState === 'AI_SPEAKING'" class="status-dot st-ai-dot" />
            <span v-else-if="uiState === 'USER_TURN' || uiState === 'USER_RECORDING'" class="status-dot st-user-dot" />
            <template v-if="uiState === 'CONNECTING'">连接中...</template>
            <template v-else-if="uiState === 'AI_SPEAKING'">{{ personaName }} 说话中</template>
            <template v-else-if="uiState === 'USER_TURN'">轮到你发言</template>
            <template v-else-if="uiState === 'USER_RECORDING'">正在录音</template>
            <template v-else-if="uiState === 'PROCESSING'">{{ processingText }}</template>
            <template v-else-if="uiState === 'SESSION_ENDED'">对练结束</template>
          </div>
        </div>

        <!-- AI 说话波形 -->
        <div v-if="uiState === 'AI_SPEAKING'" class="pc-wave-box">
          <div class="wave-bars">
            <div class="bar" v-for="i in 7" :key="i" :style="{ animationDelay: `${(i-1)*0.12}s` }" />
          </div>
        </div>

        <!-- 学习材料 -->
        <div v-if="materials.length" class="left-materials">
          <div class="lm-title">参考材料</div>
          <div v-for="m in materials" :key="m.id" class="lm-row" @click="openPdf(m.id)">
            <AppIcon name="file" :size="13" style="flex-shrink:0;color:var(--color-primary)" />
            <span class="lm-name">{{ m.original_name }}</span>
          </div>
        </div>
      </div>

      <!-- ── 中栏：对话气泡 ── -->
      <div ref="chatRef" class="pc-chat-panel">
        <div class="chat-inner">
          <div v-if="uiState === 'CONNECTING'" class="connecting-msg">
            <div class="spinner" /><span>正在建立连接...</span>
          </div>
          <div v-for="(t, i) in turns" :key="i" class="bubble-row" :class="t.role">
            <div v-if="t.role === 'ai'" class="b-avatar ai-av">
              <img v-if="personaAvatarUrl" :src="personaAvatarUrl" class="av-photo" alt="" />
              <template v-else>{{ personaInitial }}</template>
            </div>
            <div class="bubble" :class="t.role">{{ t.display || t.text }}</div>
            <div v-if="t.role === 'user'" class="b-avatar user-av">我</div>
          </div>
        </div>
      </div>

      <!-- ── 右栏：输入区 + 回合统计 ── -->
      <div class="pc-right-panel">

        <!-- SESSION_ENDED -->
        <template v-if="uiState === 'SESSION_ENDED'">
          <div class="ended-center">
            <div class="ended-icon-big">✅</div>
            <div class="ended-title-big">对练已结束</div>
            <div class="ended-sub">AI 正在生成评估报告<br>请稍候自动跳转...</div>
            <div class="spinner" style="margin:16px auto 0" />
          </div>
        </template>

        <template v-else>
          <!-- 回合计数 -->
          <div class="round-stat">
            <div class="round-num">{{ roundCount }}</div>
            <div class="round-label">已发言回合</div>
          </div>

          <!-- 评分维度提示 -->
          <div class="dim-hint">
            <div class="dim-hint-title">评分维度</div>
            <div class="dim-tags">
              <span v-for="d in scoringDimensions" :key="d" class="dim-tag">{{ d }}</span>
            </div>
          </div>

          <!-- 输入区 -->
          <div class="pc-input-area">
            <div class="input-state-label" :class="{
              'label-green': uiState === 'USER_TURN',
              'label-red': uiState === 'USER_RECORDING',
              'label-gray': uiState === 'PROCESSING' || uiState === 'AI_SPEAKING',
            }">
              <template v-if="uiState === 'USER_TURN'">轮到你了</template>
              <template v-else-if="uiState === 'USER_RECORDING'">
                <span class="rec-dot" /> 录音中...
              </template>
              <template v-else-if="uiState === 'PROCESSING'">{{ processingText }}</template>
              <template v-else-if="uiState === 'AI_SPEAKING'">{{ personaName }} 回复中...</template>
              <template v-else>连接中...</template>
            </div>

            <!-- USER_TURN 输入控件 -->
            <template v-if="uiState === 'USER_TURN'">
              <button class="mic-btn-pc user-turn float-anim" @click="startRecording">
                <AppIcon name="mic" :size="22" />
                <span>点击开始录音</span>
              </button>
            </template>

            <!-- USER_RECORDING -->
            <template v-else-if="uiState === 'USER_RECORDING'">
              <button class="mic-btn-pc recording" @click="stopRecording">
                <AppIcon name="stop" :size="22" />
                <span>停止录音</span>
              </button>
            </template>

            <!-- 其他状态 -->
            <template v-else>
              <button class="mic-btn-pc disabled" disabled>
                <AppIcon name="mic" :size="22" />
                <span>等待中</span>
              </button>
            </template>
          </div>

          <button class="end-btn-pc" @click="endSession">结束对练</button>
        </template>
      </div>

    </div>
  </div>

  <!-- ========== Mobile Layout ========== -->
  <div v-else class="rp-page">
    <!-- Header -->
    <div class="rp-header">
      <button v-if="mode !== 'exam'" class="rp-close" @click="endSession">
        <AppIcon name="close" :size="12" />
      </button>
      <div v-else style="width:60px" />
      <div class="rp-center-info">
        <div class="rp-mini-avatar" v-if="personaName">
          <img v-if="personaAvatarUrl" :src="personaAvatarUrl" class="av-photo" alt="" />
          <template v-else>{{ personaInitial }}</template>
        </div>
        <div>
          <div class="rp-name">{{ personaName || '连接中...' }}</div>
          <div class="rp-mode-badge" :class="mode">{{ mode === 'exam' ? '考核模式' : '练习模式' }}</div>
        </div>
      </div>
      <div class="rp-header-right">
        <div class="rp-timer">{{ timerDisplay }}</div>
        <button class="tts-toggle" @click="toggleTTS">
          <AppIcon :name="ttsEnabled ? 'volume' : 'volume-off'" :size="16" />
        </button>
      </div>
    </div>

    <div v-if="error" class="rp-error">
      <div class="rp-error-text">{{ error }}</div>
      <button class="btn-ghost" @click="router.back()">返回</button>
    </div>

    <template v-else>
      <!-- 对话气泡 -->
      <div ref="chatRef" class="chat-area">
        <div v-if="uiState === 'CONNECTING'" class="connecting-center">
          <div class="spinner" /><span>正在连接...</span>
        </div>
        <div class="chat-list">
          <div v-for="(t, i) in turns" :key="i" class="bubble-row" :class="t.role">
            <div v-if="t.role === 'ai'" class="b-avatar ai-av">
              <img v-if="personaAvatarUrl" :src="personaAvatarUrl" class="av-photo" alt="" />
              <template v-else>{{ personaInitial }}</template>
            </div>
            <div class="bubble" :class="t.role">{{ t.display || t.text }}</div>
            <div v-if="t.role === 'user'" class="b-avatar user-av">我</div>
          </div>
        </div>
      </div>

      <!-- 底部输入区 -->
      <div class="input-zone">
        <!-- SESSION_ENDED -->
        <template v-if="uiState === 'SESSION_ENDED'">
          <div class="ended-area">
            <div class="ended-icon">✅</div>
            <div class="ended-title">对练已结束</div>
            <div class="ended-sub">AI 正在生成评估报告，请稍候...</div>
            <div class="spinner" style="margin:12px auto 0" />
          </div>
        </template>

        <template v-else>
          <!-- 状态指示条 -->
          <div class="state-bar">
            <span class="state-pill" :class="{
              'sp-ai': uiState === 'AI_SPEAKING',
              'sp-user': uiState === 'USER_TURN',
              'sp-rec': uiState === 'USER_RECORDING',
              'sp-proc': uiState === 'PROCESSING',
              'sp-idle': uiState === 'CONNECTING',
            }">
              <span v-if="uiState === 'AI_SPEAKING'" class="sp-dot" />
              <span v-else-if="uiState === 'USER_RECORDING'" class="sp-dot rec" />
              <template v-if="uiState === 'AI_SPEAKING'">{{ personaName }} 说话中</template>
              <template v-else-if="uiState === 'USER_TURN'">轮到你了</template>
              <template v-else-if="uiState === 'USER_RECORDING'">录音中...</template>
              <template v-else-if="uiState === 'PROCESSING'">{{ processingText }}</template>
              <template v-else>连接中...</template>
            </span>
          </div>

          <!-- 大圆形麦克风按钮 -->
          <div class="mic-circle-wrap">
            <button
              v-if="uiState === 'USER_TURN'"
              class="mic-circle user-turn float-anim"
              @click="startRecording"
            >
              <AppIcon name="mic" :size="28" />
            </button>
            <button
              v-else-if="uiState === 'USER_RECORDING'"
              class="mic-circle recording"
              @click="stopRecording"
            >
              <AppIcon name="stop" :size="28" />
            </button>
            <button v-else class="mic-circle disabled" disabled>
              <AppIcon name="mic" :size="28" />
            </button>
          </div>

          <button
            v-if="mode !== 'exam'"
            class="end-btn" @click="endSession"
          >结束对练</button>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ══════════════════════════════════════
   共用
══════════════════════════════════════ */
.rp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px;
  background: rgba(255,255,255,0.94);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 0.5px solid rgba(0,0,0,0.1);
  flex-shrink: 0; z-index: 10;
}
.rp-close {
  font-size: 13px; color: var(--danger, #FF3B30);
  background: rgba(255,59,48,0.08); border: none;
  padding: 5px 12px; border-radius: 8px; cursor: pointer;
  display: flex; align-items: center; gap: 4px; font-weight: 600;
}
.rp-center-info { display: flex; align-items: center; gap: 8px; }
.rp-mini-avatar {
  width: 30px; height: 30px; border-radius: 6px;
  background: linear-gradient(135deg, #AF52DE, #5856D6);
  color: white; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.rp-name { font-size: 14px; font-weight: 600; color: var(--text-1, #1C1C1E); line-height: 1.2; }
.rp-mode-badge {
  display: inline-block; font-size: 10px; font-weight: 600;
  padding: 1px 7px; border-radius: 8px; margin-top: 2px;
  background: rgba(88,86,214,0.12); color: #5856D6;
}
.rp-mode-badge.exam { background: rgba(255,59,48,0.1); color: #FF3B30; }
.rp-header-right { display: flex; align-items: center; gap: 8px; }
.rp-timer { font-size: 14px; font-weight: 600; color: var(--text-2); font-variant-numeric: tabular-nums; }
.tts-toggle {
  background: transparent; border: none; cursor: pointer;
  padding: 5px 6px; border-radius: 6px; color: var(--text-2);
  display: flex; align-items: center;
}
.tts-toggle:hover { background: rgba(0,0,0,0.06); }

/* Chat bubbles */
.chat-list { display: flex; flex-direction: column; gap: 14px; }
.bubble-row {
  display: flex; align-items: flex-end; gap: 8px; max-width: 88%;
}
.bubble-row.user { align-self: flex-end; flex-direction: row-reverse; }
.bubble-row.ai  { align-self: flex-start; }
.b-avatar {
  width: 32px; height: 40px; border-radius: 6px;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;
}
.ai-av  { background: linear-gradient(135deg, #AF52DE, #5856D6); color: white; }
.user-av { background: var(--bg-grouped, #F2F2F7); color: var(--text-2, #636366); }
.bubble {
  padding: 12px 16px; border-radius: 18px;
  font-size: 15px; line-height: 1.55;
  white-space: pre-wrap; word-break: break-word;
}
.bubble.ai {
  background: white; color: var(--text-1);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}
.bubble.user {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white; border-bottom-right-radius: 4px;
}

/* Wave bars */
.wave-bars { display: flex; align-items: center; gap: 3px; height: 32px; }
.bar { width: 4px; border-radius: 2px; background: linear-gradient(180deg,#AF52DE,#5856D6); animation: wave 0.8s ease-in-out infinite alternate; }
.bar:nth-child(1){animation-duration:0.7s}
.bar:nth-child(2){animation-duration:0.9s}
.bar:nth-child(3){animation-duration:0.6s}
.bar:nth-child(4){animation-duration:1.0s}
.bar:nth-child(5){animation-duration:0.75s}
.bar:nth-child(6){animation-duration:0.85s}
.bar:nth-child(7){animation-duration:0.65s}
@keyframes wave { 0%{height:5px} 100%{height:28px} }

/* Ended area */
.ended-title { font-size: 16px; font-weight: 700; color: var(--text-1); }
.ended-sub { font-size: 13px; color: var(--text-3); margin-top: 4px; line-height: 1.5; }

/* Error */
.rp-error {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; font-size: 15px; color: var(--text-2);
}

/* Animations */
@keyframes pulse-expand { 0%{transform:scale(0.85);opacity:0.6} 100%{transform:scale(1.15);opacity:0} }
@keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes spin-cw { to{transform:rotate(360deg)} }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
.float-anim { animation: float-y 2s ease-in-out infinite; }

/* ══════════════════════════════════════
   PC 三栏
══════════════════════════════════════ */
.pc-rp-page {
  display: flex; flex-direction: column;
  height: 100vh; height: 100dvh;
  background: #F0EFFA; overflow: hidden;
}
.pc-rp-body { display: flex; flex: 1; overflow: hidden; }

/* Left panel */
.pc-left-panel {
  width: 240px; flex-shrink: 0;
  background: white; border-right: 1px solid var(--separator);
  padding: 20px 16px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px;
}
.pc-persona-hero {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 8px;
  background: linear-gradient(160deg, rgba(175,82,222,0.08), rgba(88,86,214,0.08));
  border-radius: 12px;
}
.pc-persona-avatar {
  width: 72px; height: 90px; border-radius: 12px;
  background: linear-gradient(135deg, #AF52DE, #5856D6);
  color: white; font-size: 24px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.av-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.pc-persona-name { font-size: 15px; font-weight: 700; color: var(--text-primary); text-align: center; }

.objective-box {
  background: linear-gradient(135deg, #5856D6 0%, #AF52DE 100%);
  border-radius: 12px; padding: 14px;
}
.obj-title {
  font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.8);
  letter-spacing: 0.4px; margin-bottom: 8px;
  display: flex; align-items: center;
}
.obj-text { font-size: 13px; color: white; line-height: 1.55; }

.status-card { background: var(--bg-grouped, #F2F2F7); border-radius: 10px; padding: 12px 14px; }
.status-label { font-size: 11px; font-weight: 600; color: var(--text-3); letter-spacing: 0.3px; margin-bottom: 6px; }
.status-val {
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  display: flex; align-items: center; gap: 6px;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.st-ai { color: #5856D6; } .st-ai-dot { background: #5856D6; animation: blink 1.2s ease infinite; }
.st-user { color: #34C759; } .st-user-dot { background: #34C759; }
.st-proc { color: #FF9500; }

.pc-wave-box {
  display: flex; justify-content: center; padding: 10px;
  background: rgba(88,86,214,0.06); border-radius: 10px;
}

.left-materials { display: flex; flex-direction: column; gap: 6px; }
.lm-title { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
.lm-row {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 4px; border-radius: 6px; cursor: pointer;
  font-size: 12px; color: var(--text-secondary);
  transition: background 120ms;
}
.lm-row:hover { background: var(--bg-grouped); }
.lm-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Center chat panel */
.pc-chat-panel { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.chat-inner { padding: 20px 20px 16px; display: flex; flex-direction: column; gap: 14px; }
.connecting-msg {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 60px 0; color: var(--text-secondary); font-size: 14px;
}

/* Right panel */
.pc-right-panel {
  width: 280px; flex-shrink: 0;
  background: rgba(255,255,255,0.97);
  border-left: 1px solid var(--separator);
  padding: 20px 16px;
  display: flex; flex-direction: column; gap: 16px;
  overflow-y: auto;
}

.ended-center { text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ended-icon-big { font-size: 48px; margin-bottom: 12px; }
.ended-title-big { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }

.round-stat {
  background: linear-gradient(135deg, rgba(0,122,255,0.08), rgba(88,86,214,0.08));
  border-radius: 12px; padding: 16px; text-align: center;
}
.round-num { font-size: 36px; font-weight: 800; color: var(--color-primary); line-height: 1; }
.round-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

.dim-hint { display: flex; flex-direction: column; gap: 8px; }
.dim-hint-title { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.4px; }
.dim-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.dim-tag {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
  background: var(--bg-grouped); color: var(--text-secondary); border: 1px solid var(--border);
}

.pc-input-area { display: flex; flex-direction: column; gap: 10px; }
.input-state-label {
  font-size: 13px; font-weight: 600; text-align: center;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.label-green { color: #34C759; }
.label-red { color: #FF3B30; animation: blink 1s ease infinite; }
.label-gray { color: var(--text-3); }
.rec-dot { width: 8px; height: 8px; border-radius: 50%; background: #FF3B30; flex-shrink: 0; }

.mic-btn-pc {
  width: 100%; padding: 14px;
  border-radius: 14px; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 15px; font-weight: 600; transition: all 200ms;
}
.mic-btn-pc.user-turn {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white; box-shadow: 0 6px 20px rgba(0,122,255,0.3);
}
.mic-btn-pc.recording {
  background: linear-gradient(135deg, #FF3B30, #FF9500);
  color: white; box-shadow: 0 6px 20px rgba(255,59,48,0.3);
  animation: pulse-expand 1.2s ease infinite;
}
.mic-btn-pc.disabled { background: var(--bg-grouped); color: var(--text-3); cursor: not-allowed; }


.end-btn-pc {
  width: 100%; padding: 10px; border-radius: 10px; border: none; cursor: pointer;
  background: rgba(255,59,48,0.08); color: #FF3B30;
  font-size: 14px; font-weight: 500; margin-top: auto;
}

/* ══════════════════════════════════════
   Mobile
══════════════════════════════════════ */
.rp-page {
  display: flex; flex-direction: column;
  height: 100vh; height: 100dvh;
  background: #F5F5F7; overflow: hidden;
}

.chat-area { flex: 1; overflow-y: auto; padding: 16px 16px 8px; -webkit-overflow-scrolling: touch; }
.connecting-center { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 60px 0; color: var(--text-secondary); font-size: 14px; }

.input-zone {
  flex-shrink: 0;
  background: white; backdrop-filter: blur(16px);
  border-top: 0.5px solid rgba(0,0,0,0.1);
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}

/* State indicator bar */
.state-bar { width: 100%; display: flex; justify-content: center; }
.state-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 20px;
  font-size: 13px; font-weight: 600;
}
.sp-ai { background: rgba(88,86,214,0.1); color: #5856D6; }
.sp-user { background: rgba(52,199,89,0.1); color: #34C759; }
.sp-rec { background: rgba(255,59,48,0.1); color: #FF3B30; animation: blink 1s ease infinite; }
.sp-proc { background: rgba(255,149,0,0.1); color: #FF9500; }
.sp-idle { background: var(--bg-grouped); color: var(--text-secondary); }
.sp-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; animation: blink 1.2s ease infinite; }
.sp-dot.rec { background: #FF3B30; }

/* Large circle mic button */
.mic-circle-wrap { display: flex; justify-content: center; padding: 4px 0; }
.mic-circle {
  width: 72px; height: 72px; border-radius: 50%; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 200ms; flex-shrink: 0;
}
.mic-circle.user-turn {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white; box-shadow: 0 8px 24px rgba(0,122,255,0.4);
}
.mic-circle.recording {
  background: linear-gradient(135deg, #FF3B30, #FF9500);
  color: white; box-shadow: 0 8px 24px rgba(255,59,48,0.4);
  animation: pulse-expand 1.2s ease infinite;
}
.mic-circle.disabled { background: rgba(118,118,128,0.12); color: #C7C7CC; cursor: not-allowed; }

.ended-area { text-align:center; padding: 6px 0; }
.ended-icon { font-size:36px; margin-bottom:6px; }
.end-btn { width:100%; padding:10px; border-radius:10px; border:none; cursor:pointer; background:rgba(255,59,48,.08); color:#FF3B30; font-size:14px; font-weight:500; }
</style>
