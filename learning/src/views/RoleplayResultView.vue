<!-- ## 对练结果页：紫色渐变头部 + 维度进度条 + 亮点/改进双列 + 话术对比 -->
<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roleplayApi, systemConfigApi } from '@/api'
import { showToast } from '@/composables/toast'

const route = useRoute()
const router = useRouter()
const submissionId = route.params.submissionId as string
const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const loading = ref(true)
const result = ref<any>(null)
const passScore = ref(70)
const displayScore = ref(0)
const scriptOpen = ref(false)

onMounted(async () => {
  try {
    const [res, cfg] = await Promise.all([
      roleplayApi.getResult(submissionId),
      systemConfigApi.getPublic().catch(() => ({ roleplay_pass_score: '70' })),
    ])
    result.value = res
    passScore.value = Number(cfg.roleplay_pass_score) || 70
  } catch {
    showToast('加载对练结果失败', 'error')
  }
  loading.value = false
  if (!loading.value) runCountUp()
})

function runCountUp() {
  const target = evaluation()?.score || 0
  const start = performance.now()
  const dur = 900
  function tick(now: number) {
    const p = Math.min((now - start) / dur, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    displayScore.value = Math.round(ease * target)
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const evaluation = () => result.value?.final_evaluation
const passed = () => (evaluation()?.score || 0) >= passScore.value

function dimColor(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0
  if (pct >= 85) return '#34C759'
  if (pct >= 60) return '#007AFF'
  return '#FF9500'
}
function dimGradient(score: number, max: number): string {
  const c = dimColor(score, max)
  return `linear-gradient(90deg, ${c}, ${c}bb)`
}

interface ScriptExample { turn?: number; original?: string; better?: string }
const scriptExamples = computed<ScriptExample[]>(() =>
  result.value?.script_examples || result.value?.final_evaluation?.script_examples || []
)
</script>

<template>
  <!-- ========== PC Layout ========== -->
  <div v-if="isPC">
    <div v-if="loading" class="empty-state"><div class="spinner" /></div>
    <template v-else-if="result">

      <!-- 分数头部（紫色渐变） -->
      <div class="result-header">
        <div class="rh-score-wrap">
          <div class="rh-score">{{ displayScore }}<span class="rh-max">/100</span></div>
          <div class="rh-verdict" :class="passed() ? 'verdict-pass' : 'verdict-fail'">
            {{ passed() ? '通过考核' : '继续加油' }}
          </div>
        </div>
        <div class="rh-stats">
          <div class="rh-stat">
            <div class="rh-stat-val">{{ result.total_turns || result.turns?.length || 0 }}</div>
            <div class="rh-stat-label">对话轮次</div>
          </div>
          <div class="rh-stat-div" />
          <div class="rh-stat">
            <div class="rh-stat-val">{{ evaluation()?.dimensions?.length || 0 }}</div>
            <div class="rh-stat-label">评估维度</div>
          </div>
          <div class="rh-stat-div" />
          <div class="rh-stat">
            <div class="rh-stat-val">{{ passScore }}</div>
            <div class="rh-stat-label">通过线</div>
          </div>
        </div>
      </div>

      <div class="pc-result-body">
        <!-- Left: 维度 + 总评 + 操作 -->
        <div class="pc-result-left">
          <!-- 维度评分 -->
          <div v-if="evaluation()?.dimensions?.length" class="result-card">
            <div class="rc-title">维度评分</div>
            <div class="dim-list">
              <div v-for="d in evaluation().dimensions" :key="d.name" class="dim-row">
                <div class="dim-top">
                  <span class="dim-name">{{ d.name }}</span>
                  <span class="dim-val" :style="{ color: dimColor(d.score, d.max) }">
                    {{ d.score }}<span class="dim-maxlabel">/{{ d.max }}</span>
                  </span>
                </div>
                <div class="dim-track">
                  <div class="dim-fill" :style="{
                    width: (d.score / d.max * 100) + '%',
                    background: dimGradient(d.score, d.max)
                  }" />
                </div>
              </div>
            </div>
          </div>

          <!-- 总体评价 -->
          <div v-if="evaluation()?.summary" class="result-card summary-card">
            <div class="rc-title">总体评价</div>
            <div class="summary-text">{{ evaluation().summary }}</div>
          </div>

          <!-- 操作按钮 -->
          <div class="result-actions">
            <button class="btn-secondary" style="height:44px" @click="router.back()">再练一次</button>
            <button class="btn-primary" style="height:44px" @click="router.push('/home')">返回首页</button>
          </div>
        </div>

        <!-- Right: 亮点 + 改进 + 话术 + 对话 -->
        <div class="pc-result-right">

          <!-- 亮点 + 改进双列 -->
          <div
            v-if="evaluation()?.strengths?.length || evaluation()?.improvements?.length"
            class="dual-col"
          >
            <div v-if="evaluation()?.strengths?.length" class="result-card strengths-card">
              <div class="rc-title-colored green">
                <span class="rc-icon">✨</span>亮点表现
              </div>
              <ul class="point-list">
                <li v-for="s in evaluation().strengths" :key="s">{{ s }}</li>
              </ul>
            </div>
            <div v-if="evaluation()?.improvements?.length" class="result-card improve-card">
              <div class="rc-title-colored orange">
                <span class="rc-icon">💡</span>改进建议
              </div>
              <ul class="point-list">
                <li v-for="s in evaluation().improvements" :key="s">{{ s }}</li>
              </ul>
            </div>
          </div>

          <!-- 关键回合话术对比 -->
          <div v-if="scriptExamples.length" class="result-card">
            <div class="rc-title-row">
              <div class="rc-title">关键回合话术对比</div>
              <span class="rc-badge">{{ scriptExamples.length }} 条</span>
            </div>
            <div class="script-list">
              <div v-for="(ex, i) in scriptExamples" :key="i" class="script-item">
                <div class="script-round">第 {{ ex.turn ?? (i + 1) }} 轮</div>
                <div class="script-row original">
                  <div class="script-tag">你说</div>
                  <div class="script-content">{{ ex.original }}</div>
                </div>
                <div class="script-arrow">↓ 更佳表达</div>
                <div class="script-row better">
                  <div class="script-tag better">建议</div>
                  <div class="script-content">{{ ex.better }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 对话记录 -->
          <div class="result-card">
            <div class="rc-title">
              对话记录 <span class="rc-sub">{{ result.total_turns || result.turns?.length || 0 }} 轮</span>
            </div>
            <div class="conv-list">
              <div v-for="(t, i) in result.turns || []" :key="i" class="conv-item">
                <div class="conv-role" :class="t.role">
                  {{ t.role === 'user' ? '你' : 'AI角色' }}
                </div>
                <div class="conv-text">{{ t.text }}</div>
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
    <div class="mobile-rr-topbar">
      <button class="back-btn" @click="router.push('/home')">‹</button>
      <span class="page-title">对练评分报告</span>
      <div style="width:32px" />
    </div>

    <div v-if="loading" class="empty-state"><div class="spinner" /></div>

    <div v-else-if="result" class="mobile-rr-body">
      <!-- 角色头像 + 分数卡 -->
      <div class="mobile-persona-score-card">
        <div class="mpsc-avatar">
          {{ result.persona_name?.[0] || result.persona?.name?.[0] || 'A' }}
        </div>
        <div class="mpsc-name">{{ result.persona_name || result.persona?.name || '对练角色' }}</div>
        <div class="mpsc-score" :style="{ color: passed() ? '#007AFF' : '#FF9500' }">{{ displayScore }}</div>
        <div class="mpsc-score-label">/ 100 分</div>
        <span class="mpsc-badge" :style="{
          background: passed() ? 'rgba(0,122,255,0.1)' : 'rgba(255,149,0,0.1)',
          color: passed() ? '#007AFF' : '#FF9500'
        }">{{ passed() ? '通过考核' : '继续加油' }}</span>
      </div>

      <!-- 维度评分 -->
      <div class="mrr-section" v-if="evaluation()?.dimensions?.length">
        <div class="mrr-section-title">维度评分</div>
        <div class="mrr-card">
          <div class="dim-list">
            <div v-for="d in evaluation().dimensions" :key="d.name" class="dim-row">
              <div class="dim-top">
                <span class="dim-name">{{ d.name }}</span>
                <span class="dim-val" :style="{ color: dimColor(d.score, d.max) }">
                  {{ d.score }}<span class="dim-maxlabel">/{{ d.max }}</span>
                </span>
              </div>
              <div class="dim-track">
                <div class="dim-fill" :style="{ width: (d.score / d.max * 100) + '%', background: dimGradient(d.score, d.max) }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 总体评价 -->
      <div class="mrr-section" v-if="evaluation()?.summary">
        <div class="mrr-section-title">AI 总体评价</div>
        <div class="mrr-card summary-card-mobile">{{ evaluation().summary }}</div>
      </div>

      <!-- 亮点 -->
      <div class="mrr-section" v-if="evaluation()?.strengths?.length">
        <div class="result-card strengths-card">
          <div class="rc-title-colored green"><span class="rc-icon">✨</span>亮点表现</div>
          <ul class="point-list">
            <li v-for="s in evaluation().strengths" :key="s">{{ s }}</li>
          </ul>
        </div>
      </div>

      <!-- 改进建议 -->
      <div class="mrr-section" v-if="evaluation()?.improvements?.length">
        <div class="result-card improve-card">
          <div class="rc-title-colored orange"><span class="rc-icon">💡</span>改进建议</div>
          <ul class="point-list">
            <li v-for="s in evaluation().improvements" :key="s">{{ s }}</li>
          </ul>
        </div>
      </div>

      <!-- 话术对比 -->
      <div class="mrr-section" v-if="scriptExamples.length">
        <button class="script-toggle-btn" @click="scriptOpen = !scriptOpen">
          <span>关键回合话术对比</span>
          <span class="rc-badge">{{ scriptExamples.length }}</span>
          <span class="chevron" :class="{ open: scriptOpen }">›</span>
        </button>
        <div v-show="scriptOpen" style="margin-top:10px;display:flex;flex-direction:column;gap:10px">
          <div v-for="(ex, i) in scriptExamples" :key="i" class="script-item mrr-card">
            <div class="script-round">第 {{ ex.turn ?? (i + 1) }} 轮</div>
            <div class="script-row original">
              <div class="script-tag">你说</div>
              <div class="script-content">{{ ex.original }}</div>
            </div>
            <div class="script-arrow">↓ 更佳表达</div>
            <div class="script-row better">
              <div class="script-tag better">建议</div>
              <div class="script-content">{{ ex.better }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 固定底部按钮 -->
    <div class="mobile-rr-footer">
      <button class="btn-secondary" style="flex:1;height:46px" @click="router.back()">再练一次</button>
      <button class="btn-primary" style="flex:1;height:46px" @click="router.push('/home')">返回任务</button>
    </div>
  </div>
</template>

<style scoped>
/* ── PC Header ── */
.result-header {
  background: linear-gradient(135deg, #5856D6 0%, #AF52DE 100%);
  border-radius: 20px; padding: 28px 32px;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}
.rh-score-wrap { display: flex; flex-direction: column; gap: 8px; }
.rh-score {
  font-size: 52px; font-weight: 900; color: white; line-height: 1;
  letter-spacing: -2px;
}
.rh-max { font-size: 24px; font-weight: 500; opacity: 0.7; letter-spacing: 0; }
.rh-verdict {
  display: inline-block; font-size: 14px; font-weight: 700;
  padding: 4px 14px; border-radius: 20px;
  background: rgba(255,255,255,0.2); color: white;
  width: fit-content;
}
.verdict-pass { background: rgba(52,199,89,0.3); }
.verdict-fail { background: rgba(255,149,0,0.3); }

.rh-stats { display: flex; align-items: center; gap: 24px; }
.rh-stat { text-align: center; }
.rh-stat-val { font-size: 28px; font-weight: 800; color: white; line-height: 1; }
.rh-stat-label { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; font-weight: 500; }
.rh-stat-div { width: 1px; height: 36px; background: rgba(255,255,255,0.25); }

/* ── PC Body ── */
.pc-result-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: start;
}
.pc-result-left { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 20px; }
.pc-result-right { display: flex; flex-direction: column; gap: 16px; }

.result-card {
  background: white; border-radius: 16px;
  box-shadow: var(--shadow-1); padding: 20px;
}
.rc-title {
  font-size: 14px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 14px;
}
.rc-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.rc-title-row .rc-title { margin-bottom: 0; }
.rc-sub { font-size: 12px; color: var(--text-3); font-weight: 400; margin-left: 4px; }
.rc-badge {
  background: linear-gradient(135deg, #5856D6, #AF52DE); color: white;
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
}
.rc-title-colored {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 700; margin-bottom: 12px;
}
.rc-title-colored.green { color: #34C759; }
.rc-title-colored.orange { color: #FF9500; }
.rc-icon { font-size: 14px; }

/* 维度评分 */
.dim-list { display: flex; flex-direction: column; gap: 12px; }
.dim-row { display: flex; flex-direction: column; gap: 6px; }
.dim-top { display: flex; justify-content: space-between; align-items: baseline; }
.dim-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.dim-val { font-size: 14px; font-weight: 800; }
.dim-maxlabel { font-size: 11px; color: var(--text-3); font-weight: 500; }
.dim-track { height: 7px; background: var(--bg-grouped); border-radius: 4px; overflow: hidden; }
.dim-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

/* 总体评价 */
.summary-card { border-left: 3px solid var(--color-primary); }
.summary-text { font-size: 14px; color: var(--text-primary); line-height: 1.65; }

/* 亮点/改进双列 */
.dual-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.strengths-card { background: rgba(52,199,89,0.05); border: 1px solid rgba(52,199,89,0.2); box-shadow: none; }
.improve-card { background: rgba(255,149,0,0.05); border: 1px solid rgba(255,149,0,0.2); box-shadow: none; }
.point-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.point-list li {
  font-size: 13px; color: var(--text-primary); line-height: 1.55;
  padding-left: 12px; position: relative;
}
.point-list li::before {
  content: '•'; position: absolute; left: 0; top: 0;
  color: inherit;
}
.strengths-card .point-list li::before { color: #34C759; }
.improve-card .point-list li::before { color: #FF9500; }

/* 话术对比 */
.script-list { display: flex; flex-direction: column; gap: 16px; }
.script-item { display: flex; flex-direction: column; gap: 8px; }
.script-round {
  font-size: 11px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.4px;
}
.script-row {
  padding: 10px 14px; border-radius: 10px;
  display: flex; flex-direction: column; gap: 4px;
}
.script-row.original { background: rgba(118,118,128,0.07); }
.script-row.better {
  background: rgba(88,86,214,0.06);
  border-left: 3px solid #5856D6;
}
.script-tag {
  font-size: 10px; font-weight: 700;
  color: var(--text-3); text-transform: uppercase;
}
.script-tag.better { color: #5856D6; }
.script-content { font-size: 13px; color: var(--text-primary); line-height: 1.55; }
.script-arrow { font-size: 12px; color: #5856D6; font-weight: 600; text-align: center; padding: 0 4px; }

/* 操作 */
.result-actions { display: flex; gap: 10px; }

/* 对话记录 */
.conv-list { display: flex; flex-direction: column; gap: 8px; }
.conv-item { padding: 10px 0; border-bottom: 1px solid var(--separator); }
.conv-item:last-child { border-bottom: none; }
.conv-role {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.3px;
  margin-bottom: 4px;
}
.conv-role.user { color: var(--color-primary); }
.conv-role.ai { color: #5856D6; }
.conv-text { font-size: 14px; color: var(--text-primary); line-height: 1.6; }

/* ── Mobile result page ── */
.mobile-rr-topbar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: rgba(242,242,247,0.96);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.mobile-rr-topbar .page-title { font-size: 16px; font-weight: 700; }
.mobile-rr-body { padding: 12px 16px 140px; }
.mobile-rr-footer {
  position: fixed;
  bottom: calc(var(--nav-height, 56px) + var(--safe-bottom, 0px));
  left: 0; right: 0;
  display: flex; gap: 10px;
  padding: 10px 16px;
  background: rgba(242,242,247,0.96); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border-top: 0.5px solid rgba(0,0,0,0.08);
  z-index: 50;
}

/* Persona score card */
.mobile-persona-score-card {
  background: white; border-radius: 20px; padding: 28px 20px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 14px;
}
.mpsc-avatar {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, #FF9500, #FF6B00);
  color: white; font-size: 28px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.mpsc-name { font-size: 15px; font-weight: 600; color: var(--text-secondary); }
.mpsc-score { font-size: 64px; font-weight: 900; line-height: 1; letter-spacing: -2px; }
.mpsc-score-label { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
.mpsc-badge { font-size: 13px; font-weight: 700; padding: 4px 16px; border-radius: 20px; margin-top: 4px; }

.mrr-section { margin-bottom: 14px; }
.mrr-section-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; padding-left: 2px; }
.mrr-card {
  background: white; border-radius: 14px; padding: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}

.summary-card-mobile {
  padding: 14px 16px;
  font-size: 14px; color: var(--text-primary); line-height: 1.65;
  border-left: 3px solid var(--color-primary);
}

.script-toggle-btn {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 14px;
  background: rgba(88,86,214,0.07); border: 1px solid rgba(88,86,214,0.2);
  cursor: pointer; font-size: 14px; font-weight: 600; color: #5856D6;
}
.chevron { margin-left: auto; font-size: 16px; transition: transform 200ms; display: inline-block; }
.chevron.open { transform: rotate(90deg); }
</style>
