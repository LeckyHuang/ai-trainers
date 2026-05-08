<!-- ## 任务列表：展示所有任务，按状态/类型筛选，点击进入任务详情 -->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AdminIcon from '@/components/AdminIcon.vue'
import { tasksApi } from '@/api'
import type { Task } from '@/api/types'
import { showToast } from '@/composables/toast'

const router = useRouter()
const tasks = ref<Task[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 15
const loading = ref(true)   // start true → 避免挂载瞬间闪"暂无任务"
const activeTab = ref<'all' | 'qa' | 'roleplay'>('all')

// All tasks for stat cards (load all without type filter)
const allTasksForStats = ref<Task[]>([])

async function loadStats() {
  try {
    const res = await tasksApi.list({ page: 1, page_size: 200 })
    allTasksForStats.value = res.items
  } catch { /* ignore */ }
}

async function load() {
  loading.value = true
  try {
    const params: any = { page: page.value, page_size: pageSize }
    if (activeTab.value !== 'all') params.type = activeTab.value
    const res = await tasksApi.list(params)
    tasks.value = res.items || []
    total.value = res.total || 0
  } catch (e: any) {
    showToast(e?.detail || '加载失败', 'error')
  }
  loading.value = false
}

onMounted(async () => {
  await nextTick()   // 等待路由过渡动画挂载完成后再请求
  await load()
  loadStats()
})

function switchTab(t: typeof activeTab.value) {
  activeTab.value = t
  page.value = 1
  load()
}

async function archiveTask(t: Task) {
  if (!confirm(`确认归档「${t.title}」？`)) return
  try {
    await tasksApi.update(t.id, { status: 'archived' })
    showToast('已归档', 'success')
    load()
    loadStats()
  } catch { showToast('操作失败', 'error') }
}

function typeLabel(t: string) { return { qa: '知识问答', roleplay: '模拟对练' }[t] || t }
function statusLabel(s: string) { return { draft: '草稿', active: '已发布', published: '已发布', archived: '已归档' }[s] || s }
function statusClass(s: string) { return { draft: 'draft', active: 'published', published: 'published', archived: 'archived' }[s] || '' }

const totalPages = () => Math.ceil(total.value / pageSize)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'qa', label: '知识问答' },
  { key: 'roleplay', label: '模拟对练' },
]

// Stat card computations
const statTotal = computed(() => allTasksForStats.value.length || total.value)
const statActive = computed(() => allTasksForStats.value.filter((t: Task) => (t as any).status === 'active' || (t as any).status === 'published').length)
const statCompletionRate = computed(() => {
  const ts = allTasksForStats.value
  if (!ts.length) return 0
  const withAssigned = ts.filter((t: Task) => (t as any).assigned_count && (t as any).assigned_count > 0)
  if (!withAssigned.length) return 0
  // Use assigned_count and completed_count if available, else fallback
  const total = withAssigned.reduce((s: number, t: Task) => s + ((t as any).assigned_count || 0), 0)
  const done = withAssigned.reduce((s: number, t: Task) => s + ((t as any).completed_count || 0), 0)
  return total ? Math.round(done / total * 100) : 0
})
const statUrgent = computed(() => {
  const now = new Date()
  return allTasksForStats.value.filter((t: Task) => {
    if (t.status === 'archived') return false
    if (!(t as any).end_at) return false
    return new Date((t as any).end_at) < now
  }).length
})

