<!-- ## 首页：任务列表（PC 双栏卡片 / 移动端单栏列表，同数据源）-->
<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tasksApi } from '@/api'
import type { TaskAssignment } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const assignments = ref<TaskAssignment[]>([])
const activeFilter = ref<'all' | 'qa' | 'roleplay'>('all')
const windowWidth = ref(window.innerWidth)

const isPC = computed(() => windowWidth.value >= 768)

function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const filtered = computed(() => {
  if (activeFilter.value === 'all') return assignments.value
  return assignments.value.filter(a => {
    const t = a.task.type || a.task.task_type
    return t === activeFilter.value
  })
})
function getTaskType(task: any) { return task.type || task.task_type || 'qa' }

const stats = computed(() => ({
  total: assignments.value.length,
  completed: assignments.value.filter(a => a.status === 'completed').length,
  started: assignments.value.filter(a => a.status === 'started').length,
}))

onMounted(async () => {
  try {
    const res = await tasksApi.myTasks()
    assignments.value = Array.isArray(res) ? res : (res.items ?? [])
  } catch {}
  loading.value = false
})

function getTypeLabel(type: string) {
  return type === 'qa' ? '知识问答' : '模拟对练'
}

// StatusDot helpers
function getPracticeState(a: TaskAssignment): 'todo' | 'progress' | 'done' {
  if (a.status === 'completed') return 'done'
  if (a.status === 'started') return 'progress'
  return 'todo'
}
function getExamState(a: TaskAssignment): 'todo' | 'progress' | 'done' | 'locked' {
  const practiceState = getPracticeState(a)
  if (practiceState !== 'done') return 'locked'
  const examStatus = (a as any).exam_status
  if (!examStatus) return 'locked'
  if (examStatus === 'completed') return 'done'
  if (examStatus === 'started') return 'progress'
  return 'todo'
}

// Deadline urgency helpers
function getDeadlineInfo(a: TaskAssignment): { text: string; urgent: boolean; cls: string } | null {
  const endAt = (a.task as any).end_at as string | undefined
  if (!endAt) return null
  const now = new Date()
  const end = new Date(endAt)
  const diffMs = end.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffMs <= 0) return { text: '已截止', urgent: true, cls: 'deadline-red' }
  if (diffDays <= 2) {
    const hh = end.getHours().toString().padStart(2, '0')
    const mm = end.getMinutes().toString().padStart(2, '0')
    const prefix = diffDays <= 0.3 ? '今天' : '明天'
    return { text: `${prefix} ${hh}:${mm}`, urgent: true, cls: 'deadline-red' }
  }
  const days = Math.ceil(diffDays)
  if (diffDays <= 7) return { text: `${days} 天后`, urgent: false, cls: 'deadline-orange' }
  return { text: `${end.getMonth() + 1}月${end.getDate()}日`, urgent: false, cls: 'deadline-secondary' }
}

const filterTabs = [
  ['all', '全部'],
  ['qa', '知识问答'],
  ['roleplay', '模拟对练'],
] as const

const mobileTab = ref<'todo' | 'doing' | 'done'>('todo')
const mobileTabs = [
  { key: 'todo', label: '待完成' },
  { key: 'doing', label: '进行中' },
  { key: 'done', label: '已完成' },
] as const

const todoCnt = computed(() => assignments.value.filter(a => a.status === 'assigned').length)
const doingCnt = computed(() => assignments.value.filter(a => a.status === 'started').length)
const doneCnt = computed(() => assignments.value.filter(a => a.status === 'completed').length)

const filteredMobile = computed(() => {
  const map = { todo: 'assigned', doing: 'started', done: 'completed' }
  return assignments.value.filter(a => a.status === map[mobileTab.value])
})

function userInitial() {
  const name = auth.user?.display_name || auth.user?.username || '?'
  return name.charAt(0).toUpperCase()
}
</script>

