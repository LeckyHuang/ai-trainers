<!-- ## 角色库：创建/编辑虚拟角色，触发 AI 画像生成（调用 LLM 推导大五人格） -->
<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { personasApi, filesApi, ttsApi } from '@/api'
import type { Persona } from '@/api/types'
import Modal from '@/components/Modal.vue'
import AdminIcon from '@/components/AdminIcon.vue'
import { showToast } from '@/composables/toast'

const personas = ref<Persona[]>([])
const total = ref(0)
const loading = ref(false)

const showModal = ref(false)
const editTarget = ref<Persona | null>(null)
const currentPersonaId = ref<string | null>(null)
const savingInfo = ref(false)
const generating = ref(false)
const generatedCard = ref<any>(null)

const form = ref({
  name: '',
  gender: '男',
  industry: '',
  role: '',
  character: '',
  others: '',
  avatar_url: '',
  voice_id: '',
})

const avatarFileInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)
const generatingAvatar = ref(false)

// 音色列表：先用内置占位，onMounted 后从 API 拉取
const voiceOptions = ref<{ id: string; name: string; gender: string; style: string }[]>([])
const previewingVoice = ref<string | null>(null)   // 正在试听的 voice_id
let previewAudio: HTMLAudioElement | null = null

async function loadVoices() {
  try {
    const res = await ttsApi.voices()
    voiceOptions.value = res.voices || []
  } catch {
    // 降级：内置默认列表
    voiceOptions.value = [
      { id: 'male-qn-jingying', name: '精英男声', gender: 'male', style: '商务' },
      { id: 'male-qn-badao', name: '霸道总裁', gender: 'male', style: '霸气' },
      { id: 'female-yujie', name: '御姐音色', gender: 'female', style: '成熟' },
      { id: 'female-chengshu', name: '成熟女声', gender: 'female', style: '知性' },
    ]
  }
}

async function uploadAvatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingAvatar.value = true
  try {
    const res = await filesApi.upload(file)
    // 后端返回 storage_key，拼成 /uploads/{storage_key}
    form.value.avatar_url = res.storage_key ? `/uploads/${res.storage_key}` : (res.url || '')
    showToast('头像上传成功', 'success')
  } catch { showToast('上传失败', 'error') }
  uploadingAvatar.value = false
  if (avatarFileInput.value) avatarFileInput.value.value = ''
}

async function generateAvatar() {
  if (!currentPersonaId.value) { showToast('请先保存角色信息', 'error'); return }
  generatingAvatar.value = true
  try {
    // 先同步最新表单数据到后端
    await personasApi.update(currentPersonaId.value, buildPayload())
    const res = await personasApi.generateAvatar(currentPersonaId.value)
    form.value.avatar_url = res.avatar_url || ''
    await load()
    showToast('AI头像生成成功', 'success')
  } catch (e: any) { showToast(e?.detail || '生成失败，请稍后重试', 'error') }
  generatingAvatar.value = false
}

