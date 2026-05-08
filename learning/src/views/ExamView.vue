<!-- ## 正式考核页：双进度条 + SVG倒计时圆环 + 语音作答 + 防作弊提示 -->
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

const PER_QUESTION_TIME = 120 // 2 分钟/题

const loading = ref(true)
const session = ref<QaSession | null>(null)
const currentIdx = ref(0)
const questions = ref<Question[]>([])
const answers = ref<Array<{ questionId: string; audioFileId: string; transcribed: string }>>([])

// 录音
const recording = ref(false)
const audioBlob = ref<Blob | null>(null)
const audioUrl = ref('')
const submitting = ref(false)
const recorded = ref(false)

// 计时
const timeLeft = ref(PER_QUESTION_TIME)
let timerInterval: ReturnType<typeof setInterval> | null = null

const timeProgress = computed(() => (timeLeft.value / PER_QUESTION_TIME) * 100)
const questionProgress = computed(() =>
  questions.value.length > 0 ? (currentIdx.value / questions.value.length) * 100 : 0
)
const timeBarColor = computed(() => {
  const p = timeProgress.value
  if (p > 50) return '#34C759'
  if (p > 25) return '#FF9500'
  return '#FF3B30'
})
const timerFlash = computed(() => timeLeft.value <= 30 && timeLeft.value > 0)

// SVG circular ring: r=46, C≈289
const SVG_R = 46
const SVG_C = 2 * Math.PI * SVG_R
const svgDashOffset = computed(() => SVG_C * (1 - timeLeft.value / PER_QUESTION_TIME))
const svgRingColor = computed(() => {
  const p = timeProgress.value
  if (p > 50) return '#34C759'
  if (p > 25) return '#FF9500'
  return '#FF3B30'
})

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

const answeredCount = computed(() => answers.value.filter(a => a.audioFileId).length)

let mediaRecorder: MediaRecorder | null = null
let stream: MediaStream | null = null

onMounted(async () => {
  try {
    const res = await qaApi.startSession({ task_id: taskId, mode: 'exam' })
    session.value = res
    questions.value = res.questions || []
    answers.value = questions.value.map((q: Question) => ({
      questionId: q.id || q.question_id || '',
      audioFileId: '', transcribed: '',
    }))
    // 直接开始，不需要额外确认 (确认已在前面完成)
  } catch (e: any) {
    showToast('启动考核失败: ' + (e?.detail || '请重试'), 'error')
  }
  loading.value = false
  startTimer()
})

onUnmounted(() => { stopTimer(); stopMedia() })

function stopMedia() {
  stream?.getTracks().forEach(t => t.stop())
  stream = null; mediaRecorder = null
}

function startTimer() {
  stopTimer()
  timeLeft.value = PER_QUESTION_TIME
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) { stopTimer(); autoSubmit() }
  }, 1000)
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

const currentQuestion = () => questions.value[currentIdx.value]

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
      stream = null
    }
    mediaRecorder.start()
    recording.value = true
  } catch {
    showToast('无法访问麦克风', 'error')
  }
}

function stopRecording() { mediaRecorder?.stop(); recording.value = false }

async function autoSubmit() {
  if (recording.value) stopRecording()
  await new Promise(r => setTimeout(r, 300))
  if (audioBlob.value && session.value) await doSubmit()
  if (currentIdx.value < questions.value.length - 1) {
    currentIdx.value++
    audioBlob.value = null; audioUrl.value = ''; recorded.value = false
    startTimer()
    await nextTick()
  } else {
    finishExam()
  }
}

async function doSubmit() {
  if (!audioBlob.value || !session.value) return
  try {
    const q = currentQuestion()
    const uploaded = await uploadApi.uploadAudio(
      new File([audioBlob.value], 'exam-recording.webm', { type: 'audio/webm' })
    )
    await qaApi.submitAnswer({
      submission_id: session.value.submission_id,
      question_id: q.id,
      question_order: currentIdx.value,
      audio_file_id: uploaded.id,
      mode: 'exam',
    })
    answers.value[currentIdx.value] = {
      ...answers.value[currentIdx.value],
      audioFileId: uploaded.id,
      transcribed: '已提交',
    }
    recorded.value = true
  } catch (e: any) {
    showToast('提交失败: ' + (e?.detail || ''), 'error')
  }
}

