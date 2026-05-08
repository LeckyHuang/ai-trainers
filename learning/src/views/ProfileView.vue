<!-- ## P03 个人中心：左侧头像+雷达图 / 右侧统计卡+近期记录 -->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tasksApi, authApi } from '@/api'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const auth = useAuthStore()
const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const user = computed(() => auth.user)
const initial = computed(() => (user.value?.display_name || user.value?.username || '?')[0].toUpperCase())
const roleLabel = computed(() => {
  const m: Record<string, string> = { superadmin: '超级管理员', admin: '管理员', trainee: '学员', learner: '学员' }
  return m[user.value?.role || ''] || '学员'
})

// ── 任务数据 ────────────────────────────────────────────
const assignments = ref<any[]>([])
const loading = ref(true)
const activeTab = ref<'all' | 'qa' | 'roleplay'>('all')

onMounted(async () => {
  try {
    const res = await tasksApi.myTasks()
    assignments.value = Array.isArray(res) ? res : (res.items || [])
  } catch {}
  loading.value = false
})

// ── 统计 ────────────────────────────────────────────────
const completedCount = computed(() =>
  assignments.value.filter(a => a.status === 'completed').length
)
const scores = computed(() =>
  assignments.value.map(a => a.best_score ?? a.score).filter((s): s is number => typeof s === 'number')
)
const avgScore = computed(() =>
  scores.value.length ? Math.round(scores.value.reduce((a, b) => a + b, 0) / scores.value.length) : null
)

// 近期记录（按完成时间降序）
const recentRecords = computed(() => {
  const done = assignments.value.filter(a => a.status === 'completed' || a.completed_at)
  return done
    .filter(a => {
      if (activeTab.value === 'qa') return (a.task?.type ?? a.task?.task_type) === 'qa'
      if (activeTab.value === 'roleplay') return (a.task?.type ?? a.task?.task_type) === 'roleplay'
      return true
    })
    .sort((a, b) => new Date(b.completed_at || b.updated_at || 0).getTime() - new Date(a.completed_at || a.updated_at || 0).getTime())
    .slice(0, 10)
})

function formatDuration(seconds?: number) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 1) return `${s}秒`
  return `${m}分钟`
}
function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
function scoreGrade(score?: number) {
  if (score == null) return null
  if (score >= 90) return { label: '优秀', color: '#34C759' }
  if (score >= 75) return { label: '合格', color: '#007AFF' }
  return { label: '待提升', color: '#FF9500' }
}

// ── 雷达图（SVG 6维）────────────────────────────────────
const RADAR_AXES = ['产品知识', '合规意识', '客户开发', '异议处理', '成交技巧', '流程维护']
const RADAR_SIZE = 106  // 容器半径 → SVG 212×212，适配左列宽度
const RADAR_CENTER = RADAR_SIZE
const RADAR_R = RADAR_SIZE - 22  // 图形区半径

// 计算各轴端点（正六边形）
function axisPoint(idx: number, r: number) {
  const angle = (idx * 60 - 90) * Math.PI / 180
  return {
    x: RADAR_CENTER + r * Math.cos(angle),
    y: RADAR_CENTER + r * Math.sin(angle),
  }
}

// 六边形路径（基准网格）
function hexPath(r: number) {
  return RADAR_AXES.map((_, i) => {
    const p = axisPoint(i, r)
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }).join(' ') + ' Z'
}

// 数据路径（雷达值，0~100）
const radarValues = computed(() => {
  // 从完成的 QA 任务中提取得分，映射到六个维度
  const done = assignments.value.filter(a => a.status === 'completed')
  if (!done.length) return RADAR_AXES.map(() => 55 + Math.random() * 20) // 占位
  // 简单映射：取最高分作为能力值（实际应从评分维度聚合）
  const avg = avgScore.value ?? 70
  return [avg * 0.95, avg * 0.88, avg * 0.82, avg * 0.9, avg * 0.85, avg * 0.92].map(v => Math.min(100, Math.max(0, v)))
})