async function previewVoice(voiceId: string) {
  if (previewingVoice.value === voiceId) {
    previewAudio?.pause()
    previewAudio = null
    previewingVoice.value = null
    return
  }
  previewAudio?.pause()
  previewingVoice.value = voiceId
  try {
    // 带认证 header 拉取 arraybuffer，转成 blob URL 播放
    const res = await ttsApi.preview(voiceId)
    const blob = new Blob([res], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    previewAudio = new Audio(url)
    previewAudio.onended = () => { previewingVoice.value = null; URL.revokeObjectURL(url) }
    previewAudio.onerror = () => { previewingVoice.value = null; showToast('试听失败', 'error') }
    await previewAudio.play()
  } catch {
    previewingVoice.value = null
    showToast('试听失败，请确认 MiniMax API 已配置', 'error')
  }
}

const industryOptions = ['互联网/科技', '金融/银行', '制造业', '零售/快消', '医疗/健康', '教育/培训', '房地产', '咨询/服务', '其他']
const roleOptions = ['销售总监', '采购经理', '技术总监', 'CEO/总经理', '财务总监', '人事主管', '市场经理', '运营总监', '客户', '其他']

async function load() {
  loading.value = true
  try {
    const res = await personasApi.list({ page: 1, page_size: 50 })
    personas.value = res.items || []
    total.value = res.total || 0
  } catch { showToast('加载失败', 'error') }
  loading.value = false
}

onMounted(() => { load(); loadVoices() })

function buildPayload() {
  return {
    name: form.value.name.trim(),
    gender: form.value.gender,
    industry: form.value.industry,
    position: form.value.role,
    background: { character: form.value.character, others: form.value.others },
    avatar_url: form.value.avatar_url || undefined,
    voice_id: form.value.voice_id || undefined,
  }
}

function openCreate() {
  editTarget.value = null
  currentPersonaId.value = null
  generatedCard.value = null
  form.value = { name: '', gender: '男', industry: '', role: '', character: '', others: '', avatar_url: '', voice_id: '' }
  showModal.value = true
}

function openEdit(p: Persona) {
  editTarget.value = p
  currentPersonaId.value = p.id
  generatedCard.value = p.persona_card || null
  form.value = {
    name: p.name || '',
    gender: p.gender || '男',
    industry: p.industry || '',
    role: p.position || '',
    character: typeof p.background === 'object' && p.background?.character || '',
    others: typeof p.background === 'object' && p.background?.others || '',
    avatar_url: (p as any).avatar_url || '',
    voice_id: (p as any).voice_id || '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  currentPersonaId.value = null
}

async function savePersona() {
  if (!form.value.name.trim()) { showToast('请输入角色名称', 'error'); return }
  savingInfo.value = true
  try {
    const payload = buildPayload()
    if (currentPersonaId.value) {
      await personasApi.update(currentPersonaId.value, payload)
      showToast('角色信息已更新', 'success')
    } else {
      const created = await personasApi.create(payload)
      currentPersonaId.value = created.id
      showToast('角色已创建，可点击「AI 生成画像」继续', 'success')
    }
    await load()
  } catch (e: any) { showToast(e?.detail || '保存失败', 'error') }
  savingInfo.value = false
}

async function generateCard() {
  if (!currentPersonaId.value) { showToast('请先保存角色', 'error'); return }
  generating.value = true
  generatedCard.value = null
  try {
    await personasApi.update(currentPersonaId.value, buildPayload())
    const cardRes = await personasApi.generateCard(currentPersonaId.value)
    generatedCard.value = cardRes?.persona_card || cardRes
    await load()
    showToast('AI 画像生成成功', 'success')
  } catch (e: any) { showToast(e?.detail || e?.message || '生成失败', 'error') }
  generating.value = false
}

async function deletePersona(p: Persona) {
  if (!confirm(`确认删除角色「${p.name}」？`)) return
  try {
    await personasApi.delete(p.id)
    showToast('已删除', 'success')
    load()
  } catch { showToast('删除失败', 'error') }
}

// ## 试聊状态 ─────────────────────────────────────────────────────────────
const tryChatPersona = ref<Persona | null>(null)
const chatMessages = ref<{role: 'user'|'assistant'|'system'; content: string}[]>([])
const chatInput = ref('')
const chatLoading = ref(false)
const chatScrollRef = ref<HTMLElement | null>(null)

function openTryChat(p: Persona) {
  tryChatPersona.value = p
  chatMessages.value = [
    { role: 'system', content: `试聊场景 · 验证角色设定，不计入正式记录` }
  ]
}

function closeTryChat() {
  tryChatPersona.value = null
  chatMessages.value = []
  chatInput.value = ''
}

async function sendChat() {
  if (!chatInput.value.trim() || !tryChatPersona.value || chatLoading.value) return
  const userMsg = chatInput.value.trim()
  chatInput.value = ''
  chatMessages.value.push({ role: 'user', content: userMsg })
  chatLoading.value = true
  try {
    const apiMessages = chatMessages.value
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }))
    const res = await personasApi.tryChat(tryChatPersona.value.id, apiMessages)
    chatMessages.value.push({ role: 'assistant', content: res.reply })
  } catch { showToast('发送失败', 'error') }
  chatLoading.value = false
}

