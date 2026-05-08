<!-- ## 知识问答结果页：总分 countUp + 掌握度进度条 + 折叠详情列表 -->
<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { qaApi, systemConfigApi } from '@/api'
import { showToast } from '@/composables/toast'
import type { SubmissionAnswer } from '@/api/types'

const route = useRoute()
const router = useRouter()
const submissionId = route.params.submissionId as string
const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const loading = ref(true)
const score = ref(0)
const maxScore = ref(0)
const answers = ref<SubmissionAnswer[]>([])
const passScore = ref(60)
const displayScore = ref(0)
const expandedIdx = ref<number | null>(null)

onMounted(async () => {
  try {
    const [res, cfg] = await Promise.all([
      qaApi.getSession(submissionId),
      systemConfigApi.getPublic().catch(() => ({ qa_pass_score: '60' })),
    ])
    score.value = res.score || 0
    maxScore.value = res.max_score || 0
    answers.value = res.answers || []
    passScore.value = Number(cfg.qa_pass_score) || 60
  } catch {
    showToast('加载结果失败', 'error')
  }
  loading.value = false
  runCountUp()
})

function runCountUp() {
  const target = score.value
  const dur = 900
  const start = performance.now()
  function tick(now: number) {
    const p = Math.min((now - start) / dur, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    displayScore.value = Math.round(ease * target)
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const pct = computed(() => maxScore.value > 0 ? Math.round(score.value / maxScore.value * 100) : 0)

function scoreLevel(s: number, max: number): 'excellent' | 'pass' | 'below' {
  if (max <= 0) return 'below'
  const p = (s / max) * 100
  if (p >= 85) return 'excellent'
  if (p >= 60) return 'pass'
  return 'below'
}
function scoreLevelLabel(lv: 'excellent' | 'pass' | 'below') {
  return { excellent: '优秀', pass: '合格', below: '待提升' }[lv]
}
function scoreLevelColor(lv: 'excellent' | 'pass' | 'below') {
  return { excellent: '#34C759', pass: '#007AFF', below: '#FF9500' }[lv]
}

const heroGradient = computed(() => {
  if (pct.value >= 85) return 'linear-gradient(160deg,#34C759,#30B0C7)'
  if (pct.value >= passScore.value) return 'linear-gradient(160deg,#007AFF,#5856D6)'
  return 'linear-gradient(160deg,#FF9500,#FF2D55)'
})
const heroLabel = computed(() => {
  if (pct.value >= 85) return '优秀'
  if (pct.value >= passScore.value) return '合格'
  return '待提升'
})

const correctCount = computed(() => answers.value.filter(a => (a.score / a.max_score) >= 0.6).length)

function toggleExpand(i: number) {
  expandedIdx.value = expandedIdx.value === i ? null : i
}
</script>

<template>
  <!-- ========== PC Layout ========== -->
  <div v-if="isPC">
    <div v-if="loading" class="empty-state"><div class="spinner" /></div>
    <template v-else>
      <div class="pc-result-grid">

        <!-- Left: score hero + stats + 操作 -->
        <div class="pc-score-col">
          <div class="score-hero-card" :style="{ background: heroGradient }">
            <div class="hero-eyebrow">本次得分</div>
            <div class="hero-num">{{ displayScore }}</div>
            <div class="hero-denom">/ {{ maxScore }}</div>
            <div class="hero-badge-row">
              <span class="hero-badge">{{ heroLabel }}</span>
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <div class="hs-val">{{ answers.length }}</div>
                <div class="hs-label">总题数</div>
              </div>
              <div class="hero-stat-div" />
              <div class="hero-stat">
                <div class="hs-val">{{ correctCount }}</div>
                <div class="hs-label">合格题</div>
              </div>
              <div class="hero-stat-div" />
              <div class="hero-stat">
                <div class="hs-val">{{ pct }}%</div>
                <div class="hs-label">得分率</div>
              </div>
            </div>
          </div>

          <!-- 知识掌握度 -->
          <div class="mastery-card">
            <div class="mc-title">知识掌握情况</div>
            <div class="mastery-list">
              <div v-for="(a, i) in answers" :key="a.question_id" class="mastery-row">
                <div class="mr-top">
                  <span class="mr-label">第 {{ i + 1 }} 题</span>
                  <span class="mr-score" :style="{ color: scoreLevelColor(scoreLevel(a.score, a.max_score)) }">
                    {{ a.score }}/{{ a.max_score }}
                  </span>
                </div>
                <div class="mr-track">
                  <div class="mr-fill" :style="{
                    width: (a.max_score > 0 ? a.score / a.max_score * 100 : 0) + '%',
                    background: scoreLevelColor(scoreLevel(a.score, a.max_score))
                  }" />
                </div>
              </div>
            </div>
          </div>

          <div class="action-row">
            <button class="btn-secondary" style="flex:1;height:44px" @click="router.back()">再做一次</button>
            <button class="btn-primary" style="flex:1;height:44px" @click="router.push('/home')">返回首页</button>
          </div>
        </div>

        <!-- Right: 逐题折叠详情 -->
        <div class="pc-answers-col">
          <div class="answers-header">
            <div class="pc-section-title">逐题详情</div>
            <span class="answers-count">{{ answers.length }} 题</span>
          </div>
          <div class="answer-list">
            <div
              v-for="(a, i) in answers" :key="a.question_id"
              class="answer-card" :class="scoreLevel(a.score, a.max_score)"
            >
              <button class="answer-header" @click="toggleExpand(i)">
                <span class="answer-num">Q{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="answer-preview">{{ (a as any).question_text || '—' }}</span>
                <span class="answer-level-badge" :style="{
                  background: scoreLevelColor(scoreLevel(a.score, a.max_score)) + '1a',
                  color: scoreLevelColor(scoreLevel(a.score, a.max_score))
                }">{{ scoreLevelLabel(scoreLevel(a.score, a.max_score)) }}</span>
                <span class="answer-score-num" :style="{ color: scoreLevelColor(scoreLevel(a.score, a.max_score)) }">
                  {{ a.score }}/{{ a.max_score }}
                </span>
                <span class="expand-arrow" :class="{ open: expandedIdx === i }">›</span>
              </button>
              <div v-show="expandedIdx === i" class="answer-body">
                <div v-if="(a as any).question_text" class="answer-section">
                  <div class="answer-label">题目</div>
                  <div class="answer-text bold">{{ (a as any).question_text }}</div>
                </div>
                <div v-if="a.transcribed_text" class="answer-section">
                  <div class="answer-label">我的回答</div>
                  <div class="answer-text gray-bg">{{ a.transcribed_text }}</div>
                </div>
                <div v-if="a.feedback" class="answer-section">
                  <div class="answer-label">AI 点评</div>
                  <div class="answer-text feedback-bg">{{ a.feedback }}</div>
                </div>
                <div v-if="a.reference_answer" class="answer-section">
                  <div class="answer-label">参考答案</div>
                  <div class="answer-text ref-blue">{{ a.reference_answer }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- ========== Mobile Layout ========== -->
  <div v-else class="page-container">
    <!-- 粘性顶栏 -->
    <div class="mobile-result-topbar">
      <button class="back-btn" @click="router.push('/home')">‹</button>
      <span class="page-title">考核报告</span>
      <div style="width:32px" />
    </div>

    <div v-if="loading" class="empty-state"><div class="spinner" /></div>

    <div v-else class="mobile-result-body">
      <!-- 白色成绩卡 -->
      <div class="mobile-score-card">
        <div class="msc-label">本次得分</div>
        <div class="msc-score" :style="{ color: pct >= passScore ? '#007AFF' : '#FF9500' }">{{ displayScore }}</div>
        <div class="msc-denom">/ {{ maxScore }} 分</div>
        <span class="msc-badge" :style="{
          background: pct >= 85 ? 'rgba(52,199,89,0.12)' : pct >= passScore ? 'rgba(0,122,255,0.1)' : 'rgba(255,149,0,0.12)',
          color: pct >= 85 ? '#34C759' : pct >= passScore ? '#007AFF' : '#FF9500'
        }">{{ heroLabel }}</span>
        <div class="msc-stats">
          <div class="msc-stat">
            <div class="msc-stat-val">{{ answers.length }}</div>
            <div class="msc-stat-label">总题数</div>
          </div>
          <div class="msc-stat-div" />
          <div class="msc-stat">
            <div class="msc-stat-val">{{ correctCount }}</div>
            <div class="msc-stat-label">合格题</div>
          </div>
          <div class="msc-stat-div" />
          <div class="msc-stat">
            <div class="msc-stat-val">{{ pct }}%</div>
            <div class="msc-stat-label">得分率</div>
          </div>
        </div>
      </div>

      <!-- AI 综合评语 -->
      <div v-if="answers.some(a => a.feedback)" class="mobile-section">
        <div class="mobile-section-title">AI 综合评语</div>
        <div class="ai-feedback-card">
          <div class="ai-feedback-text">{{ answers.find(a => a.feedback)?.feedback }}</div>
        </div>
      </div>

      <!-- 各题详情 -->
      <div class="mobile-section">
        <div class="mobile-section-title">各题详情（{{ answers.length }} 题）</div>
        <div class="answer-list">
          <div
            v-for="(a, i) in answers" :key="a.question_id"
            class="answer-card" :class="scoreLevel(a.score, a.max_score)"
          >
            <button class="answer-header" @click="toggleExpand(i)">
              <div class="answer-header-left">
                <span class="answer-num">Q{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="answer-preview">{{ (a as any).question_text || '—' }}</span>
              </div>
              <div class="answer-header-right">
                <span class="answer-score-num" :style="{ color: scoreLevelColor(scoreLevel(a.score, a.max_score)) }">
                  {{ a.score }}/{{ a.max_score }}
                </span>
                <span class="expand-arrow" :class="{ open: expandedIdx === i }">›</span>
              </div>
            </button>
            <div v-show="expandedIdx === i" class="answer-body">
              <div v-if="a.transcribed_text" class="answer-section">
                <div class="answer-label">我的回答</div>
                <div class="answer-text gray-bg">{{ a.transcribed_text }}</div>
              </div>
              <div v-if="a.reference_answer" class="answer-section">
                <div class="answer-label">参考答案</div>
                <div class="answer-text ref-blue">{{ a.reference_answer }}</div>
              </div>
              <div v-if="a.feedback" class="answer-section">
                <div class="answer-label">AI 点评</div>
                <div class="answer-text feedback-bg">{{ a.feedback }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 固定底部按钮（悬浮在底部导航栏上方） -->
    <div class="mobile-result-footer">
      <button class="btn-secondary" style="flex:1;height:46px" @click="router.back()">再练一次</button>
      <button class="btn-primary" style="flex:1;height:46px" @click="router.push('/home')">返回任务</button>
    </div>
  </div>
</template>

<style scoped>
/* ── Mobile result page ── */
.mobile-result-topbar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: rgba(242,242,247,0.96);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.mobile-result-topbar .page-title { font-size: 16px; font-weight: 700; }
.mobile-result-body { padding: 12px 16px 140px; }
.mobile-result-footer {
  position: fixed;
  bottom: calc(var(--nav-height, 56px) + var(--safe-bottom, 0px));
  left: 0; right: 0;
  display: flex; gap: 10px;
  padding: 10px 16px;
  background: rgba(242,242,247,0.96); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border-top: 0.5px solid rgba(0,0,0,0.08);
  z-index: 50;
}

/* White score card */
.mobile-score-card {
  background: white; border-radius: 20px; padding: 24px 20px;
  text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  margin-bottom: 14px;
}
.msc-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.3px; }
.msc-score { font-size: 72px; font-weight: 900; line-height: 1; letter-spacing: -3px; }
.msc-denom { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
.msc-badge { font-size: 13px; font-weight: 700; padding: 4px 16px; border-radius: 20px; margin: 4px 0; }
.msc-stats { display: flex; align-items: center; width: 100%; padding-top: 14px; border-top: 1px solid var(--separator); margin-top: 8px; }
.msc-stat { flex: 1; text-align: center; }
.msc-stat-val { font-size: 22px; font-weight: 800; color: var(--text-primary); line-height: 1; }
.msc-stat-label { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
.msc-stat-div { width: 1px; height: 28px; background: var(--separator); flex-shrink: 0; }

/* AI feedback card */
.mobile-section { margin-bottom: 14px; }
.mobile-section-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; padding-left: 2px; }
.ai-feedback-card {
  background: white; border-radius: 14px; padding: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  border-left: 3px solid #007AFF;
}
.ai-feedback-text { font-size: 14px; color: var(--text-primary); line-height: 1.65; }

/* ── PC Grid ── */
.pc-result-grid {
  display: grid; grid-template-columns: 320px 1fr;
  gap: 24px; align-items: start;
}
.pc-score-col { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 16px; }
.pc-answers-col { display: flex; flex-direction: column; gap: 14px; }

/* Score Hero */
.score-hero-card, .mobile-hero {
  border-radius: 20px; color: white;
  text-align: center; box-shadow: var(--shadow-3);
}
.score-hero-card { padding: 28px 20px; }
.mobile-hero { padding: 32px 20px; }

.hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; opacity: 0.8; text-transform: uppercase; margin-bottom: 8px; }
.hero-num { font-size: 72px; font-weight: 900; line-height: 1; letter-spacing: -3px; }
.hero-denom { font-size: 18px; opacity: 0.7; font-weight: 500; margin-top: 2px; }
.hero-badge-row { margin: 10px 0 14px; }
.hero-badge {
  background: rgba(255,255,255,0.25); backdrop-filter: blur(8px);
  padding: 4px 16px; border-radius: 20px;
  font-size: 14px; font-weight: 700;
}
.hero-stats { display: flex; justify-content: center; align-items: center; gap: 0; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.2); }
.hero-stat { flex: 1; text-align: center; }
.hero-stat-div { width: 1px; height: 30px; background: rgba(255,255,255,0.25); flex-shrink: 0; }
.hs-val { font-size: 22px; font-weight: 800; line-height: 1; }
.hs-label { font-size: 11px; opacity: 0.75; margin-top: 3px; }

/* Mastery card */
.mastery-card { background: white; border-radius: 16px; box-shadow: var(--shadow-1); padding: 18px; }
.mc-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 14px; }
.mastery-list { display: flex; flex-direction: column; gap: 10px; }
.mastery-row {}
.mr-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
.mr-label { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
.mr-score { font-size: 13px; font-weight: 800; }
.mr-track { height: 7px; background: var(--bg-grouped); border-radius: 4px; overflow: hidden; }
.mr-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

.action-row { display: flex; gap: 10px; }

/* Answers section */
.answers-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.answers-count { font-size: 13px; color: var(--text-3); }

/* Answer cards */
.answer-list { display: flex; flex-direction: column; gap: 8px; }
.answer-card {
  background: white; border-radius: 14px;
  box-shadow: var(--shadow-1); overflow: hidden;
  border-left: 4px solid transparent;
}
.answer-card.excellent { border-left-color: #34C759; }
.answer-card.pass { border-left-color: #007AFF; }
.answer-card.below { border-left-color: #FF9500; }

.answer-header {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 13px 14px; text-align: left; cursor: pointer; background: none;
}
.answer-header:hover { background: rgba(118,118,128,0.04); }
.answer-num {
  font-size: 11px; font-weight: 800; color: var(--text-3);
  flex-shrink: 0; letter-spacing: 0.3px;
}
.answer-preview {
  flex: 1; font-size: 13px; color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.answer-level-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; flex-shrink: 0;
}
.answer-score-num { font-size: 14px; font-weight: 800; flex-shrink: 0; }
.expand-arrow {
  flex-shrink: 0; font-size: 16px; color: var(--text-3);
  transition: transform 200ms; display: inline-block;
}
.expand-arrow.open { transform: rotate(90deg); }

.answer-body {
  padding: 0 14px 14px 14px;
  border-top: 1px solid var(--separator);
  padding-top: 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.answer-section {}
.answer-label {
  font-size: 10px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px;
}
.answer-text { font-size: 13px; color: var(--text-primary); line-height: 1.6; }
.answer-text.bold { font-weight: 600; }
.gray-bg { background: rgba(118,118,128,0.06); padding: 8px 10px; border-radius: 8px; }
.feedback-bg { background: rgba(0,122,255,0.05); padding: 8px 10px; border-radius: 8px; }
.ref-blue {
  background: rgba(0,122,255,0.06); padding: 8px 10px; border-radius: 8px;
  border-left: 3px solid var(--color-primary);
}
</style>
