<!-- ## 知识问答会话页（练习模式）：三栏布局，录音→评分→参考答案 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { qaApi, uploadApi } from '@/api'
import { showToast } from '@/composables/toast'
import type { Question, QaSession } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const taskId = route.params.id as string

const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const loading = ref(true)
const session = ref<QaSession | null>(null)
const currentIdx = ref(0)
const questions = ref<Question[]>([])
const answers = ref<Array<{
  questionId: string; audioFileId: string; transcribed: string
  score: number | null; feedback: string | null; referenceAnswer: string
}>>([])

const showRef = ref<Record<number, boolean>>({})
const recording = ref(false)
const audioBlob = ref<Blob | null>(null)
const audioUrl = ref('')
const submitting = ref(false)
const asrFailed = ref(false)
const textOverride = ref('')

let mediaRecorder: MediaRecorder | null = null
let stream: MediaStream | null = null

// 统计
const answeredCount = computed(() => answers.value.filter(a => a.score !== null).length)
const avgScore = computed(() => {
  const scored = answers.value.filter(a => a.score !== null)
  if (!scored.length) return null
  const total = scored.reduce((s, a) => s + (a.score as number), 0)
  const maxTotal = scored.reduce((s, _, i) => s + (questions.value[i]?.max_score || 10), 0)
  return maxTotal > 0 ? Math.round((total / maxTotal) * 100) : null
})

onMounted(async () => {
  try {
    const res = await qaApi.startSession({ task_id: taskId, mode: 'practice' })
    session.value = res
    questions.value = res.questions || []
    answers.value = questions.value.map((q: Question) => ({
      questionId: q.id || q.question_id || '',
      audioFileId: '', transcribed: '',
      score: null, feedback: null, referenceAnswer: '',
    }))
  } catch (e: any) {
    showToast('启动问答失败: ' + (e?.response?.data?.detail || '请重试'), 'error')
  }
  loading.value = false
})

const currentQuestion = () => questions.value[currentIdx.value]
const currentAnswer = () => answers.value[currentIdx.value]

function scoreLevel(score: number, maxScore: number): 'excellent' | 'pass' | 'below' {
  const pct = maxScore > 0 ? score / maxScore : 0
  if (pct >= 0.85) return 'excellent'
  if (pct >= 0.6) return 'pass'
  return 'below'
}
function scoreLevelLabel(lv: 'excellent' | 'pass' | 'below') {
  return { excellent: '优秀', pass: '合格', below: '待提升' }[lv]
}
function scoreLevelColor(lv: 'excellent' | 'pass' | 'below') {
  return { excellent: '#34C759', pass: '#007AFF', below: '#FF9500' }[lv]
}

async function startRecording() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    const chunks: BlobPart[] = []
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.onstop = async () => {
      audioBlob.value = new Blob(chunks, { type: 'audio/webm' })
      audioUrl.value = URL.createObjectURL(audioBlob.value)
      stream?.getTracks().forEach(t => t.stop())
    }
    mediaRecorder.start()
    recording.value = true
  } catch {
    showToast('无法访问麦克风', 'error')
  }
}

function stopRecording() {
  mediaRecorder?.stop()
  recording.value = false
}

function resetRecording() {
  audioBlob.value = null
  audioUrl.value = ''
  asrFailed.value = false
  textOverride.value = ''
}

async function submitAnswer() {
  if (!session.value) return
  if (!asrFailed.value && !audioBlob.value) return
  submitting.value = true
  try {
    const q = currentQuestion()
    let payload: any = {
      submission_id: session.value.submission_id,
      question_id: q.id,
      question_order: currentIdx.value,
      mode: 'practice',
    }
    if (asrFailed.value) {
      if (!textOverride.value.trim()) { showToast('请输入回答内容', 'error'); submitting.value = false; return }
      payload.audio_file_id = 'fallback'
      payload.text_override = textOverride.value.trim()
    } else {
      const uploaded = await uploadApi.uploadAudio(
        new File([audioBlob.value!], 'recording.webm', { type: 'audio/webm' })
      )
      payload.audio_file_id = uploaded.id
    }
    const result = await qaApi.submitAnswer(payload)
    answers.value[currentIdx.value] = {
      ...answers.value[currentIdx.value],
      audioFileId: payload.audio_file_id,
      transcribed: result.transcribed_text || textOverride.value,
      score: result.score,
      feedback: result.feedback || '',
      referenceAnswer: result.reference_answer || '',
    }
    asrFailed.value = false
    textOverride.value = ''
    showToast('回答已提交', 'success')
  } catch (e: any) {
    const httpStatus = e?.response?.status
    const msg: string = e?.response?.data?.detail || e?.message || ''
    if (!asrFailed.value && (httpStatus === 503 || msg.includes('语音识别'))) {
      asrFailed.value = true
      showToast('语音识别暂不可用，请输入文字作答', 'error')
    } else {
      showToast('提交失败: ' + msg, 'error')
    }
  }
  submitting.value = false
}