watch(chatMessages, () => nextTick(() => {
  if (chatScrollRef.value) chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
}), { deep: true })

const cardFields = [
  { key: 'role_description', label: '角色描述' },
  { key: 'motivation', label: '核心动机' },
  { key: 'focus', label: '关注重点' },
  { key: 'emotional_response_mode', label: '情绪反应' },
  { key: 'experience', label: '从业经验' },
]

function avatarGradient(p: Persona): string {
  if (p.gender === '女') return 'linear-gradient(135deg, #FF2D55, #FF9500)'
  return 'linear-gradient(135deg, #0066CC, #5856D6)'
}

function personaTags(p: Persona): string[] {
  if (typeof p.background === 'object' && p.background && typeof p.background.character === 'string') {
    return p.background.character
      .split(/[、，,]/)
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0)
      .slice(0, 3)
  }
  return []
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h2>角色库</h2>
        <span class="page-sub">共 {{ total }} 个角色</span>
      </div>
      <button class="btn-primary" @click="openCreate">+ 新建角色</button>
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>

    <div v-else-if="personas.length === 0" class="empty-state">
      <div class="empty-title">还没有角色</div>
      <div class="empty-sub">创建模拟对练中的 AI 扮演角色</div>
      <button class="btn-primary" @click="openCreate">+ 新建角色</button>
    </div>

    <div v-else class="persona-grid">
      <div v-for="p in personas" :key="p.id" class="persona-card">
        <div class="card-top">
          <div class="persona-avatar" :style="(p as any).avatar_url ? {} : { background: avatarGradient(p) }">
            <img v-if="(p as any).avatar_url" :src="(p as any).avatar_url" style="width:100%;height:100%;object-fit:cover;border-radius:50%" alt="" />
            <template v-else>{{ p.name.charAt(0) }}</template>
          </div>
          <div class="persona-info">
            <div class="persona-name">{{ p.name }}</div>
            <div class="persona-sub">{{ p.industry || '' }}{{ p.industry && p.position ? ' · ' : '' }}{{ p.position || (!p.industry ? '未设置职位' : '') }}</div>
          </div>
        </div>
        <div class="persona-tags" v-if="personaTags(p).length > 0">
          <span v-for="tag in personaTags(p)" :key="tag" class="ptag">{{ tag }}</span>
        </div>
        <div class="persona-tags" v-else>
          <span class="ptag no-tag">暂无标签</span>
        </div>

        <div class="usage-count">已用于 {{ (p as any).task_count ?? 0 }} 个任务</div>

        <div class="card-hover-actions">
          <button class="hover-btn edit-btn" @click="openEdit(p)">编辑</button>
          <button class="hover-btn try-btn" @click.stop="openTryChat(p)">试聊</button>
          <button class="hover-btn del-btn" @click.stop="deletePersona(p)">删除</button>
        </div>
      </div>
    </div>

    <!-- Create / Edit modal -->
    <Modal
      v-if="showModal"
      :title="editTarget ? '编辑角色' : '新建角色'"
      :width="740"
      @close="showModal = false"
    >
      <div class="modal-layout">
        <!-- Left: form -->
        <div class="form-panel">
          <!-- Avatar + Voice row -->
          <div class="avatar-voice-row">
            <div class="avatar-section">
              <div class="avatar-preview" @click="avatarFileInput?.click()">
                <img v-if="form.avatar_url" :src="form.avatar_url" class="avatar-img" alt="avatar" />
                <div v-else class="avatar-initials">{{ form.name.charAt(0) || '?' }}</div>
                <div class="avatar-overlay">
                  <span v-if="uploadingAvatar || generatingAvatar">
                    {{ generatingAvatar ? 'AI中...' : '上传中...' }}
                  </span>
                  <span v-else>更换</span>
                </div>
              </div>
              <input ref="avatarFileInput" type="file" accept="image/*" style="display:none" @change="uploadAvatar" />
              <button
                class="btn-gen-avatar"
                :disabled="!currentPersonaId || generatingAvatar"
                :title="!currentPersonaId ? '请先保存角色' : 'AI生成头像'"
                @click.stop="generateAvatar"
              >{{ generatingAvatar ? '生成中...' : '✦ AI 生成' }}</button>
            </div>
            <div class="voice-section">
              <label class="voice-label">角色声音 <span class="voice-powered">· MiniMax TTS</span></label>
              <div class="voice-select-row">
                <select v-model="form.voice_id" class="voice-select">
                  <option value="">请选择音色</option>
                  <option v-for="v in voiceOptions" :key="v.id" :value="v.id">
                    {{ v.name }}（{{ v.style }}）
                  </option>
                </select>
                <button
                  class="voice-preview-icon"
                  :class="{ previewing: previewingVoice === form.voice_id && form.voice_id }"
                  :disabled="!form.voice_id"
                  :title="previewingVoice === form.voice_id && form.voice_id ? '停止试听' : '试听音色'"
                  @click="form.voice_id ? previewVoice(form.voice_id) : undefined"
                >
                  <span v-if="previewingVoice === form.voice_id && form.voice_id">■</span>
                  <span v-else>▶</span>
                </button>
              </div>
              <div v-if="!form.voice_id" class="voice-hint">选择音色后可点击 ▶ 试听</div>
            </div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label>角色名称 <span class="required">*</span></label>
              <input v-model="form.name" placeholder="例如：张总" />
            </div>
            <div class="field">
              <label>性别</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" v-model="form.gender" value="男" />
                  <span>男</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="form.gender" value="女" />
                  <span>女</span>
                </label>
              </div>
            </div>
            <div class="field">
              <label>行业</label>
              <select v-model="form.industry">
                <option value="">请选择行业</option>
                <option v-for="opt in industryOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="field">
              <label>职位 / 身份</label>
              <select v-model="form.role">
                <option value="">请选择职位</option>
                <option v-for="opt in roleOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="field">
              <label>性格特点</label>
              <textarea v-model="form.character" placeholder="用自然语言描述角色性格，如：务实、注重数据、不轻易妥协..." rows="3" />
            </div>
            <div class="field">
              <label>其他补充（可选）</label>
              <textarea v-model="form.others" placeholder="职业背景、过往业绩、重点关注等" rows="2" />
            </div>
          </div>
        </div>

        <!-- Right: generated card result -->
        <div class="result-panel">
          <div class="result-label">AI 角色画像</div>
          <div v-if="generating" class="result-loading">
            <div class="spin-dot" />
            <span>AI 正在生成角色画像...</span>
          </div>
          <div v-else-if="generatedCard" class="result-card">
            <div v-for="field in cardFields" :key="field.key" class="result-field" v-show="generatedCard[field.key]">
              <div class="rf-label">{{ field.label }}</div>
              <div class="rf-val">{{ generatedCard[field.key] }}</div>
            </div>
          </div>
          <div v-else class="result-placeholder">
            <div class="placeholder-icon">
              <AdminIcon name="persona" />
            </div>
            <div class="placeholder-text">填写左侧信息后点击「生成角色」，<br/>AI 将自动生成结构化画像</div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="closeModal">关闭</button>
        <button class="btn-save" :disabled="savingInfo" @click="savePersona">
          {{ savingInfo ? '保存中...' : '保存角色' }}
        </button>
        <button class="btn-primary" :disabled="!currentPersonaId || generating" @click="generateCard">
          {{ generating ? '生成中...' : 'AI 生成画像' }}
        </button>
      </template>
    </Modal>
  </div>

  <!-- Try-chat modal -->
  <Teleport to="body">
    <div v-if="tryChatPersona" class="try-chat-overlay" @click.self="closeTryChat">
      <div class="try-chat-modal">
        <!-- Header -->
        <div class="tc-header">
          <div class="tc-avatar">{{ tryChatPersona.name.charAt(0) }}</div>
          <div class="tc-header-info">
            <div class="tc-title">
              试聊 · {{ tryChatPersona.name }}
              <span class="tc-unsaved-pill">验证中</span>
            </div>
            <div class="tc-subtitle">验证设定后再保存到角色库 · 试聊不计入正式记录</div>
          </div>
          <div style="flex:1"/>
          <button class="tc-close" @click="closeTryChat">✕</button>
        </div>

        <!-- Body: 2-column -->
        <div class="tc-body">
          <!-- Left: chat transcript -->
          <div class="tc-chat" ref="chatScrollRef">
            <template v-for="(m, i) in chatMessages" :key="i">
              <div v-if="m.role === 'system'" class="tc-sys-msg">{{ m.content }}</div>
              <div v-else :class="['tc-bubble-row', m.role === 'user' ? 'user' : 'ai']">
                <div class="tc-bubble" :class="m.role">{{ m.content }}</div>
              </div>
            </template>
            <div v-if="chatLoading" class="tc-bubble-row ai">
              <div class="tc-bubble ai tc-typing">···</div>
            </div>
          </div>

          <!-- Right: persona info panel -->
          <div class="tc-panel">
            <div class="tc-panel-section">
              <div class="tc-panel-title">角色设定</div>
              <div class="tc-info-row"><span>行业</span><span>{{ tryChatPersona.industry || '—' }}</span></div>
              <div class="tc-info-row"><span>职位</span><span>{{ tryChatPersona.position || '—' }}</span></div>
              <div class="tc-info-row"><span>性别</span><span>{{ tryChatPersona.gender || '—' }}</span></div>
              <div class="tc-info-row"><span>年龄</span><span>{{ tryChatPersona.age ? tryChatPersona.age + '岁' : '—' }}</span></div>
            </div>
            <div class="tc-divider"/>
            <div class="tc-panel-section">
              <div class="tc-panel-title">性格标签</div>
              <div class="tc-tags">
                <template v-if="typeof tryChatPersona.background === 'object' && tryChatPersona.background?.character">
                  <span
                    v-for="t in String(tryChatPersona.background.character).split(/[、，,]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0).slice(0, 5)"
                    :key="t"
                    class="tc-tag"
                  >{{ t }}</span>
                </template>
                <span v-else style="font-size:11px;color:var(--text-tertiary)">暂无标签</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer: input -->
        <div class="tc-footer">
          <div class="tc-input-wrap">
            <input
              v-model="chatInput"
              class="tc-input"
              placeholder="输入你的回应..."
              @keydown.enter.prevent="sendChat"
              :disabled="chatLoading"
            />
          </div>
          <button class="btn-primary tc-send" @click="sendChat" :disabled="chatLoading || !chatInput.trim()">
            {{ chatLoading ? '···' : '发送' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; height: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-sub { font-size: 12px; color: var(--text-tertiary); display: block; margin-top: 2px; }
.loading-state { text-align: center; color: var(--text-tertiary); padding: 60px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 80px; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.empty-sub { font-size: 13px; color: var(--text-tertiary); }

.persona-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 1200px) { .persona-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .persona-grid { grid-template-columns: repeat(2, 1fr); } }

.persona-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-1);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 200ms, transform 200ms;
  cursor: default;
  position: relative;
  overflow: hidden;
}
.persona-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.10); transform: translateY(-2px); }
.persona-card:hover .card-hover-actions { opacity: 1; pointer-events: all; }

