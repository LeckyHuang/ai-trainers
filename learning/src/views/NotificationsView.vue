<!-- ## P02 通知中心：三栏布局（分类侧边栏 + 消息列表 + 详情面板） -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { notificationsApi, tasksApi } from '@/api'
import { showToast } from '@/composables/toast'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()

// ── 响应式断点 ──────────────────────────────────────────────
const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// ── 通知数据 ──────────────────────────────────────────────
const loading = ref(true)
const notifications = ref<any[]>([])
const selectedId = ref<string | null>(null)
const selectedTask = ref<any>(null)
const taskLoading = ref(false)

// 活跃分类
const activeCategory = ref<'all' | 'exam' | 'feedback' | 'system'>('all')

// 通知类型分组
function getCategory(n: any): 'exam' | 'feedback' | 'system' {
  const t = n.type ?? n.notification_type ?? ''
  if (['task_assigned', 'task_reminder'].includes(t)) return 'exam'
  if (['feedback', 'review', 'comment', 'praise'].includes(t)) return 'feedback'
  return 'system'
}

// 分类计数
const counts = computed(() => {
  const all = notifications.value.length
  const exam = notifications.value.filter(n => getCategory(n) === 'exam').length
  const feedback = notifications.value.filter(n => getCategory(n) === 'feedback').length
  const system = notifications.value.filter(n => getCategory(n) === 'system').length
  return { all, exam, feedback, system }
})

// 当前分类筛选后的列表
const filtered = computed(() => {
  if (activeCategory.value === 'all') return notifications.value
  return notifications.value.filter(n => getCategory(n) === activeCategory.value)
})

const unreadCount = computed(() => filtered.value.filter(n => !n.is_read).length)

// 当前选中通知
const selected = computed(() => notifications.value.find(n => n.id === selectedId.value) ?? null)

onMounted(async () => {
  try {
    const res = await notificationsApi.list()
    notifications.value = Array.isArray(res) ? res : (res.items ?? [])
    // 默认选中第一条
    if (notifications.value.length > 0) selectNotif(notifications.value[0])
  } catch {}
  loading.value = false
})

// 选中通知
async function selectNotif(n: any) {
  selectedId.value = n.id
  selectedTask.value = null

  // 标记已读
  if (!n.is_read) {
    try {
      await notificationsApi.markRead(n.id)
      n.is_read = true
      window.dispatchEvent(new Event('notif-read'))
    } catch {}
  }

  // 有关联任务则拉取任务详情
  const taskId = n.task_id
  if (taskId) {
    taskLoading.value = true
    try {
      selectedTask.value = await tasksApi.get(taskId)
    } catch {}
    taskLoading.value = false
  }
}

// 全部标为已读
async function markAll() {
  try {
    await notificationsApi.markAllRead()
    notifications.value.forEach(n => { n.is_read = true })
    window.dispatchEvent(new Event('notif-read'))
    showToast('已全部标记为已读', 'success')
  } catch { showToast('操作失败', 'error') }
}

// 跳转任务
function goTask(taskId: string) {
  router.push(`/tasks/${taskId}`)
}