async function submitAndNext() {
  if (!audioBlob.value || !session.value) { showToast('请先录音', 'error'); return }
  submitting.value = true
  stopTimer()
  try {
    await doSubmit()
    if (currentIdx.value < questions.value.length - 1) {
      currentIdx.value++
      audioBlob.value = null; audioUrl.value = ''; recorded.value = false
      startTimer()
      await nextTick()
    } else {
      finishExam()
    }
  } catch {}
  submitting.value = false
}

async function finishExam() {
  if (!session.value) return
  stopTimer()
  try {
    await qaApi.completeSession({ submission_id: session.value.submission_id })
  } catch {}
  router.replace(`/qa/${session.value.submission_id}/result?mode=exam`)
}

async function exitExam() {
  stopTimer()
  router.back()
}
</script>

<template>
  <!-- ========== PC Layout ========== -->
  <div v-if="isPC" class="pc-exam-wrap">

    <!-- 顶部栏：两条进度条 + 计时器 -->
    <div class="pc-exam-header">
      <div class="peh-left">
        <div class="peh-logo">考核模式</div>
        <div class="peh-anti">
          <AppIcon name="lock" :size="12" style="margin-right:4px" />正式考核 · 不展示得分
        </div>
      </div>
      <div class="peh-progress-wrap">
        <div class="peh-prog-label">
          <span>题目进度</span>
          <span>{{ currentIdx + 1 }}/{{ questions.length }}</span>
        </div>
        <div class="peh-bar q-bar">
          <div class="peh-bar-fill" :style="{ width: questionProgress + '%' }" />
        </div>
        <div class="peh-prog-label" style="margin-top:6px">
          <span>剩余时间</span>
          <span :style="{ color: timeBarColor }">{{ formatTime(timeLeft) }}</span>
        </div>
        <div class="peh-bar time-bar">
          <div class="peh-bar-fill" :style="{ width: timeProgress + '%', background: timeBarColor }" />
        </div>
      </div>
      <div class="peh-right">
        <div class="peh-timer" :class="{ flash: timerFlash }" :style="{ color: timeBarColor }">
          {{ formatTime(timeLeft) }}
        </div>
        <div class="peh-answered">{{ answeredCount }}/{{ questions.length }} 已作答</div>
      </div>
    </div>

    <div v-if="loading" class="pc-exam-body loading-state"><div class="spinner" /></div>
    <div v-else class="pc-exam-body">

      <!-- ── 左栏：题目导航 ── -->
      <div class="pc-exam-nav">
        <div class="pc-nav-title">题目导航</div>
        <div class="pc-nav-grid">
          <div
            v-for="(q, i) in questions" :key="q.id || i"
            class="pc-nav-cell"
            :class="{ current: i === currentIdx, answered: answers[i]?.audioFileId }"
            @click="currentIdx = i; audioBlob = null; audioUrl = ''; recorded = false; startTimer()"
          >{{ i + 1 }}</div>
        </div>
        <div class="pc-nav-legend">
          <div class="legend-row"><span class="lgd-dot answered" />已作答</div>
          <div class="legend-row"><span class="lgd-dot current" />当前题</div>
          <div class="legend-row"><span class="lgd-dot" />未作答</div>
        </div>
        <div class="exam-actions-col">
          <button class="exit-exam-btn" @click="exitExam">暂存退出</button>
          <button
            class="btn-primary submit-all-btn"
            :disabled="answeredCount === 0"
            @click="finishExam"
          >提交考核</button>
        </div>
      </div>

      <!-- ── 中栏：题目 + 录音 ── -->
      <div class="pc-exam-center" v-if="currentQuestion()">
        <!-- 题目卡 -->
        <div class="exam-q-card card">
          <div class="exam-badge-row">
            <span class="exam-badge">考核题 {{ String(currentIdx + 1).padStart(2, '0') }}</span>
            <span class="exam-score-tag">{{ currentQuestion().max_score }} 分</span>
          </div>
          <div class="exam-q-text">{{ currentQuestion().question_text }}</div>
        </div>

        <!-- 录音卡 -->
        <div class="exam-record-card card">
          <div v-if="!audioBlob" class="record-center">
            <!-- SVG 倒计时圆环 -->
            <div class="record-ring-wrap">
              <svg class="timer-ring" viewBox="0 0 100 100">
                <circle cx="50" cy="50" :r="SVG_R" class="ring-track" />
                <circle
                  cx="50" cy="50" :r="SVG_R"
                  class="ring-progress"
                  :stroke="svgRingColor"
                  :stroke-dasharray="SVG_C"
                  :stroke-dashoffset="svgDashOffset"
                />
              </svg>
              <button
                class="record-btn" :class="{ recording }"
                @click="recording ? stopRecording() : startRecording()"
                :disabled="submitting"
              >
                <div class="record-btn-inner">
                  <AppIcon :name="recording ? 'stop' : 'mic'" :size="28" />
                </div>
              </button>
            </div>
            <div class="record-status-text" :class="{ recording }">
              <span v-if="recording" class="rec-indicator"><span class="rec-dot-anim" />录音中...点击停止</span>
              <span v-else>点击开始语音回答</span>
            </div>
          </div>

          <div v-else class="audio-recorded">
            <div class="recorded-badge">
              <AppIcon name="check" :size="14" style="margin-right:4px" />
              已记录，请继续
            </div>
            <audio :src="audioUrl" controls style="width:100%;margin-top:12px" />
          </div>

          <div class="exam-hint">每题限时 2 分钟，超时自动提交 · 考核不展示即时评分</div>
        </div>

        <!-- 操作按钮 -->
        <div class="center-actions">
          <button
            v-if="audioBlob && !submitting"
            class="btn-primary" style="height:44px;flex:1"
            @click="submitAndNext"
          >
            {{ currentIdx < questions.length - 1 ? '提交并下一题 ›' : '完成作答' }}
          </button>
          <div v-if="submitting" class="submitting-row">
            <div class="spinner" style="width:16px;height:16px;border-width:2px" />
            提交中...
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========== Mobile Layout ========== -->
  <div v-else class="page-container">
    <!-- 顶部双进度栏 -->
    <div class="exam-header">
      <div class="exam-header-row">
        <button class="back-btn" @click="exitExam"><AppIcon name="close" :size="16" /></button>
        <div class="exam-header-center">
          <div class="ehc-label">第 {{ currentIdx + 1 }} 题 / 共 {{ questions.length }} 题</div>
          <div class="ehc-subbar">
            <div class="ehc-prog q-prog">
              <div class="ehc-fill" :style="{ width: questionProgress + '%' }" />
            </div>
          </div>
        </div>
        <div class="exam-timer" :class="{ flash: timerFlash }" :style="{ color: timeBarColor }">
          {{ formatTime(timeLeft) }}
        </div>
      </div>
      <!-- 时间进度条 -->
      <div class="time-prog-bar">
        <div class="time-prog-fill" :style="{ width: timeProgress + '%', background: timeBarColor }" />
      </div>
    </div>

    <div v-if="loading" class="empty-state"><div class="spinner" /></div>

    <template v-else-if="currentQuestion()">
      <!-- 防作弊提示 -->
      <div class="section">
        <div class="anti-cheat-banner">
          <AppIcon name="lock" :size="14" style="flex-shrink:0" />
          正式考核模式 · 不展示即时评分 · 请独立作答
        </div>
      </div>

      <!-- 题目 -->
      <div class="section">
        <div class="exam-q-card card">
          <div class="exam-badge-row">
            <span class="exam-badge">考核题 {{ String(currentIdx + 1).padStart(2, '0') }}</span>
            <span class="exam-score-tag">{{ currentQuestion().max_score }} 分</span>
          </div>
          <div class="exam-q-text">{{ currentQuestion().question_text }}</div>
        </div>
      </div>

      <!-- 录音 -->
      <div class="section">
        <div class="exam-record-card card">
          <div v-if="!audioBlob" class="record-center">
            <div class="record-ring-wrap">
              <svg class="timer-ring" viewBox="0 0 100 100">
                <circle cx="50" cy="50" :r="SVG_R" class="ring-track" />
                <circle
                  cx="50" cy="50" :r="SVG_R"
                  class="ring-progress"
                  :stroke="svgRingColor"
                  :stroke-dasharray="SVG_C"
                  :stroke-dashoffset="svgDashOffset"
                />
              </svg>
              <button
                class="record-btn" :class="{ recording }"
                @click="recording ? stopRecording() : startRecording()"
                :disabled="submitting"
              >
                <div class="record-btn-inner">
                  <AppIcon :name="recording ? 'stop' : 'mic'" :size="32" />
                </div>
              </button>
            </div>
            <div class="record-status-text" :class="{ recording }">
              <span v-if="recording" class="rec-indicator"><span class="rec-dot-anim" />录音中...点击停止</span>
              <span v-else>点击开始语音回答</span>
            </div>
          </div>

          <div v-else class="audio-recorded">
            <div class="recorded-badge">
              <AppIcon name="check" :size="14" style="margin-right:4px" />已记录，请继续
            </div>
            <audio :src="audioUrl" controls style="width:100%;margin-top:12px" />
          </div>

          <div class="exam-hint">每题限时 2 分钟，超时自动提交</div>
        </div>

        <div style="display:flex;gap:10px;margin-top:12px" v-if="!submitting">
          <button v-if="audioBlob" class="btn-primary" style="flex:1;height:46px" @click="submitAndNext">
            {{ currentIdx < questions.length - 1 ? '提交并下一题' : '完成作答' }}
          </button>
        </div>
        <div v-if="submitting" class="empty-state" style="padding:20px">
          <div class="spinner" /><div class="msg">提交中...</div>
        </div>
      </div>
    </template>

    <!-- 底部操作 -->
    <div class="exam-footer" v-if="!loading">
      <button class="exit-exam-btn-m" @click="exitExam">暂存退出</button>
      <button
        class="btn-primary submit-all-btn-m"
        :disabled="answeredCount === 0"
        @click="finishExam"
      >提交考核（{{ answeredCount }}/{{ questions.length }}）</button>
    </div>
  </div>