.card-top { display: flex; align-items: center; gap: 10px; }
.persona-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: white;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.persona-info { flex: 1; min-width: 0; }
.persona-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.persona-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.persona-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.ptag { font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: rgba(0,102,204,0.10); color: var(--color-primary); font-weight: 500; }
.ptag.no-tag { background: var(--bg-grouped); color: var(--text-tertiary); }

.usage-count { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.card-hover-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms;
}
.hover-btn {
  height: 30px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  border: none;
  transition: opacity 120ms;
}
.edit-btn { background: var(--bg-grouped); color: var(--text-primary); border: 1px solid var(--border); }
.edit-btn:hover { background: var(--bg-selected); }
.del-btn { background: rgba(255,59,48,0.1); color: #FF3B30; border: 1px solid rgba(255,59,48,0.2); }
.del-btn:hover { background: rgba(255,59,48,0.18); }

/* Modal layout */
.modal-layout { display: flex; gap: 20px; min-height: 360px; }
.form-panel { flex: 1; min-width: 0; }
.result-panel { width: 260px; flex-shrink: 0; background: var(--bg-grouped); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.result-label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }

.result-loading { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--text-secondary); font-size: 13px; }
.spin-dot { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.result-card { display: flex; flex-direction: column; gap: 10px; }
.result-field {}
.rf-label { font-size: 10px; font-weight: 700; color: var(--text-tertiary); margin-bottom: 2px; }
.rf-val { font-size: 12px; color: var(--text-primary); line-height: 1.5; }

.result-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-tertiary); }
.placeholder-icon { opacity: 0.3; }
.placeholder-text { font-size: 12px; text-align: center; line-height: 1.6; }