// 工具函数
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  if (d === 1) return '昨天'
  return `${d}天前`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDeadline(dateStr?: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function remainingTime(dateStr?: string) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return '已截止'
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h} 小时`
  return `${Math.floor(h / 24)} 天`
}

function categoryLabel(cat: 'exam' | 'feedback' | 'system') {
  return { exam: '考核', feedback: '点评', system: '系统' }[cat]
}
function categoryColor(cat: 'exam' | 'feedback' | 'system') {
  return {
    exam:     { bg: 'rgba(0,122,255,0.1)',   color: '#007AFF' },
    feedback: { bg: 'rgba(255,149,0,0.1)',   color: '#FF9500' },
    system:   { bg: 'rgba(88,86,214,0.1)',   color: '#5856D6' },
  }[cat]
}
function isUrgent(n: any) {
  return (n.type ?? n.notification_type) === 'task_reminder'
}
</script>

<template>
  <!-- ===== PC 三栏布局 ===== -->
  <div v-if="isPC" class="notif-pc">

    <!-- 左：分类侧边栏 -->
    <aside class="cat-sidebar">
      <div class="cat-title">分类</div>
      <button
        class="cat-item" :class="{ active: activeCategory === 'all' }"
        @click="activeCategory = 'all'"
      >
        <AppIcon name="bell" :size="16" />
        <span>全部</span>
        <span class="cat-badge">{{ counts.all }}</span>
      </button>
      <button
        class="cat-item" :class="{ active: activeCategory === 'exam' }"
        @click="activeCategory = 'exam'"
      >
        <AppIcon name="clipboard" :size="16" />
        <span>考核任务</span>
        <span class="cat-badge">{{ counts.exam }}</span>
      </button>
      <button
        class="cat-item" :class="{ active: activeCategory === 'feedback' }"
        @click="activeCategory = 'feedback'"
      >
        <AppIcon name="chat" :size="16" />
        <span>点评反馈</span>
        <span class="cat-badge">{{ counts.feedback }}</span>
      </button>
      <button
        class="cat-item" :class="{ active: activeCategory === 'system' }"
        @click="activeCategory = 'system'"
      >
        <AppIcon name="gear" :size="16" />
        <span>系统</span>
        <span class="cat-badge">{{ counts.system }}</span>
      </button>

      <div style="flex:1" />
      <button v-if="unreadCount > 0" class="mark-all-link" @click="markAll">全标为已读</button>
    </aside>

    <!-- 中：消息列表 -->
    <div class="notif-list-col">
      <div class="list-header">
        <span class="list-title">
          {{ { all:'全部通知', exam:'考核任务', feedback:'点评反馈', system:'系统通知' }[activeCategory] }}
        </span>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}未读</span>
        <div style="flex:1" />
        <AppIcon name="filter" :size="15" class="filter-icon" />
      </div>

      <div v-if="loading" class="list-empty"><div class="spinner" /></div>
      <div v-else-if="filtered.length === 0" class="list-empty">
        <AppIcon name="bell-off" :size="32" style="color:var(--text-tertiary)" />
        <span>暂无通知</span>
      </div>
      <div v-else class="list-scroll">
        <div
          v-for="n in filtered"
          :key="n.id"
          class="notif-row"
          :class="{ active: n.id === selectedId, unread: !n.is_read }"
          @click="selectNotif(n)"
        >
          <div v-if="!n.is_read" class="unread-dot" />
          <div class="notif-row-body">
            <div class="notif-row-top">
              <span
                class="cat-tag"
                :style="{ background: categoryColor(getCategory(n)).bg, color: categoryColor(getCategory(n)).color }"
              >{{ categoryLabel(getCategory(n)) }}</span>
              <span v-if="isUrgent(n)" class="urgent-tag">紧急</span>
            </div>
            <div class="notif-row-title">{{ n.title }}</div>
            <div class="notif-row-time">{{ timeAgo(n.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右：详情面板 -->
    <div class="notif-detail-col">
      <div v-if="!selected" class="detail-empty">
        <AppIcon name="bell" :size="40" style="color:var(--text-tertiary)" />
        <span>选择一条通知查看详情</span>
      </div>

      <div v-else class="detail-body">
        <!-- 标签行 -->
        <div class="detail-tags">
          <span
            class="cat-tag"
            :style="{ background: categoryColor(getCategory(selected)).bg, color: categoryColor(getCategory(selected)).color }"
          >{{ categoryLabel(getCategory(selected)) }}</span>
          <span v-if="isUrgent(selected)" class="urgent-tag">紧急</span>
        </div>

        <!-- 时间来源 -->
        <div class="detail-meta">{{ formatDate(selected.created_at) }} · 来自系统</div>

        <!-- 标题 -->
        <h2 class="detail-title">{{ selected.title }}</h2>

        <!-- 正文 -->
        <p class="detail-body-text">{{ selected.body ?? selected.content }}</p>

        <!-- 任务详情卡（有关联任务时显示） -->
        <div v-if="selected.task_id" class="task-detail-card">
          <div v-if="taskLoading" style="display:flex;justify-content:center;padding:16px">
            <div class="spinner" />
          </div>
          <template v-else-if="selectedTask">
            <div class="task-detail-grid">
              <div class="task-stat">
                <div class="task-stat-label">合格分</div>
                <div class="task-stat-value">{{ selectedTask.config?.pass_score ?? selectedTask.pass_score ?? '—' }} 分</div>
              </div>
              <div class="task-stat">
                <div class="task-stat-label">截止时间</div>
                <div class="task-stat-value">{{ formatDeadline(selectedTask.end_at) }}</div>
              </div>
              <div class="task-stat">
                <div class="task-stat-label">剩余时间</div>
                <div class="task-stat-value" :style="{ color: remainingTime(selectedTask.end_at) === '已截止' ? 'var(--color-danger)' : 'var(--color-warning)' }">
                  {{ remainingTime(selectedTask.end_at) ?? '—' }}
                </div>
              </div>
              <div class="task-stat">
                <div class="task-stat-label">任务类型</div>
                <div class="task-stat-value">
                  {{ (selectedTask.type ?? selectedTask.task_type) === 'qa' ? '知识问答' : '模拟对练' }}
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <button
            v-if="selected.task_id"
            class="btn-primary"
            style="height:40px;font-size:14px"
            @click="goTask(selected.task_id)"
          >前往任务</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== 移动端布局 ===== -->
  <div v-else class="page-container">
    <div class="mobile-notif-header">
      <span class="page-title">消息通知</span>
      <button v-if="notifications.some(n => !n.is_read)" class="mark-all-link" @click="markAll">全部已读</button>
    </div>

    <div v-if="loading" class="list-empty"><div class="spinner" /></div>
    <div v-else-if="notifications.length === 0" class="list-empty">
      <AppIcon name="bell-off" :size="40" style="color:var(--text-tertiary)" />
      <span>暂无通知</span>
    </div>
    <div v-else class="mobile-list">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="mobile-notif-item"
        :class="{ unread: !n.is_read }"
        @click="selectNotif(n); n.task_id && goTask(n.task_id)"
      >
        <!-- 图标 + 未读红点 -->
        <div class="mobile-notif-icon-wrap">
          <div
            class="mobile-notif-icon"
            :style="{ background: categoryColor(getCategory(n)).bg, color: categoryColor(getCategory(n)).color }"
          >
            <AppIcon :name="getCategory(n) === 'exam' ? 'clipboard' : getCategory(n) === 'feedback' ? 'chat' : 'gear'" :size="18" />
          </div>
          <span v-if="!n.is_read" class="notif-red-dot" />
        </div>
        <div class="mobile-notif-body">
          <div class="mobile-notif-title">{{ n.title }}</div>
          <div class="mobile-notif-desc">{{ n.body ?? n.content }}</div>
          <div class="mobile-notif-time">{{ timeAgo(n.created_at) }}</div>
        </div>
        <span v-if="n.task_id" class="notif-chevron">›</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===================== PC 三栏 ===================== */
.notif-pc {
  display: flex;
  height: calc(100vh - 56px);  /* 减去 topbar 高度 */
  gap: 0;
  overflow: hidden;
}

/* 左：分类侧边栏 */
.cat-sidebar {
  width: 160px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 0 16px;
  border-right: 1px solid var(--separator);
  background: var(--bg-primary);
}

.cat-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 8px 16px 10px;
}

.cat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 0;
  transition: background 120ms, color 120ms;
  cursor: pointer;
  text-align: left;
}
.cat-item:hover { background: var(--bg-grouped); color: var(--text-primary); }
.cat-item.active {
  background: rgba(0,122,255,0.08);
  color: var(--color-primary);
  border-right: 3px solid var(--color-primary);
  font-weight: 600;
}

.cat-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  min-width: 18px;
  text-align: right;
}
.cat-item.active .cat-badge { color: var(--color-primary); }

.mark-all-link {
  margin: 8px 16px 0;
  font-size: 12px;
  color: var(--color-primary);
  cursor: pointer;
  text-align: center;
  padding: 6px 0;
  border-radius: 6px;
  transition: background 120ms;
}
.mark-all-link:hover { background: rgba(0,122,255,0.06); }

/* 中：消息列表 */
.notif-list-col {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--separator);
  background: var(--bg-primary);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--separator);
  flex-shrink: 0;
}
.list-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.unread-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(0,122,255,0.1);
  padding: 2px 7px;
  border-radius: 20px;
}
.filter-icon {
  color: var(--text-tertiary);
  cursor: pointer;
}
.filter-icon:hover { color: var(--text-primary); }

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  color: var(--text-tertiary);
  font-size: 13px;
}

.list-scroll {
  flex: 1;
  overflow-y: auto;
}

.notif-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--separator);
  transition: background 120ms;
  position: relative;
}
.notif-row:hover { background: var(--bg-grouped); }
.notif-row.active { background: rgba(0,122,255,0.06); }
.notif-row.unread { background: rgba(0,122,255,0.02); }

.unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
  margin-top: 5px;
}
.notif-row:not(.unread) .unread-dot { background: transparent; }

.notif-row-body { flex: 1; min-width: 0; }
.notif-row-top { display: flex; gap: 5px; align-items: center; margin-bottom: 4px; }
.notif-row-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.notif-row.unread .notif-row-title { font-weight: 600; }
.notif-row-time {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* Tags */
.cat-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}
.urgent-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(255,59,48,0.1);
  color: var(--color-danger);
}

/* 右：详情面板 */
.notif-detail-col {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  background: var(--bg-secondary, #F2F2F7);
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.detail-body { max-width: 640px; }

.detail-tags { display: flex; gap: 6px; margin-bottom: 10px; }
.detail-meta { font-size: 12px; color: var(--text-tertiary); margin-bottom: 12px; }
.detail-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.35;
  margin-bottom: 14px;
  letter-spacing: -0.3px;
}
.detail-body-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: 24px;
}

/* 任务详情卡 */
.task-detail-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid var(--separator);
}
.task-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.task-stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
  font-weight: 500;
}
.task-stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.detail-actions {
  display: flex;
  gap: 10px;
}

/* ===================== 移动端 ===================== */
.mobile-notif-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px;
  background: white;
}
.mobile-notif-header .page-title { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.mobile-notif-header .mark-all-link { font-size: 13px; color: var(--color-primary); padding: 4px 8px; border-radius: 6px; }
.mobile-notif-header .mark-all-link:hover { background: rgba(0,122,255,0.06); }

.mobile-list {
  display: flex; flex-direction: column;
  padding: 8px 16px 16px; gap: 8px;
}
.mobile-notif-item {
  display: flex; align-items: center; gap: 12px;
  background: white; border-radius: 14px;
  padding: 14px 14px; box-shadow: var(--shadow-1); cursor: pointer;
  transition: transform 100ms;
}
.mobile-notif-item:active { transform: scale(0.98); }
.mobile-notif-item.unread { background: rgba(0,122,255,0.02); }

/* 图标容器（相对定位以放红点） */
.mobile-notif-icon-wrap { position: relative; flex-shrink: 0; }
.mobile-notif-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.notif-red-dot {
  position: absolute; top: -3px; right: -3px;
  width: 9px; height: 9px; border-radius: 50%;
  background: #FF3B30; border: 1.5px solid white;
}

.mobile-notif-body { flex: 1; min-width: 0; }
.mobile-notif-title {
  font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px;
}
.mobile-notif-item.unread .mobile-notif-title { font-weight: 700; }
.mobile-notif-desc {
  font-size: 12px; color: var(--text-secondary); line-height: 1.5;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mobile-notif-time { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; }
.notif-chevron { font-size: 18px; color: var(--text-tertiary); flex-shrink: 0; }
</style>