</template>

<style scoped>
/* ════════════════════════
   PC Header
════════════════════════ */
.pc-exam-wrap {
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
  background: var(--bg-system, #F2F2F7);
}
.pc-exam-header {
  display: flex; align-items: center; gap: 20px;
  padding: 10px 24px; flex-shrink: 0;
  background: white; border-bottom: 1px solid var(--separator);
}
.peh-left { display: flex; flex-direction: column; gap: 4px; min-width: 120px; }
.peh-logo { font-size: 15px; font-weight: 800; color: #FF3B30; }
.peh-anti {
  display: flex; align-items: center;
  font-size: 11px; font-weight: 600; color: var(--text-secondary);
  background: rgba(255,59,48,0.07); padding: 3px 8px; border-radius: 6px;
}
.peh-progress-wrap { flex: 1; }
.peh-prog-label {
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--text-3); margin-bottom: 4px; font-weight: 600;
}
.peh-bar {
  height: 6px; background: var(--bg-grouped); border-radius: 3px; overflow: hidden;
}
.peh-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease, background 0.5s; }
.q-bar .peh-bar-fill { background: var(--color-primary); }
.peh-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; min-width: 80px; }
.peh-timer {
  font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums;
  line-height: 1; transition: color 0.3s;
}
.peh-timer.flash { animation: blink-anim 0.7s step-start infinite; }
.peh-answered { font-size: 11px; color: var(--text-3); font-weight: 600; }