async function nextQuestion() {
  if (currentIdx.value < questions.value.length - 1) {
    currentIdx.value++
    resetRecording()
    await nextTick()
  }
}

async function finishSession() {
  if (!session.value) return
  try {
    await qaApi.completeSession({ submission_id: session.value.submission_id })
    router.replace(`/qa/${session.value.submission_id}/result`)
  } catch {
    router.replace(`/qa/${session.value.submission_id}/result`)
  }
}
</script>

<template>
  <!-- ========== PC 三栏布局 ========== -->
  <div v-if="isPC" class="pc-qa-wrap">
    <!-- Sub-header -->
    <div class="pc-qa-subheader">
      <div class="subheader-left">
        <div class="sh-title">知识问答 · 练习模式</div>
        <div class="sh-sub">第 {{ currentIdx + 1 }} 题，共 {{ questions.length }} 题</div>
      </div>
      <div class="subheader-stats">
        <div class="sh-stat">
          <span class="sh-stat-val">{{ answeredCount }}</span>
          <span class="sh-stat-label">已回答</span>
        </div>
        <div class="sh-stat-div" />
        <div class="sh-stat">
          <span class="sh-stat-val">{{ avgScore !== null ? avgScore + '%' : '--' }}</span>
          <span class="sh-stat-label">平均得分</span>
        </div>
      </div>
      <div style="flex:1" />
      <button class="exit-btn" @click="router.back()">退出练习</button>
    </div>

    <div v-if="loading" class="empty-state"><div class="spinner" /></div>
    <div v-else-if="currentQuestion()" class="pc-qa-columns">

      <!-- ── 左栏：题目导航 ── -->
      <div class="pc-qa-left">
        <div class="nav-stats-row">
          <span class="nav-stat-item"><span class="nav-stat-num green">{{ answeredCount }}</span> 已回答</span>
          <span class="nav-stat-item"><span class="nav-stat-num gray">{{ questions.length - answeredCount }}</span> 未回答</span>
        </div>
        <div class="q-bubble-grid">
          <div
            v-for="(q, i) in questions" :key="i"
            class="q-bubble"
            :class="{
              'q-bubble--current': i === currentIdx,
              'q-bubble--answered': answers[i]?.score !== null,
              'q-bubble--excellent': answers[i]?.score !== null && scoreLevel(answers[i].score!, q.max_score) === 'excellent',
              'q-bubble--pass': answers[i]?.score !== null && scoreLevel(answers[i].score!, q.max_score) === 'pass',
              'q-bubble--below': answers[i]?.score !== null && scoreLevel(answers[i].score!, q.max_score) === 'below',
            }"
            @click="currentIdx = i; resetRecording()"
          >{{ i + 1 }}</div>
        </div>
        <div class="bubble-legend">
          <div class="legend-item"><span class="legend-dot green" />优秀</div>
          <div class="legend-item"><span class="legend-dot blue" />合格</div>
          <div class="legend-item"><span class="legend-dot orange" />待提升</div>
        </div>
      </div>

      <!-- ── 中栏：题目 + 录音 ── -->
      <div class="pc-qa-center">
        <!-- 题目卡 -->
        <div class="question-card card">
          <div class="q-top-row">
            <span class="q-num-tag">Q{{ String(currentIdx + 1).padStart(2, '0') }}</span>
            <span class="q-score-tag">{{ currentQuestion().max_score }} 分</span>
          </div>
          <div class="q-text">{{ currentQuestion().question_text }}</div>
        </div>

        <!-- 录音区 -->
        <div class="record-card card">
          <template v-if="!audioBlob && !asrFailed">
            <div class="record-center">
              <button
                class="record-btn-pc" :class="{ recording }"
                @click="recording ? stopRecording() : startRecording()"
                :disabled="submitting"
              >
                <div v-if="recording" class="pulse-ring" />
                <div class="record-btn-inner">
                  <AppIcon :name="recording ? 'stop' : 'mic'" :size="28" />
                </div>
              </button>
              <div class="record-status">
                <span v-if="recording" class="rec-live">
                  <span class="rec-dot-anim" />录音中...点击停止
                </span>
                <span v-else>点击开始录音回答</span>
              </div>
            </div>
          </template>
          <template v-else-if="audioBlob">
            <div class="audio-preview-area">
              <div class="audio-label">录音回放</div>
              <audio :src="audioUrl" controls style="width:100%;margin-top:8px" />
              <button class="re-record-btn" @click="resetRecording()">重新录音</button>
            </div>
          </template>
          <template v-else-if="asrFailed">
            <div class="asr-fallback-inner">
              <div class="asr-label">语音识别不可用，请输入回答</div>
              <textarea v-model="textOverride" class="text-answer" placeholder="请在此输入您的回答..." rows="5" />
            </div>
          </template>
        </div>

        <!-- 操作按钮 -->
        <div class="center-actions">
          <button
            v-if="(audioBlob || asrFailed) && !submitting && currentAnswer().score === null"
            class="btn-primary" style="height:44px"
            @click="submitAnswer"
          >提交回答</button>
          <button
            v-if="currentAnswer().score !== null && currentIdx < questions.length - 1"
            class="btn-primary" style="height:44px"
            @click="nextQuestion"
          >下一题 ›</button>
          <button
            v-if="currentAnswer().score !== null && currentIdx === questions.length - 1"
            class="btn-primary finish-btn" style="height:44px"
            @click="finishSession"
          >完成练习</button>
          <div v-if="submitting" class="submitting-row">
            <div class="spinner" style="width:18px;height:18px;border-width:2px" />
            AI 评分中...
          </div>
        </div>
      </div>

      <!-- ── 右栏：评分 + 评语 + 参考答案 ── -->
      <div class="pc-qa-right">
        <template v-if="currentAnswer().score !== null">
          <!-- 分数卡 -->
          <div class="score-card" :class="scoreLevel(currentAnswer().score!, currentQuestion().max_score)">
            <div class="score-big">
              {{ currentAnswer().score }}
              <span class="score-max-small">/{{ currentQuestion().max_score }}</span>
            </div>
            <div class="score-badge-tag" :style="{ background: scoreLevelColor(scoreLevel(currentAnswer().score!, currentQuestion().max_score)) }">
              {{ scoreLevelLabel(scoreLevel(currentAnswer().score!, currentQuestion().max_score)) }}
            </div>
          </div>

          <!-- 识别文本 -->
          <div v-if="currentAnswer().transcribed" class="right-block">
            <div class="right-block-title">我的回答</div>
            <div class="right-block-text muted">{{ currentAnswer().transcribed }}</div>
          </div>

          <!-- AI评语 -->
          <div v-if="currentAnswer().feedback" class="right-block feedback-block">
            <div class="right-block-title">AI 评语</div>
            <div class="right-block-text">{{ currentAnswer().feedback }}</div>
          </div>

          <!-- 参考答案（可折叠） -->
          <div v-if="currentAnswer().referenceAnswer" class="right-block ref-block">
            <button class="ref-toggle-btn" @click="showRef[currentIdx] = !showRef[currentIdx]">
              <span>参考答案</span>
              <AppIcon :name="showRef[currentIdx] ? 'chevron-up' : 'chevron-down'" :size="14" />
            </button>
            <div v-show="showRef[currentIdx]" class="ref-answer-text">
              {{ currentAnswer().referenceAnswer }}
            </div>
          </div>
        </template>
        <template v-else>
          <div class="right-empty">
            <div class="right-empty-icon">💬</div>
            <div class="right-empty-text">录音并提交后<br>AI 评分将在这里显示</div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- ========== Mobile Layout ========== -->
  <div v-else class="page-container">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <span class="page-title">知识问答</span>
      <span class="progress-text">{{ currentIdx + 1 }}/{{ questions.length }}</span>
    </div>

    <div v-if="loading" class="empty-state"><div class="spinner" /></div>

    <template v-else-if="currentQuestion()">
      <!-- 进度条 -->
      <div class="qa-progress-bar">
        <div class="qa-progress-fill" :style="{ width: ((answeredCount) / questions.length * 100) + '%' }" />
      </div>

      <!-- 题目 -->
      <div class="section">
        <div class="question-card card">
          <div class="q-top-row">
            <span class="q-num-tag">Q{{ String(currentIdx + 1).padStart(2, '0') }}</span>
            <span class="q-score-tag">{{ currentQuestion().max_score }} 分</span>
          </div>
          <div class="q-text">{{ currentQuestion().question_text }}</div>
        </div>
      </div>

      <!-- 录音 -->
      <div class="section">
        <div class="record-card card">
          <template v-if="!audioBlob && !asrFailed">
            <div class="record-center">
              <button
                class="record-btn-mobile" :class="{ recording }"
                @click="recording ? stopRecording() : startRecording()"
                :disabled="submitting"
              >
                <div v-if="recording" class="pulse-ring" />
                <div class="record-btn-inner">
                  <AppIcon :name="recording ? 'stop' : 'mic'" :size="32" />
                </div>
              </button>
              <div class="record-status">
                <span v-if="recording" class="rec-live"><span class="rec-dot-anim" />录音中...点击停止</span>
                <span v-else>点击开始录音回答</span>
              </div>
            </div>
          </template>
          <template v-else-if="audioBlob">
            <div class="audio-preview-area">
              <div class="audio-label">录音回放</div>
              <audio :src="audioUrl" controls style="width:100%;margin-top:8px" />
              <button class="re-record-btn" @click="resetRecording()">重新录音</button>
            </div>
          </template>
          <template v-else-if="asrFailed">
            <div class="asr-fallback-inner">
              <div class="asr-label">请输入您的回答</div>
              <textarea v-model="textOverride" class="text-answer" placeholder="请在此输入您的回答..." rows="4" />
            </div>
          </template>
        </div>

        <div style="display:flex;gap:10px;margin-top:12px">
          <button
            v-if="(audioBlob || asrFailed) && !submitting && currentAnswer().score === null"
            class="btn-primary" style="flex:1;height:46px"
            @click="submitAnswer"
          >提交回答</button>
        </div>
        <div v-if="submitting" class="empty-state" style="padding:20px">
          <div class="spinner" /><div class="msg">AI 评分中...</div>
        </div>
      </div>

      <!-- 评分反馈 -->
      <div class="section" v-if="currentAnswer().score !== null">
        <div class="score-card-mobile" :class="scoreLevel(currentAnswer().score!, currentQuestion().max_score)">
          <div class="scm-top">
            <div class="score-big-mobile">
              {{ currentAnswer().score }}
              <span class="score-max-mobile">/{{ currentQuestion().max_score }}</span>
            </div>
            <div class="score-badge-tag" :style="{ background: scoreLevelColor(scoreLevel(currentAnswer().score!, currentQuestion().max_score)) }">
              {{ scoreLevelLabel(scoreLevel(currentAnswer().score!, currentQuestion().max_score)) }}
            </div>
          </div>
          <div v-if="currentAnswer().transcribed" class="right-block" style="margin-top:12px">
            <div class="right-block-title">识别文本</div>
            <div class="right-block-text muted">{{ currentAnswer().transcribed }}</div>
          </div>
          <div v-if="currentAnswer().feedback" class="right-block feedback-block" style="margin-top:10px">
            <div class="right-block-title">AI 评语</div>
            <div class="right-block-text">{{ currentAnswer().feedback }}</div>
          </div>
          <!-- 参考答案 折叠 -->
          <div v-if="currentAnswer().referenceAnswer" style="margin-top:12px;border-top:1px solid var(--separator);padding-top:12px">
            <button class="ref-toggle-btn" @click="showRef[currentIdx] = !showRef[currentIdx]">
              <span>参考答案（仅练习可见）</span>
              <AppIcon :name="showRef[currentIdx] ? 'chevron-up' : 'chevron-down'" :size="14" />
            </button>
            <div v-show="showRef[currentIdx]" class="ref-answer-text" style="margin-top:8px">
              {{ currentAnswer().referenceAnswer }}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:12px">
          <button v-if="currentIdx < questions.length - 1" class="btn-primary" style="flex:1;height:46px" @click="nextQuestion">下一题</button>
          <button v-else class="btn-primary finish-btn" style="flex:1;height:46px" @click="finishSession">完成练习</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── PC Wrap ── */