/* Avatar + Voice row */
.avatar-voice-row { display: flex; align-items: flex-start; gap: 20px; padding-bottom: 16px; margin-bottom: 4px; border-bottom: 1px solid var(--separator); }
.avatar-section { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.avatar-preview { position: relative; width: 80px; height: 100px; border-radius: 10px; overflow: hidden; cursor: pointer; flex-shrink: 0; border: 2px solid var(--border); }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: white; background: linear-gradient(135deg, #0066CC, #5856D6); }
.avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: 600; opacity: 0; transition: opacity 150ms; }
.avatar-preview:hover .avatar-overlay { opacity: 1; }
.btn-gen-avatar {
  width: 80px; height: 26px; border-radius: 6px; border: 1px solid #AF52DE;
  background: linear-gradient(135deg, rgba(88,86,214,0.08), rgba(175,82,222,0.08));
  color: #5856D6; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: all 120ms;
}
.btn-gen-avatar:hover:not(:disabled) { background: linear-gradient(135deg, #5856D6, #AF52DE); color: white; }
.btn-gen-avatar:disabled { opacity: 0.4; cursor: not-allowed; }

.voice-section { flex: 1; display: flex; flex-direction: column; gap: 6px; padding-top: 4px; min-width: 0; }
.voice-label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.voice-powered { font-size: 10px; font-weight: 400; color: var(--text-tertiary); }

/* Voice select row */
.voice-select-row { display: flex; align-items: center; gap: 8px; }
.voice-select { flex: 1; height: 36px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: white; font-size: 13px; color: var(--text-primary); font-family: inherit; cursor: pointer; }
.voice-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,102,204,0.1); outline: none; }
.voice-preview-icon {
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border-strong);
  background: var(--bg-grouped); cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  color: var(--text-secondary); transition: all 120ms;
}
.voice-preview-icon:hover:not(:disabled) { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.voice-preview-icon.previewing { background: var(--color-success, #34C759); color: white; border-color: var(--color-success, #34C759); }
.voice-preview-icon:disabled { opacity: 0.4; cursor: not-allowed; }

.voice-hint { font-size: 10px; color: var(--text-tertiary); }

/* Form */
.form-grid { display: flex; flex-direction: column; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.required { color: var(--color-danger); }
input[type="text"], input:not([type]), select, textarea {
  padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-strong);
  background: white; font-size: 13px; color: var(--text-primary); font-family: inherit;
}
input:not([type="radio"]), select { height: 36px; }
textarea { resize: vertical; }
input:focus, select:focus, textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,102,204,0.1); outline: none; }

.radio-group { display: flex; gap: 16px; align-items: center; height: 36px; }
.radio-option { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; font-weight: 400; }
.radio-option input[type="radio"] { accent-color: var(--color-primary); cursor: pointer; }

.btn-primary { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--color-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary:hover { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); color: var(--text-primary); font-size: 13px; cursor: pointer; border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--bg-selected); }
.btn-save { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); color: var(--text-primary); font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-strong); }
.btn-save:hover { background: var(--bg-selected); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
/* hover button for try-chat */
.try-btn { background: var(--color-primary, #0066CC); color: white; border: none; }
.try-btn:hover { opacity: 0.88; }

/* Try-chat modal */
.try-chat-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.try-chat-modal {
  width: 760px; height: 580px; background: white;
  border-radius: 14px; box-shadow: var(--shadow-3);
  display: flex; flex-direction: column; overflow: hidden;
}
.tc-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; border-bottom: 1px solid var(--separator); flex-shrink: 0;
}
.tc-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #FF9500, #FF6B00);
  color: white; font-weight: 600; font-size: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tc-header-info { display: flex; flex-direction: column; }
.tc-title { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.tc-unsaved-pill {
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 10px;
  background: rgba(255,149,0,0.12); color: var(--color-warning, #FF9500);
}
.tc-subtitle { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.tc-close { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--text-secondary); cursor: pointer; background: transparent; border: none; }
.tc-close:hover { background: var(--bg-grouped); }

.tc-body { flex: 1; display: grid; grid-template-columns: 1fr 220px; overflow: hidden; }

.tc-chat {
  overflow-y: auto; padding: 16px; background: #F5F5F7;
  display: flex; flex-direction: column; gap: 10px;
}
.tc-sys-msg {
  align-self: center; font-size: 11px; color: var(--text-tertiary);
  padding: 3px 10px; background: rgba(118,118,128,0.10); border-radius: 10px;
}
.tc-bubble-row { display: flex; }
.tc-bubble-row.user { justify-content: flex-end; }
.tc-bubble-row.ai { justify-content: flex-start; }
.tc-bubble {
  max-width: 80%; padding: 10px 14px; border-radius: 12px;
  font-size: 13px; line-height: 1.55;
}
.tc-bubble.user { background: var(--color-primary, #0066CC); color: white; }
.tc-bubble.ai { background: white; color: var(--text-primary); box-shadow: var(--shadow-1); }
.tc-typing { letter-spacing: 4px; padding: 10px 18px; }

.tc-panel {
  border-left: 1px solid var(--separator); padding: 14px;
  overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
}
.tc-panel-section { display: flex; flex-direction: column; gap: 6px; }
.tc-panel-title {
  font-size: 10px; font-weight: 700; color: var(--text-secondary);
  letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 4px;
}
.tc-info-row {
  display: flex; justify-content: space-between; font-size: 12px;
  color: var(--text-primary);
}
.tc-info-row span:first-child { color: var(--text-secondary); }
.tc-divider { height: 1px; background: var(--separator); flex-shrink: 0; }
.tc-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.tc-tag {
  padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;
  background: var(--bg-grouped); color: var(--text-secondary);
}

.tc-footer {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-top: 1px solid var(--separator); background: white; flex-shrink: 0;
}
.tc-input-wrap {
  flex: 1; display: flex; align-items: center;
  background: #F5F5F7; border-radius: 8px; padding: 0 12px;
}
.tc-input {
  flex: 1; height: 36px; border: none; background: transparent;
  outline: none; font-size: 13px; color: var(--text-primary);
}
.tc-send { height: 36px; padding: 0 18px; font-size: 13px; }
</style>