<template>
  <!-- ========== PC Layout ========== -->
  <div v-if="isPC">
    <div class="pc-content-title">欢迎回来，{{ auth.user?.display_name || auth.user?.username || '同学' }}</div>
    <div class="pc-content-sub">本周还有 {{ stats.total - stats.completed }} 个待完成任务，加油完成它们</div>

    <!-- Stat cards -->
    <div class="pc-stat-grid">
      <div class="pc-stat-card">
        <div class="pc-stat-icon" style="background:rgba(0,122,255,0.1);color:var(--color-primary)"><AppIcon name="check-circle" :size="22" /></div>
        <div>
          <div class="pc-stat-label">本月已完成</div>
          <div class="pc-stat-value" style="color:var(--color-primary)">{{ stats.completed }}</div>
        </div>
      </div>
      <div class="pc-stat-card">
        <div class="pc-stat-icon" style="background:rgba(52,199,89,0.1);color:var(--color-success)"><AppIcon name="chart-bar" :size="22" /></div>
        <div>
          <div class="pc-stat-label">进行中</div>
          <div class="pc-stat-value" style="color:var(--color-success)">{{ stats.started }}</div>
        </div>
      </div>
      <div class="pc-stat-card">
        <div class="pc-stat-icon" style="background:rgba(255,149,0,0.1);color:var(--color-warning)"><AppIcon name="trophy" :size="22" /></div>
        <div>
          <div class="pc-stat-label">待完成</div>
          <div class="pc-stat-value" style="color:var(--color-warning)">{{ stats.total - stats.completed - stats.started }}</div>
        </div>
      </div>
    </div>

    <!-- Section header -->
    <div class="pc-section-header">
      <div class="pc-section-title">
        待完成任务
        <span style="padding:2px 8px;border-radius:20px;background:var(--color-primary-light);color:var(--color-primary);font-size:11px;font-weight:600;margin-left:8px">{{ filtered.length }}</span>
      </div>
      <div class="filter-tabs" style="padding:0">
        <button
          v-for="f in filterTabs"
          :key="f[0]"
          class="filter-tab"
          :class="{ active: activeFilter === f[0] }"
          @click="activeFilter = f[0]"
        >{{ f[1] }}</button>
      </div>
    </div>

    <!-- Task grid / empty / loading -->
    <div v-if="loading" class="empty-state"><div class="spinner" /><div class="msg">加载中...</div></div>
    <div v-else-if="filtered.length === 0" class="empty-state"><div class="icon"><AppIcon name="inbox" :size="48" /></div><div class="msg">暂无任务</div></div>
    <div v-else class="pc-task-grid">
      <div
        v-for="a in filtered"
        :key="a.id"
        class="card task-card-pc"
        @click="router.push(`/tasks/${a.task_id}`)"
      >
        <div class="task-card-inner">
          <div class="task-icon-pc" :class="getTaskType(a.task)">
            <AppIcon :name="getTaskType(a.task) === 'qa' ? 'task-qa' : 'task-roleplay'" :size="20" />
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:var(--color-primary);letter-spacing:0.3px;margin-bottom:2px">{{ getTypeLabel(getTaskType(a.task)).toUpperCase() }}</div>
            <div style="font-size:16px;font-weight:600;color:var(--text-primary);line-height:1.3;margin-bottom:2px">{{ a.task.title }}</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.4">{{ a.task.description || '暂无描述' }}</div>
          </div>
          <span style="font-size:20px;color:var(--text-tertiary);flex-shrink:0">›</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--separator);margin-top:10px">
          <div style="display:flex;gap:10px;align-items:center">
            <span class="status-dot-item" :class="`dot-${getPracticeState(a)}`">
              <span class="status-dot"></span>练习·<span class="dot-state-label">{{ { todo: '未开始', progress: '进行中', done: '已完成' }[getPracticeState(a)] }}</span>
            </span>
            <span class="status-dot-item" :class="`dot-${getExamState(a)}`">
              <span class="status-dot"></span>考核·<span class="dot-state-label">{{ { todo: '未开始', progress: '进行中', done: '已完成', locked: '未解锁' }[getExamState(a)] }}</span>
            </span>
          </div>
          <span v-if="getDeadlineInfo(a)" :class="getDeadlineInfo(a)!.cls" style="font-size:11px;font-weight:600">{{ getDeadlineInfo(a)!.text }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ========== Mobile Layout ========== -->
  <div v-else class="page-container">
    <!-- Greeting header -->
    <div class="home-header">
      <div>
        <div class="greeting-sub">欢迎回来</div>
        <div class="greeting-name">{{ auth.user?.display_name || auth.user?.username || '同学' }}，加油 👋</div>
      </div>
      <div class="avatar-circle" @click="router.push('/profile')">{{ userInitial() }}</div>
    </div>

    <!-- iOS Segmented Control -->
    <div class="seg-wrap">
      <div class="segmented-control">
        <div
          class="seg-indicator"
          :style="{ left: `calc(${mobileTabs.findIndex(t => t.key === mobileTab) * (100 / 3)}% + 2px)`, width: `calc(${100 / 3}% - 4px)` }"
        />
        <button
          v-for="tab in mobileTabs" :key="tab.key"
          class="seg-btn"
          :class="{ active: mobileTab === tab.key }"
          @click="mobileTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'todo' && todoCnt > 0" class="seg-count">{{ todoCnt }}</span>
          <span v-else-if="tab.key === 'doing' && doingCnt > 0" class="seg-count">{{ doingCnt }}</span>
          <span v-else-if="tab.key === 'done' && doneCnt > 0" class="seg-count-done">{{ doneCnt }}</span>
        </button>
      </div>
    </div>

    <!-- Task list by status -->
    <div class="mobile-task-section">
      <div v-if="loading" class="empty-state"><div class="spinner" /></div>
      <div v-else-if="filteredMobile.length === 0" class="empty-state">
        <div class="icon"><AppIcon name="inbox" :size="44" /></div>
        <div class="msg">{{ mobileTab === 'done' ? '暂无已完成任务' : '暂无任务' }}</div>
      </div>
      <div v-else class="task-list">
        <div
          v-for="a in filteredMobile"
          :key="a.id"
          class="task-card card"
          @click="router.push(`/tasks/${a.task_id}`)"
        >
          <!-- Top row: icon + info + chevron -->
          <div class="task-card-top">
            <div class="task-icon" :class="getTaskType(a.task)">
              <AppIcon :name="getTaskType(a.task) === 'qa' ? 'task-qa' : 'task-roleplay'" :size="20" />
            </div>
            <div class="task-info">
              <div class="type-label" :class="getTaskType(a.task) === 'qa' ? 'type-label-blue' : 'type-label-green'">
                {{ getTypeLabel(getTaskType(a.task)) }}
              </div>
              <div class="task-title">{{ a.task.title }}</div>
              <div v-if="a.task.description" class="task-desc">{{ a.task.description }}</div>
            </div>
            <span class="task-arrow">›</span>
          </div>
          <!-- Bottom row: status + deadline -->
          <div class="task-bottom-row">
            <div class="status-items">
              <span class="status-item" :class="`dot-${getPracticeState(a)}`">
                <span v-if="getPracticeState(a) === 'done'" class="status-check">✓</span>
                <span v-else class="status-dot" />
                练习·{{ { todo: '待开始', progress: '进行中', done: '已完成' }[getPracticeState(a)] }}
              </span>
              <span class="status-item" :class="`dot-${getExamState(a)}`">
                <span v-if="getExamState(a) === 'done'" class="status-check">✓</span>
                <span v-else class="status-dot" />
                考核·{{ { todo: '待开始', progress: '进行中', done: '已完成', locked: '待解锁' }[getExamState(a)] }}
              </span>
            </div>
            <span v-if="getDeadlineInfo(a)" class="deadline-chip" :class="getDeadlineInfo(a)!.cls">
              <span class="deadline-icon">{{ getDeadlineInfo(a)!.urgent ? '△' : '○' }}</span>{{ getDeadlineInfo(a)!.text }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Mobile styles --- */
.home-header {
  background: white;
  padding: 16px 20px 14px;
  display: flex; align-items: center; justify-content: space-between;
}
.greeting-sub { font-size: 13px; color: var(--text-secondary); margin-bottom: 2px; }
.greeting-name { font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }
.avatar-circle {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white; font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; cursor: pointer;
}

/* Segmented Control wrapper */
.seg-wrap { padding: 0 16px 12px; background: white; }

/* iOS Segmented Control */
.segmented-control {
  position: relative;
  display: flex; align-items: center;
  background: rgba(118,118,128,0.12);
  border-radius: 9px; padding: 2px;
}
.seg-indicator {
  position: absolute; top: 2px; bottom: 2px;
  background: white; border-radius: 7px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 0 0 0.5px rgba(0,0,0,0.04);
  transition: left 250ms cubic-bezier(.4,0,.2,1);
  pointer-events: none;
}
.seg-btn {
  flex: 1; padding: 7px 4px;
  text-align: center; font-size: 13px; font-weight: 600;
  color: var(--text-secondary);
  position: relative; z-index: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  transition: color 200ms;
}
.seg-btn.active { color: var(--text-primary); }
.seg-count {
  background: #007AFF; color: white;
  font-size: 10px; font-weight: 700;
  padding: 1px 5px; border-radius: 10px; min-width: 16px; text-align: center;
}
.seg-count-done {
  background: rgba(52,199,89,0.15); color: #34C759;
  font-size: 10px; font-weight: 700;
  padding: 1px 5px; border-radius: 10px; min-width: 16px; text-align: center;
}

/* Task section wrapper */
.mobile-task-section { padding: 12px 16px 16px; }
.task-list { display: flex; flex-direction: column; gap: 10px; }

/* Task card */
.task-card {
  padding: 14px 16px; cursor: pointer;
  transition: transform 100ms;
  display: flex; flex-direction: column; gap: 0;
}
.task-card:active { transform: scale(0.98); }

.task-card-top { display: flex; align-items: flex-start; gap: 12px; }

.task-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.task-icon.qa { background: rgba(0,122,255,0.1); color: #007AFF; }
.task-icon.roleplay { background: rgba(52,199,89,0.12); color: #34C759; }

.task-info { flex: 1; min-width: 0; }
.type-label { font-size: 11px; font-weight: 600; letter-spacing: 0.3px; margin-bottom: 3px; }
.type-label-blue { color: #007AFF; }
.type-label-green { color: #34C759; }
.task-title { font-size: 16px; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
.task-desc {
  font-size: 12px; color: var(--text-secondary);
  margin-top: 3px; line-height: 1.45;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
}
.task-arrow { font-size: 20px; color: var(--text-tertiary); flex-shrink: 0; line-height: 1; }

/* Status + deadline bottom row */
.task-bottom-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 10px; padding-top: 10px;
  border-top: 0.5px solid var(--separator);
  gap: 6px;
}
.status-items { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.status-item {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 500; white-space: nowrap;
}
.status-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.status-check {
  display: inline-flex; align-items: center; justify-content: center;
  width: 12px; height: 12px; border-radius: 50%;
  background: #34C759; color: white;
  font-size: 8px; font-weight: 900; flex-shrink: 0; line-height: 1;
}
.dot-todo { color: var(--text-secondary); }
.dot-todo .status-dot { background: transparent; border: 1.5px solid #C7C7CC; }
.dot-progress { color: #007AFF; }
.dot-progress .status-dot { background: #007AFF; }
.dot-done { color: #34C759; }
.dot-locked { color: var(--text-tertiary); }
.dot-locked .status-dot { background: transparent; border: 1.5px solid #C7C7CC; }

/* Deadline chip */
.deadline-chip { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
.deadline-icon { font-size: 10px; }
.deadline-red { color: #FF3B30; }
.deadline-orange { color: #FF9500; }
.deadline-secondary { color: var(--text-secondary); }

/* --- PC task card --- */
.task-card-pc {
  padding: 14px; cursor: pointer;
  transition: all 200ms;
  display: flex; flex-direction: column;
}
.task-card-pc:hover { box-shadow: var(--shadow-2); transform: translateY(-1px); }
.task-card-inner { display: flex; align-items: flex-start; gap: 12px; }
.task-icon-pc {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.task-icon-pc.qa { background: rgba(0,122,255,0.1); color: #007AFF; }
.task-icon-pc.roleplay { background: rgba(52,199,89,0.12); color: #34C759; }

/* PC status dot */
.status-dot-item { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; }
.dot-todo .status-dot { background: transparent; border: 1.5px solid #C7C7CC; display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.dot-progress .status-dot { background: #007AFF; display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.dot-done .status-dot { background: #34C759; display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.dot-locked .status-dot { background: transparent; border: 1.5px solid #C7C7CC; display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.dot-todo { color: var(--text-secondary); }
.dot-progress { color: #007AFF; }
.dot-done { color: #34C759; }
.dot-locked { color: var(--text-tertiary); }
.dot-state-label {}
</style>