/* ── PC Body ── */
.pc-exam-body { display: flex; flex: 1; overflow: hidden; }
.pc-exam-body.loading-state { align-items: center; justify-content: center; }

/* Left nav */
.pc-exam-nav {
  width: 200px; flex-shrink: 0;
  background: white; border-right: 1px solid var(--separator);
  padding: 16px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px;
}
.pc-nav-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: var(--text-3);
}
.pc-nav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
.pc-nav-cell {
  aspect-ratio: 1; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; cursor: pointer;
  background: var(--bg-grouped); border: 1.5px solid transparent;
  color: var(--text-secondary); transition: all 150ms;
}
.pc-nav-cell:hover:not(.current) { border-color: var(--border); }
.pc-nav-cell.current { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.pc-nav-cell.answered { background: rgba(52,199,89,0.12); color: #34C759; border-color: rgba(52,199,89,0.3); }

.pc-nav-legend { display: flex; flex-direction: column; gap: 6px; }
.legend-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-3); }
.lgd-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--bg-grouped); border: 1px solid var(--separator); flex-shrink: 0; }
.lgd-dot.current { background: var(--color-primary); border-color: transparent; }
.lgd-dot.answered { background: #34C759; border-color: transparent; }

.exam-actions-col { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
.exit-exam-btn {
  width: 100%; padding: 9px; border-radius: 10px; border: none; cursor: pointer;
  background: rgba(255,59,48,0.08); color: #FF3B30;
  font-size: 13px; font-weight: 600;
}
.submit-all-btn { width: 100%; height: 40px; }
.submit-all-btn:disabled { background: var(--bg-grouped) !important; color: var(--text-3) !important; box-shadow: none !important; }

/* Center */
.pc-exam-center {
  flex: 1; overflow-y: auto; padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
  max-width: 620px; margin: 0 auto; width: 100%;
}

/* ════════════════════════
   Shared Exam Components
════════════════════════ */
.exam-q-card { padding: 24px; }
.exam-badge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.exam-badge {
  font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
  color: #FF3B30; background: rgba(255,59,48,0.1);
  padding: 3px 10px; border-radius: 20px;
}
.exam-score-tag {
  font-size: 11px; font-weight: 700; color: var(--text-3);
  background: var(--bg-grouped); padding: 3px 10px; border-radius: 20px;
}
.exam-q-text { font-size: 18px; font-weight: 600; color: var(--text-primary); line-height: 1.65; }

.exam-record-card { padding: 28px 20px; text-align: center; }

.record-center { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.record-ring-wrap { position: relative; width: 100px; height: 100px; margin: 0 auto; }
.timer-ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-track { fill: none; stroke: rgba(118,118,128,0.15); stroke-width: 5; }
.ring-progress {
  fill: none; stroke-width: 5; stroke-linecap: round;
  transition: stroke-dashoffset 1s linear, stroke 0.4s;
}
.record-btn {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 68px; height: 68px;
  border: none; cursor: pointer; background: none;
}
.record-btn-inner {
  width: 100%; height: 100%; border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  display: flex; align-items: center; justify-content: center;
  color: white; box-shadow: 0 6px 20px rgba(0,122,255,0.3); transition: all 200ms;
}
.recording .record-btn-inner {
  background: linear-gradient(135deg, #FF3B30, #FF9500);
  box-shadow: 0 6px 20px rgba(255,59,48,0.3);
}
.record-status-text { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
.recording.record-status-text { color: #FF3B30; }
.rec-indicator { display: flex; align-items: center; gap: 6px; color: #FF3B30; font-weight: 600; }
.rec-dot-anim {
  width: 8px; height: 8px; border-radius: 50%; background: #FF3B30; flex-shrink: 0;
  animation: blink-anim 0.7s ease infinite;
}
@keyframes blink-anim { 0%,100%{opacity:1} 50%{opacity:0.2} }

.audio-recorded { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.recorded-badge {
  display: inline-flex; align-items: center;
  background: rgba(52,199,89,0.12); color: #34C759;
  font-size: 13px; font-weight: 700;
  padding: 6px 14px; border-radius: 20px;
}
.exam-hint { font-size: 11px; color: var(--text-3); margin-top: 12px; text-align: center; }

.center-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.submitting-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }

/* ════════════════════════
   Mobile
════════════════════════ */
.exam-header {
  background: rgba(255,255,255,0.94); backdrop-filter: blur(16px);
  border-bottom: 0.5px solid var(--separator);
  padding: 8px 12px 6px; position: sticky; top: 0; z-index: 10;
  display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
}
.exam-header-row { display: flex; align-items: center; gap: 10px; }
.exam-header-center { flex: 1; }
.ehc-label { font-size: 13px; font-weight: 600; color: var(--text-primary); text-align: center; margin-bottom: 4px; }
.ehc-subbar {}
.ehc-prog { height: 4px; background: rgba(118,118,128,0.15); border-radius: 2px; overflow: hidden; }
.ehc-fill { height: 100%; border-radius: 2px; background: var(--color-primary); transition: width 0.4s ease; }
.exam-timer {
  font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums;
  flex-shrink: 0; transition: color 0.3s;
}
.exam-timer.flash { animation: blink-anim 0.7s step-start infinite; }
.time-prog-bar { height: 4px; background: rgba(118,118,128,0.12); overflow: hidden; }
.time-prog-fill { height: 100%; transition: width 1s linear, background 0.4s; }

.anti-cheat-banner {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,59,48,0.08); color: #FF3B30;
  font-size: 12px; font-weight: 600;
  padding: 8px 14px; border-radius: 10px;
}

.exam-footer {
  padding: 10px 16px 18px;
  background: rgba(255,255,255,0.94); backdrop-filter: blur(16px);
  border-top: 0.5px solid var(--separator);
  display: flex; gap: 10px;
  position: sticky; bottom: 0; z-index: 10;
}
.exit-exam-btn-m {
  flex-shrink: 0; padding: 0 14px; height: 46px; border-radius: 12px;
  background: rgba(255,59,48,0.08); color: #FF3B30;
  border: none; font-size: 14px; font-weight: 600; cursor: pointer;
}
.submit-all-btn-m {
  flex: 1; height: 46px; border-radius: 12px;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white; border: none; font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,122,255,0.3);
}
.submit-all-btn-m:disabled {
  background: var(--bg-grouped) !important;
  color: var(--text-3) !important;
  box-shadow: none !important;
}
</style>