function radarDataPath() {
  return radarValues.value.map((v, i) => {
    const p = axisPoint(i, v / 100 * RADAR_R)
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }).join(' ') + ' Z'
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ── 编辑昵称 ────────────────────────────────────────────
const showEditModal = ref(false)
const editName = ref('')
const editSaving = ref(false)

function openEdit() {
  editName.value = user.value?.display_name || user.value?.username || ''
  showEditModal.value = true
}

async function saveEdit() {
  if (!editName.value.trim()) return
  editSaving.value = true
  try {
    const res = await authApi.updateProfile({ display_name: editName.value.trim() })
    auth.user = { ...auth.user!, display_name: res.display_name }
    localStorage.setItem('user', JSON.stringify(auth.user))
    showEditModal.value = false
  } catch {}
  editSaving.value = false
}

// ── 修改密码 ────────────────────────────────────────────
const showPasswordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSaving = ref(false)
const passwordError = ref('')

function openPasswordModal() {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
  showPasswordModal.value = true
}

async function savePassword() {
  passwordError.value = ''
  if (!oldPassword.value) { passwordError.value = '请输入原密码'; return }
  if (newPassword.value.length < 6) { passwordError.value = '新密码至少6位'; return }
  if (newPassword.value !== confirmPassword.value) { passwordError.value = '两次输入的密码不一致'; return }
  passwordSaving.value = true
  try {
    await authApi.changePassword({ old_password: oldPassword.value, new_password: newPassword.value })
    showPasswordModal.value = false
  } catch (e: any) {
    passwordError.value = e?.response?.data?.detail || '修改失败，请重试'
  }
  passwordSaving.value = false
}
</script>

<template>
  <!-- ===== PC 双列布局 ===== -->
  <div v-if="isPC" class="profile-pc">

    <!-- 左列：头像卡 + 雷达图 -->
    <div class="left-col">

      <!-- 头像卡 -->
      <div class="profile-card card">
        <div class="avatar-section">
          <div class="avatar-circle">{{ initial }}</div>
          <div class="user-info">
            <div class="user-name">{{ user?.display_name || user?.username || '同学' }}</div>
            <div class="user-sub">{{ roleLabel }}{{ user?.department ? ' · ' + user.department : '' }}</div>
          </div>
        </div>
        <div class="user-tags">
          <span class="tag tag-blue">高级用户</span>
          <span class="tag tag-green">
            <AppIcon name="check" :size="11" /> 连续 7 天
          </span>
        </div>
        <button class="edit-btn" @click="openEdit">修改昵称</button>
        <button class="edit-btn" @click="openPasswordModal" style="margin-top:-8px">修改密码</button>
        <button class="logout-btn-inline" @click="handleLogout">退出登录</button>
      </div>

      <!-- 雷达图卡 -->
      <div class="radar-card card">
        <div class="card-section-title">能力雷达</div>
        <div class="radar-wrap">
          <svg :width="RADAR_CENTER * 2" :height="RADAR_CENTER * 2" class="radar-svg">
            <!-- 网格 -->
            <path v-for="layer in [0.25, 0.5, 0.75, 1]" :key="layer"
              :d="hexPath(RADAR_R * layer)"
              fill="none" stroke="var(--separator)" stroke-width="1"
            />
            <!-- 轴线 -->
            <line
              v-for="(_, i) in RADAR_AXES" :key="i"
              :x1="RADAR_CENTER" :y1="RADAR_CENTER"
              :x2="axisPoint(i, RADAR_R).x" :y2="axisPoint(i, RADAR_R).y"
              stroke="var(--separator)" stroke-width="1"
            />
            <!-- 数据区 -->
            <path :d="radarDataPath()"
              fill="rgba(0,122,255,0.15)"
              stroke="#007AFF" stroke-width="2"
              stroke-linejoin="round"
            />
            <!-- 数据点 -->
            <circle
              v-for="(v, i) in radarValues" :key="i"
              :cx="axisPoint(i, v / 100 * RADAR_R).x"
              :cy="axisPoint(i, v / 100 * RADAR_R).y"
              r="3.5" fill="white" stroke="#007AFF" stroke-width="2"
            />
            <!-- 轴标签 -->
            <text
              v-for="(label, i) in RADAR_AXES" :key="'l'+i"
              :x="axisPoint(i, RADAR_R + 16).x"
              :y="axisPoint(i, RADAR_R + 16).y + 4"
              text-anchor="middle"
              font-size="11"
              fill="var(--text-secondary)"
            >{{ label }}</text>
          </svg>
        </div>
      </div>

    </div>

    <!-- 右列：统计 + 近期记录 -->
    <div class="right-col">

      <!-- 四格统计 -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon stat-icon-blue"><AppIcon name="check-circle" :size="18" /></div>
          <div class="stat-val">{{ loading ? '…' : completedCount }}</div>
          <div class="stat-main-label">已完成任务</div>
          <div class="stat-sub">本月</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon stat-icon-green"><AppIcon name="chart" :size="18" /></div>
          <div class="stat-val">{{ avgScore ?? '--' }}</div>
          <div class="stat-main-label">平均分</div>
          <div class="stat-sub">团队 +6</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon stat-icon-orange"><AppIcon name="clock" :size="18" /></div>
          <div class="stat-val">—</div>
          <div class="stat-main-label">学习时长</div>
          <div class="stat-sub">小时本月</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon stat-icon-purple"><AppIcon name="trophy" :size="18" /></div>
          <div class="stat-val">—</div>
          <div class="stat-main-label">团队排名</div>
          <div class="stat-sub">/ 全部成员</div>
        </div>
      </div>

      <!-- 近期记录 -->
      <div class="records-card card">
        <div class="records-header">
          <span class="card-section-title" style="padding:0">近期记录</span>
          <div class="tab-group">
            <button v-for="(label, key) in { all:'全部', qa:'知识', roleplay:'对练' }" :key="key"
              class="tab-btn" :class="{ active: activeTab === key }"
              @click="activeTab = key as any"
            >{{ label }}</button>
          </div>
        </div>

        <div v-if="loading" style="text-align:center;padding:32px"><div class="spinner" /></div>
        <div v-else-if="recentRecords.length === 0" class="records-empty">暂无记录</div>
        <table v-else class="records-table">
          <thead>
            <tr>
              <th>任务</th>
              <th>类型</th>
              <th>得分</th>
              <th>用时</th>
              <th>完成时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in recentRecords" :key="a.id" @click="router.push(`/tasks/${a.task_id}`)">
              <td class="task-name-cell">{{ a.task?.title || '—' }}</td>
              <td>
                <span class="type-tag" :class="(a.task?.type ?? a.task?.task_type) === 'roleplay' ? 'type-purple' : 'type-blue'">
                  {{ (a.task?.type ?? a.task?.task_type) === 'roleplay' ? '模拟对练' : '知识问答' }}
                </span>
              </td>
              <td>
                <div v-if="a.best_score != null" class="score-cell">
                  <span class="score-num">{{ a.best_score }}</span>
                  <span class="score-grade" :style="{ color: scoreGrade(a.best_score)?.color }">
                    {{ scoreGrade(a.best_score)?.label }}
                  </span>
                </div>
                <span v-else class="score-num" style="color:var(--text-tertiary)">—</span>
              </td>
              <td class="secondary-cell">{{ formatDuration(a.duration_seconds) }}</td>
              <td class="secondary-cell">{{ formatDate(a.completed_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>

  <!-- ===== 移动端布局 ===== -->
  <div v-else class="page-container">
    <!-- Hero -->
    <div class="mobile-hero">
      <!-- 右上角退出登录图标 -->
      <button class="logout-icon-btn" @click="handleLogout" title="退出登录">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>

      <!-- 头像（可点击编辑） -->
      <div class="mobile-avatar-wrap" @click="openEdit">
        <div class="mobile-avatar">{{ initial }}</div>
        <div class="avatar-edit-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      </div>

      <div class="mobile-name" @click="openEdit" style="cursor:pointer">{{ user?.display_name || user?.username || '同学' }}</div>
      <div class="mobile-sub">{{ roleLabel }}{{ user?.department ? ' · ' + user.department : '' }}</div>
      <div class="mobile-tags">
        <span class="tag tag-white-outline">高级用户</span>
        <span class="tag tag-white-outline"><AppIcon name="check" :size="11" /> 连续 7 天</span>
      </div>
    </div>

    <!-- 统计行（彩色数值） -->
    <div class="mobile-stats">
      <div class="mobile-stat">
        <div class="mobile-stat-val" style="color:#007AFF">{{ loading ? '…' : completedCount }}</div>
        <div class="mobile-stat-label">已完成</div>
      </div>
      <div class="mobile-stat-divider" />
      <div class="mobile-stat">
        <div class="mobile-stat-val" style="color:#34C759">{{ avgScore ?? '--' }}</div>
        <div class="mobile-stat-label">平均分</div>
      </div>
      <div class="mobile-stat-divider" />
      <div class="mobile-stat">
        <div class="mobile-stat-val" style="color:#FF9500">{{ scores.length ? Math.max(...scores) : '--' }}</div>
        <div class="mobile-stat-label">最高分</div>
      </div>
    </div>

    <!-- 设置菜单 -->
    <div class="section">
      <div class="mobile-menu-card card">
        <div class="mobile-menu-item" @click="openEdit">
          <span class="menu-icon menu-icon-blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span class="menu-label">修改昵称</span>
          <span class="menu-chevron">›</span>
        </div>
        <div class="menu-divider" />
        <div class="mobile-menu-item" @click="openPasswordModal">
          <span class="menu-icon menu-icon-orange">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span class="menu-label">修改密码</span>
          <span class="menu-chevron">›</span>
        </div>
        <div class="menu-divider" />
        <div class="mobile-menu-item" @click="handleLogout">
          <span class="menu-icon menu-icon-red">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span class="menu-label" style="color:#FF3B30">退出登录</span>
          <span class="menu-chevron">›</span>
        </div>
      </div>
    </div>

    <!-- 近期记录 -->
    <div class="section">
      <div class="section-title">近期记录</div>
      <div class="mobile-tabs-row">
        <button v-for="(label, key) in { all:'全部', qa:'知识', roleplay:'对练' }" :key="key"
          class="mobile-tab" :class="{ active: activeTab === key }"
          @click="activeTab = key as any"
        >{{ label }}</button>
      </div>
      <div v-if="loading" style="text-align:center;padding:20px"><div class="spinner" /></div>
      <div v-else-if="!recentRecords.length" class="records-empty">暂无记录</div>
      <div v-else class="card" style="overflow:hidden">
        <div
          v-for="(a, i) in recentRecords" :key="a.id"
          class="mobile-record-row"
          :class="{ last: i === recentRecords.length - 1 }"
          @click="router.push(`/tasks/${a.task_id}`)"
        >
          <div class="mobile-record-left">
            <div class="mobile-record-name">{{ a.task?.title || '—' }}</div>
            <span class="type-tag" :class="(a.task?.type ?? a.task?.task_type) === 'roleplay' ? 'type-purple' : 'type-blue'">
              {{ (a.task?.type ?? a.task?.task_type) === 'roleplay' ? '模拟对练' : '知识问答' }}
            </span>
          </div>
          <div class="mobile-record-right">
            <div class="mobile-record-score">{{ a.best_score ?? '—' }}</div>
            <div class="mobile-record-date">{{ formatDate(a.completed_at) }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- 编辑昵称弹窗 -->
  <div v-if="showEditModal" class="edit-modal-overlay" @click.self="showEditModal = false">
    <div class="edit-modal">
      <div class="edit-modal-title">修改昵称</div>
      <input
        v-model="editName"
        class="edit-modal-input"
        placeholder="请输入昵称"
        maxlength="20"
        @keyup.enter="saveEdit"
        autofocus
      />
      <div class="edit-modal-actions">
        <button class="edit-cancel" @click="showEditModal = false">取消</button>
        <button class="edit-confirm" :disabled="editSaving" @click="saveEdit">
          {{ editSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 修改密码弹窗 -->
  <div v-if="showPasswordModal" class="edit-modal-overlay" @click.self="showPasswordModal = false">
    <div class="edit-modal">
      <div class="edit-modal-title">修改密码</div>
      <input
        v-model="oldPassword"
        class="edit-modal-input"
        type="password"
        placeholder="原密码"
        autocomplete="current-password"
      />
      <input
        v-model="newPassword"
        class="edit-modal-input"
        type="password"
        placeholder="新密码（至少6位）"
        autocomplete="new-password"
      />
      <input
        v-model="confirmPassword"
        class="edit-modal-input"
        type="password"
        placeholder="确认新密码"
        autocomplete="new-password"
        @keyup.enter="savePassword"
      />
      <div v-if="passwordError" class="password-error">{{ passwordError }}</div>
      <div class="edit-modal-actions">
        <button class="edit-cancel" @click="showPasswordModal = false">取消</button>
        <button class="edit-confirm" :disabled="passwordSaving" @click="savePassword">
          {{ passwordSaving ? '保存中...' : '确认修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===================== PC ===================== */
.profile-pc {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  align-items: start;
}

/* 左列 */
.left-col { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 0; }

.profile-card { overflow: hidden; }
.avatar-section {
  padding: 24px 20px 16px;
  display: flex; align-items: center; gap: 14px;
}
.avatar-circle {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white; font-size: 28px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,122,255,0.35);
}
.user-info { flex: 1; }
.user-name { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.user-sub { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }

.user-tags {
  display: flex; gap: 6px;
  padding: 0 20px 14px;
}
.tag {
  font-size: 11px; font-weight: 600;
  padding: 3px 9px; border-radius: 20px;
  display: inline-flex; align-items: center; gap: 3px;
}
.tag-blue { background: rgba(0,122,255,0.1); color: #007AFF; }
.tag-green { background: rgba(52,199,89,0.1); color: #34C759; }
.tag-white-outline { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); }

.edit-btn {
  display: block; width: calc(100% - 40px); margin: 0 20px 20px;
  padding: 9px 0; border-radius: 10px;
  background: var(--bg-grouped); border: 1px solid var(--separator);
  font-size: 13px; font-weight: 500; color: var(--text-primary);
  cursor: pointer; transition: background 120ms;
}
.edit-btn:hover { background: var(--bg-secondary); }

/* 雷达图卡 */
.radar-card { overflow: visible; }  /* 允许轴标签渲染到卡片外 */
.card-section-title {
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  padding: 16px 20px 8px;
}
.radar-wrap {
  display: flex; justify-content: center;
  padding: 4px 8px 16px;
}
.radar-svg { overflow: visible; }

/* 右列 */
.right-col { display: flex; flex-direction: column; gap: 16px; }

/* 四格统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  padding: 16px;
  display: flex; flex-direction: column;
}
.stat-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px;
}
.stat-icon-blue   { background: rgba(0,122,255,0.1);   color: #007AFF; }
.stat-icon-green  { background: rgba(52,199,89,0.1);   color: #34C759; }
.stat-icon-orange { background: rgba(255,149,0,0.1);   color: #FF9500; }
.stat-icon-purple { background: rgba(175,82,222,0.1);  color: #AF52DE; }
.stat-val {
  font-size: 28px; font-weight: 800; color: var(--text-primary);
  line-height: 1.1; margin-bottom: 4px;
}
.stat-main-label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.stat-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }

/* 近期记录 */
.records-card { overflow: hidden; }
.records-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--separator);
}
.tab-group { display: flex; gap: 4px; }
.tab-btn {
  padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  cursor: pointer; transition: all 120ms;
}
.tab-btn.active {
  background: var(--color-primary); color: white; font-weight: 600;
}
.tab-btn:not(.active):hover { background: var(--bg-grouped); }

.records-empty {
  text-align: center; padding: 40px;
  font-size: 13px; color: var(--text-tertiary);
}
.records-table {
  width: 100%; border-collapse: collapse;
}
.records-table thead th {
  font-size: 11px; font-weight: 600; color: var(--text-tertiary);
  text-align: left; padding: 10px 20px;
  background: var(--bg-grouped);
  border-bottom: 1px solid var(--separator);
  text-transform: uppercase; letter-spacing: 0.4px;
}
.records-table tbody tr {
  border-bottom: 1px solid var(--separator);
  cursor: pointer; transition: background 120ms;
}
.records-table tbody tr:last-child { border-bottom: none; }
.records-table tbody tr:hover { background: var(--bg-grouped); }
.records-table td { padding: 13px 20px; }

.task-name-cell {
  font-size: 14px; font-weight: 500; color: var(--text-primary);
  max-width: 220px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.type-tag {
  font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 4px;
  display: inline-block;
}
.type-blue   { background: rgba(0,122,255,0.1);   color: #007AFF; }
.type-purple { background: rgba(175,82,222,0.1);  color: #AF52DE; }
.score-cell { display: flex; align-items: center; gap: 6px; }
.score-num { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.score-grade { font-size: 11px; font-weight: 600; }
.secondary-cell { font-size: 13px; color: var(--text-secondary); }

/* 退出登录 —— 内嵌在个人信息卡底部 */
.logout-btn-inline {
  display: block; width: calc(100% - 40px); margin: 0 20px 16px;
  padding: 9px 0; border-radius: 10px;
  background: transparent; border: 1px solid rgba(255,59,48,0.35);
  font-size: 13px; font-weight: 500; color: var(--color-danger, #FF3B30);
  cursor: pointer; transition: background 120ms;
}
.logout-btn-inline:hover { background: rgba(255,59,48,0.06); }

/* ===================== 移动端 ===================== */
.mobile-hero {
  background: linear-gradient(160deg, #007AFF 0%, #5856D6 100%);
  padding: 32px 20px 28px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  color: white;
  position: relative;
}
.logout-icon-btn {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.15);
  color: white; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 150ms;
}
.logout-icon-btn:hover { background: rgba(255,255,255,0.25); }

.mobile-avatar-wrap {
  position: relative; cursor: pointer; margin-bottom: 8px;
}
.mobile-avatar {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 3px solid rgba(255,255,255,0.35);
  font-size: 32px; font-weight: 700; color: white;
  display: flex; align-items: center; justify-content: center;
}
.avatar-edit-badge {
  position: absolute; bottom: 0; right: 0;
  width: 24px; height: 24px; border-radius: 50%;
  background: white; color: #5856D6;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.mobile-name { font-size: 22px; font-weight: 700; }
.mobile-sub { font-size: 13px; opacity: 0.8; margin-bottom: 6px; }
.mobile-tags { display: flex; gap: 6px; }

.mobile-stats {
  display: flex; align-items: center;
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  box-shadow: var(--shadow-2);
  margin-top: -20px;
  padding: 16px 0;
  z-index: 1; position: relative;
}
.mobile-stat { flex: 1; text-align: center; }
.mobile-stat-divider { width: 1px; height: 32px; background: var(--separator); }
.mobile-stat-val { font-size: 22px; font-weight: 800; }
.mobile-stat-label { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }

/* 设置菜单 */
.mobile-menu-card { padding: 0; overflow: hidden; }
.mobile-menu-item {
  display: flex; align-items: center; gap: 12px;
  padding: 15px 16px; cursor: pointer;
  transition: background 120ms;
}
.mobile-menu-item:active { background: var(--bg-grouped); }
.menu-icon {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.menu-icon-blue { background: rgba(0,122,255,0.12); color: #007AFF; }
.menu-icon-orange { background: rgba(255,149,0,0.12); color: #FF9500; }
.menu-icon-red { background: rgba(255,59,48,0.1); color: #FF3B30; }
.menu-label { flex: 1; font-size: 15px; font-weight: 500; color: var(--text-primary); }
.menu-chevron { font-size: 18px; color: var(--text-tertiary); }
.menu-divider { height: 1px; background: var(--separator); margin: 0 16px; }

.mobile-tabs-row { display: flex; gap: 6px; margin-bottom: 10px; }
.mobile-tab {
  padding: 5px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  cursor: pointer;
}
.mobile-tab.active { background: var(--color-primary); color: white; font-weight: 600; }

.mobile-record-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid var(--separator);
  cursor: pointer;
}
.mobile-record-row.last { border-bottom: none; }
.mobile-record-left { flex: 1; }
.mobile-record-name {
  font-size: 14px; font-weight: 500; color: var(--text-primary);
  margin-bottom: 4px;
}
.mobile-record-right { text-align: right; flex-shrink: 0; margin-left: 12px; }
.mobile-record-score { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.mobile-record-date { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }

.records-empty { text-align: center; padding: 24px; font-size: 13px; color: var(--text-tertiary); }

/* 编辑弹窗 */
.edit-modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.edit-modal {
  background: white; border-radius: 16px;
  padding: 24px; width: 100%; max-width: 320px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.edit-modal-title {
  font-size: 16px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 16px; text-align: center;
}
.edit-modal-input {
  width: 100%; box-sizing: border-box;
  padding: 11px 14px; border-radius: 10px;
  border: 1.5px solid var(--border);
  font-size: 15px; color: var(--text-primary);
  outline: none; margin-bottom: 16px;
  transition: border-color 150ms;
}
.edit-modal-input:focus { border-color: var(--color-primary, #007AFF); }
.edit-modal-actions {
  display: flex; gap: 10px;
}
.edit-cancel {
  flex: 1; padding: 11px 0; border-radius: 10px;
  background: var(--bg-grouped); color: var(--text-secondary);
  font-size: 14px; font-weight: 600; cursor: pointer;
  border: 1px solid var(--separator);
}
.edit-confirm {
  flex: 1; padding: 11px 0; border-radius: 10px;
  background: var(--color-primary, #007AFF); color: white;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.edit-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

.password-error {
  font-size: 13px; color: #FF3B30; text-align: center;
  margin-top: -8px; margin-bottom: 10px;
}
</style>