.pc-qa-wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.pc-qa-subheader {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 20px; flex-shrink: 0;
  background: white; border-bottom: 1px solid var(--separator);
}
.subheader-left {}
.sh-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.sh-sub { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }
.subheader-stats { display: flex; align-items: center; gap: 16px; margin-left: 16px; }
.sh-stat { display: flex; flex-direction: column; align-items: center; }
.sh-stat-val { font-size: 18px; font-weight: 800; color: var(--text-primary); line-height: 1; }
.sh-stat-label { font-size: 10px; color: var(--text-3); margin-top: 2px; }
.sh-stat-div { width: 1px; height: 28px; background: var(--separator); }
.exit-btn {
  padding: 7px 14px; border-radius: 8px;
  background: rgba(255,59,48,0.08); color: #FF3B30;
  border: none; font-size: 13px; font-weight: 600; cursor: pointer;
}

/* ── Columns ── */
.pc-qa-columns {
  flex: 1; display: grid;
  grid-template-columns: 220px 1fr 280px;
  overflow: hidden;
}

/* ── Left nav ── */
.pc-qa-left {
  background: white; border-right: 1px solid var(--separator);
  padding: 16px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px;
}
.nav-stats-row {
  display: flex; gap: 12px;
  background: var(--bg-grouped); border-radius: 10px; padding: 10px 12px;
}
.nav-stat-item { font-size: 12px; color: var(--text-secondary); }
.nav-stat-num { font-weight: 800; margin-right: 3px; font-size: 14px; }
.nav-stat-num.green { color: #34C759; }
.nav-stat-num.gray { color: var(--text-3); }

.q-bubble-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.q-bubble {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; cursor: pointer;
  background: var(--bg-grouped); color: var(--text-secondary);
  border: 2px solid transparent; transition: all 150ms;
}
.q-bubble:hover { border-color: var(--border); }
.q-bubble--current { border-color: var(--color-primary); color: var(--color-primary); background: rgba(0,122,255,0.08); }
.q-bubble--excellent { background: rgba(52,199,89,0.15); color: #34C759; border-color: #34C759; }
.q-bubble--pass { background: rgba(0,122,255,0.12); color: #007AFF; border-color: #007AFF; }
.q-bubble--below { background: rgba(255,149,0,0.12); color: #FF9500; border-color: #FF9500; }

.bubble-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-3); }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-dot.green { background: #34C759; }
.legend-dot.blue { background: #007AFF; }
.legend-dot.orange { background: #FF9500; }

/* ── Center ── */
.pc-qa-center { padding: 20px; overflow-y: auto; background: var(--bg-system, #F2F2F7); display: flex; flex-direction: column; gap: 14px; }

.question-card { padding: 20px; }
.q-top-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.q-num-tag {
  font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
  color: var(--color-primary); background: rgba(0,122,255,0.1);
  padding: 3px 10px; border-radius: 20px;
}
.q-score-tag {
  font-size: 11px; font-weight: 700; color: var(--text-3);
  background: var(--bg-grouped); padding: 3px 10px; border-radius: 20px;
}
.q-text { font-size: 17px; font-weight: 600; color: var(--text-primary); line-height: 1.65; }

.record-card { padding: 28px 20px; }
.record-center { display: flex; flex-direction: column; align-items: center; gap: 14px; }

.record-btn-pc {
  position: relative; width: 72px; height: 72px;
  border: none; cursor: pointer; background: none;
}
.record-btn-mobile {
  position: relative; width: 80px; height: 80px;
  border: none; cursor: pointer; background: none;
}
.record-btn-inner {
  position: absolute; inset: 0; border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  display: flex; align-items: center; justify-content: center;
  color: white; z-index: 2;
  box-shadow: 0 8px 24px rgba(0,122,255,0.3);
  transition: all 200ms;
}
.recording .record-btn-inner {
  background: linear-gradient(135deg, #FF3B30, #FF9500);
  box-shadow: 0 8px 24px rgba(255,59,48,0.3);
}
.pulse-ring {
  position: absolute; inset: -8px; border-radius: 50%;
  background: rgba(255,59,48,0.2);
  animation: pulse-ring-anim 1.2s ease-out infinite;
  z-index: 1;
}
@keyframes pulse-ring-anim {
  0% { transform: scale(0.9); opacity: 0.8; }
  100% { transform: scale(1.3); opacity: 0; }
}
.record-status { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
.rec-live { color: #FF3B30; display: flex; align-items: center; gap: 6px; font-weight: 600; }
.rec-dot-anim {
  width: 8px; height: 8px; border-radius: 50%; background: #FF3B30;
  animation: blink 0.8s ease infinite;
  flex-shrink: 0;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

.audio-preview-area { display: flex; flex-direction: column; gap: 8px; }
.audio-label { font-size: 12px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
.re-record-btn {
  align-self: flex-start; font-size: 13px; font-weight: 500;
  color: var(--color-primary); background: rgba(0,122,255,0.08);
  padding: 5px 12px; border-radius: 8px; border: none; cursor: pointer; margin-top: 4px;
}

.asr-fallback-inner { display: flex; flex-direction: column; gap: 8px; }
.asr-label { font-size: 13px; color: var(--text-secondary); }
.text-answer {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid var(--separator); border-radius: 10px;
  padding: 10px 12px; font-size: 14px; color: var(--text-1);
  background: var(--bg-grouped); resize: vertical; outline: none; line-height: 1.6;
}
.text-answer:focus { border-color: var(--color-primary); }

.center-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.submitting-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
.finish-btn { background: linear-gradient(135deg, #34C759, #30B350) !important; }

/* ── Right panel ── */
.pc-qa-right { background: white; border-left: 1px solid var(--separator); padding: 16px; overflow-y: auto; }

.score-card {
  border-radius: 14px; padding: 20px;
  text-align: center; margin-bottom: 14px;
}
.score-card.excellent { background: linear-gradient(135deg, rgba(52,199,89,0.1), rgba(52,199,89,0.05)); border: 1px solid rgba(52,199,89,0.2); }
.score-card.pass { background: linear-gradient(135deg, rgba(0,122,255,0.1), rgba(0,122,255,0.05)); border: 1px solid rgba(0,122,255,0.2); }
.score-card.below { background: linear-gradient(135deg, rgba(255,149,0,0.1), rgba(255,149,0,0.05)); border: 1px solid rgba(255,149,0,0.2); }

.score-big { font-size: 40px; font-weight: 900; color: var(--text-primary); line-height: 1; letter-spacing: -1px; }
.score-max-small { font-size: 18px; font-weight: 500; color: var(--text-3); }
.score-badge-tag {
  display: inline-block; color: white; font-size: 12px; font-weight: 700;
  padding: 3px 12px; border-radius: 20px; margin-top: 8px;
}

.right-block { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.right-block-title { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.4px; }
.right-block-text { font-size: 13px; color: var(--text-primary); line-height: 1.6; }
.right-block-text.muted { color: var(--text-secondary); background: var(--bg-grouped); padding: 8px 10px; border-radius: 8px; }
.feedback-block .right-block-text { color: var(--text-primary); }

.ref-toggle-btn {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-radius: 8px;
  background: rgba(0,122,255,0.06); color: var(--color-primary);
  font-size: 13px; font-weight: 600; border: none; cursor: pointer;
}
.ref-answer-text {
  font-size: 13px; color: var(--text-primary); line-height: 1.6;
  background: rgba(0,122,255,0.04); border-left: 3px solid var(--color-primary);
  padding: 8px 12px; border-radius: 0 8px 8px 0; margin-top: 8px;
}

.right-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 200px; gap: 10px; text-align: center;
}
.right-empty-icon { font-size: 36px; }
.right-empty-text { font-size: 13px; color: var(--text-3); line-height: 1.6; }

/* ── Mobile ── */
.progress-text { font-size: 13px; color: var(--text-3); font-weight: 600; }
.qa-progress-bar { height: 4px; background: var(--bg-grouped); }
.qa-progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), #5856D6); transition: width 0.4s ease; }

.score-card-mobile {
  border-radius: 14px; padding: 16px;
}
.score-card-mobile.excellent { background: rgba(52,199,89,0.08); border: 1px solid rgba(52,199,89,0.2); }
.score-card-mobile.pass { background: rgba(0,122,255,0.08); border: 1px solid rgba(0,122,255,0.2); }
.score-card-mobile.below { background: rgba(255,149,0,0.08); border: 1px solid rgba(255,149,0,0.2); }
.scm-top { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.score-big-mobile { font-size: 36px; font-weight: 900; color: var(--text-primary); line-height: 1; }
.score-max-mobile { font-size: 16px; color: var(--text-3); font-weight: 500; }
</style>