// Progress for each task row
function taskProgress(t: Task): number {
  const assigned = (t as any).assigned_count || 0
  const completed = (t as any).completed_count || 0
  if (!assigned) return 0
  return Math.round(completed / assigned * 100)
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h2>任务管理</h2>
        <span class="page-sub">共 {{ total }} 个任务</span>
      </div>
      <button class="btn-primary" @click="router.push('/tasks/create')">+ 创建任务</button>
    </div>

    <!-- Stat cards -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue"><AdminIcon name="task" /></div>
        <div class="stat-body">
          <div class="stat-val">{{ statTotal }}</div>
          <div class="stat-label">任务总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green"><AdminIcon name="check" /></div>
        <div class="stat-body">
          <div class="stat-val">{{ statActive }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-purple"><AdminIcon name="chart" /></div>
        <div class="stat-body">
          <div class="stat-val">{{ statCompletionRate }}%</div>
          <div class="stat-label">整体完成率</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange"><AdminIcon name="warning" /></div>
        <div class="stat-body">
          <div class="stat-val">{{ statUrgent }}</div>
          <div class="stat-label">已逾期</div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="t in tabs" :key="t.key"
        class="tab-btn"
        :class="{ active: activeTab === t.key }"
        @click="switchTab(t.key as any)"
      >{{ t.label }}</button>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>任务名称</th>
            <th>类型</th>
            <th>状态</th>
            <th>完成进度</th>
            <th>分配人数</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty-row">加载中...</td>
          </tr>
          <tr v-else-if="tasks.length === 0">
            <td colspan="7" class="empty-row">暂无任务</td>
          </tr>
          <tr v-for="t in tasks" :key="t.id">
            <td>
              <div class="task-cell">
                <span class="task-icon"><AdminIcon :name="t.type === 'qa' ? 'qa' : 'roleplay'" /></span>
                <div>
                  <div class="task-name">{{ t.title }}</div>
                  <div class="task-desc">{{ t.description || '暂无描述' }}</div>
                </div>
              </div>
            </td>
            <td><span class="type-badge" :class="t.type">{{ typeLabel(t.type) }}</span></td>
            <td><span class="status-badge" :class="statusClass(t.status)">{{ statusLabel(t.status) }}</span></td>
            <td class="progress-col">
              <div class="row-progress-wrap">
                <div class="row-progress-bar">
                  <div class="row-progress-fill" :style="{ width: taskProgress(t) + '%' }" />
                </div>
                <span class="row-progress-pct">{{ taskProgress(t) }}%</span>
              </div>
            </td>
            <td class="text-secondary">{{ (t as any).assigned_count ?? '—' }}</td>
            <td class="text-secondary">{{ t.created_at?.slice(0, 10) }}</td>
            <td>
              <div class="row-actions">
                <button class="act-btn" @click="router.push(`/tasks/${t.id}`)">详情</button>
                <button class="act-btn" @click="router.push(`/tasks/${t.id}?edit=true`)">编辑</button>
                <button v-if="t.status !== 'archived'" class="act-btn danger" @click="archiveTask(t)">归档</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination" v-if="total > pageSize">
        <button class="pg-btn" :disabled="page === 1" @click="page--; load()">‹ 上一页</button>
        <span class="pg-info">{{ page }} / {{ totalPages() }}</span>
        <button class="pg-btn" :disabled="page >= totalPages()" @click="page++; load()">下一页 ›</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; height: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-sub { font-size: 12px; color: var(--text-tertiary); display: block; margin-top: 2px; }

.tabs { display: flex; gap: 4px; background: var(--bg-grouped); padding: 4px; border-radius: 10px; width: fit-content; }
.tab-btn { padding: 6px 16px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-secondary); transition: all 150ms; }
.tab-btn.active { background: white; color: var(--text-primary); font-weight: 600; box-shadow: var(--shadow-1); }

.table-card { background: white; border-radius: 12px; box-shadow: var(--shadow-1); border: 1px solid var(--border); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--separator); }
.data-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--separator); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-grouped); }
.empty-row { text-align: center; color: var(--text-tertiary); padding: 40px !important; }
.text-secondary { color: var(--text-secondary); }

.task-cell { display: flex; align-items: flex-start; gap: 10px; }
.task-icon { flex-shrink: 0; margin-top: 2px; color: var(--text-tertiary); }
.task-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.task-desc { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.type-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.type-badge.qa { background: rgba(0,102,204,0.08); color: var(--color-primary); }
.type-badge.roleplay { background: rgba(88,86,214,0.08); color: #5856D6; }
.status-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.status-badge.draft { background: rgba(142,142,147,0.12); color: var(--text-secondary); }
.status-badge.published { background: rgba(52,199,89,0.12); color: var(--color-success); }
.status-badge.archived { background: rgba(255,149,0,0.12); color: var(--color-warning); }

.row-actions { display: flex; gap: 6px; }
.act-btn { padding: 4px 10px; border-radius: 6px; font-size: 12px; background: var(--bg-grouped); color: var(--text-primary); cursor: pointer; border: 1px solid var(--border); transition: all 120ms; }
.act-btn:hover { background: var(--bg-selected); color: var(--color-primary); border-color: var(--color-primary); }
.act-btn.danger:hover { background: rgba(255,59,48,0.08); color: var(--color-danger); border-color: var(--color-danger); }

.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px; border-top: 1px solid var(--separator); }
.pg-btn { padding: 5px 14px; border-radius: 7px; font-size: 13px; background: var(--bg-grouped); color: var(--text-primary); cursor: pointer; border: 1px solid var(--border); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 12px; color: var(--text-secondary); }
.btn-primary { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--color-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer; }

/* Stat cards */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card { background: white; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-1); padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; }
.stat-icon-blue { background: rgba(0,102,204,0.1); color: var(--color-primary); }
.stat-icon-green { background: rgba(52,199,89,0.1); color: var(--color-success); }
.stat-icon-purple { background: rgba(88,86,214,0.1); color: #5856D6; }
.stat-icon-orange { background: rgba(255,149,0,0.1); color: var(--color-warning); }
.stat-body { display: flex; flex-direction: column; gap: 2px; }
.stat-val { font-size: 24px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.stat-label { font-size: 12px; color: var(--text-secondary); }

/* Row progress bar */
.progress-col { min-width: 120px; }
.row-progress-wrap { display: flex; align-items: center; gap: 8px; }
.row-progress-bar { flex: 1; height: 4px; background: var(--bg-grouped); border-radius: 2px; overflow: hidden; }
.row-progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-success)); border-radius: 2px; transition: width 400ms ease; }
.row-progress-pct { font-size: 11px; color: var(--text-secondary); font-weight: 500; white-space: nowrap; min-width: 28px; }
</style>
