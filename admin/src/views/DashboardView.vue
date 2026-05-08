<!-- ## 仪表盘：汇总用户数、任务数、通知数等关键指标 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminIcon from '@/components/AdminIcon.vue'
import { usersApi, tasksApi, notificationsApi } from '@/api'

const stats = ref({ users: 0, activeTasks: 0, completions: 0, notifications: 0 })
const recentTasks = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [usersRes, tasksRes, notifRes] = await Promise.all([
      usersApi.list({ page: 1, page_size: 1 }),
      tasksApi.list({ page: 1, page_size: 5 }),
      notificationsApi.unreadCount(),
    ])
    stats.value.users = usersRes.total
    stats.value.activeTasks = tasksRes.total
    stats.value.notifications = notifRes.count
    recentTasks.value = tasksRes.items
    // estimate completions from tasks
    stats.value.completions = tasksRes.items.filter((t: any) => t.status === 'published').length
  } catch {}
  loading.value = false
})

const statCards = [
  { label: '注册用户', key: 'users', icon: 'users', color: '#0066CC', bg: 'rgba(0,102,204,0.08)', sub: '全部注册用户' },
  { label: '进行中任务', key: 'activeTasks', icon: 'tasks', color: '#34C759', bg: 'rgba(52,199,89,0.08)', sub: '当前活跃任务' },
  { label: '已完成', key: 'completions', icon: 'check', color: '#FF9500', bg: 'rgba(255,149,0,0.08)', sub: '本月已发布任务' },
  { label: '未读通知', key: 'notifications', icon: 'notifications', color: '#FF3B30', bg: 'rgba(255,59,48,0.08)', sub: '待处理通知' },
]

function statusLabel(s: string) {
  return { draft: '草稿', published: '已发布', archived: '已归档' }[s] || s
}
function statusClass(s: string) {
  return { draft: 'draft', published: 'published', archived: 'archived' }[s] || ''
}
function typeLabel(t: string) {
  return { qa: '知识问答', roleplay: '模拟对练' }[t] || t
}
function completionRate(t: any): number {
  return Math.round((t.completion_count || 0) / (t.assigned_count || 1) * 100)
}

// 7-day trend chart data
const trendData = [12, 18, 24, 16, 28, 34, 22]
const trendLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function chartPoints(): string {
  const W = 280, H = 140
  const padL = 16, padR = 16, padT = 16, padB = 28
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const max = Math.max(...trendData)
  return trendData.map((v, i) => {
    const x = padL + (i / (trendData.length - 1)) * chartW
    const y = padT + chartH - (v / max) * chartH
    return `${x},${y}`
  }).join(' ')
}

function chartAreaPath(): string {
  const W = 280, H = 140
  const padL = 16, padR = 16, padT = 16, padB = 28
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const max = Math.max(...trendData)
  const pts = trendData.map((v, i) => {
    const x = padL + (i / (trendData.length - 1)) * chartW
    const y = padT + chartH - (v / max) * chartH
    return `${x},${y}`
  })
  const bottom = padT + chartH
  return `M${pts[0]} L${pts.join(' L')} L${padL + chartW},${bottom} L${padL},${bottom} Z`
}

function chartDots(): Array<{ x: number; y: number }> {
  const W = 280, H = 140
  const padL = 16, padR = 16, padT = 16, padB = 28
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const max = Math.max(...trendData)
  return trendData.map((v, i) => ({
    x: padL + (i / (trendData.length - 1)) * chartW,
    y: padT + chartH - (v / max) * chartH,
  }))
}

function chartGridLines(): number[] {
  const padT = 16, padB = 28
  const chartH = 140 - padT - padB
  return [0, 1, 2, 3].map(i => padT + (i / 3) * chartH)
}

function labelX(i: number): number {
  const padL = 16, padR = 16
  return padL + (i / (trendData.length - 1)) * (280 - padL - padR)
}
const labelY = 140 - 6
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>仪表盘</h2>
      <span class="page-sub">欢迎回来，数据实时更新</span>
    </div>

    <div class="stat-grid" v-if="!loading">
      <div class="stat-card" v-for="c in statCards" :key="c.key">
        <div class="stat-card-top">
          <span class="stat-label">{{ c.label }}</span>
          <div class="stat-icon" :style="{ background: c.bg, color: c.color }"><AdminIcon :name="c.icon" /></div>
        </div>
        <div class="stat-value" :style="{ color: c.color }">{{ stats[c.key as keyof typeof stats] }}</div>
        <div class="stat-sub">{{ c.sub }}</div>
      </div>
    </div>
    <div class="stat-grid" v-else>
      <div class="stat-card skeleton" v-for="i in 4" :key="i">
        <div class="stat-card-top">
          <div class="skel-line" style="width:60px" />
          <div class="skel-icon" />
        </div>
        <div class="skel-line big" />
        <div class="skel-line" style="width:80px" />
      </div>
    </div>

    <div class="bottom-panels">
      <!-- Left: recent tasks table -->
      <div class="section-card">
        <div class="section-head">
          <span class="section-title">最近任务状态</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>任务名</th>
              <th>类型</th>
              <th>完成率</th>
              <th>状态</th>
              <th>截止日期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="recentTasks.length === 0">
              <td colspan="5" class="empty-row">暂无任务</td>
            </tr>
            <tr v-for="t in recentTasks" :key="t.id">
              <td class="task-name">{{ t.title }}</td>
              <td><span class="type-badge">{{ typeLabel(t.task_type) }}</span></td>
              <td>
                <div class="completion-cell">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: completionRate(t) + '%' }" />
                  </div>
                  <span class="progress-pct">{{ completionRate(t) }}%</span>
                </div>
              </td>
              <td><span class="status-badge" :class="statusClass(t.status)">{{ statusLabel(t.status) }}</span></td>
              <td class="text-secondary">{{ t.deadline?.slice(0, 10) || t.created_at?.slice(0, 10) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Right: 7-day trend chart -->
      <div class="section-card chart-panel">
        <div class="section-head">
          <span class="section-title">近 7 日完成趋势</span>
        </div>
        <div class="chart-wrap">
          <svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.2" />
                <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <!-- Grid lines -->
            <line
              v-for="y in chartGridLines()"
              :key="y"
              :x1="16" :y1="y" :x2="264" :y2="y"
              stroke="var(--separator)" stroke-width="1"
            />
            <!-- Area fill -->
            <path :d="chartAreaPath()" fill="url(#areaGrad)" />
            <!-- Line -->
            <polyline
              :points="chartPoints()"
              fill="none"
              stroke="var(--color-primary)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- Dots -->
            <circle
              v-for="(pt, i) in chartDots()"
              :key="i"
              :cx="pt.x" :cy="pt.y"
              r="3"
              fill="white"
              stroke="var(--color-primary)"
              stroke-width="2"
            />
            <!-- Labels -->
            <text
              v-for="(lbl, i) in trendLabels"
              :key="lbl"
              :x="labelX(i)"
              :y="labelY"
              text-anchor="middle"
              font-size="9"
              fill="var(--text-tertiary)"
            >{{ lbl }}</text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 28px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; height: 100%; }
.page-header { display: flex; align-items: baseline; gap: 12px; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-sub { font-size: 13px; color: var(--text-tertiary); }

/* Stat cards */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card {
  background: white; border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 8px;
  box-shadow: var(--shadow-1); border: 1px solid var(--border);
}
.stat-card-top {
  display: flex; align-items: center; justify-content: space-between;
}
.stat-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
.stat-icon {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 14px;
}
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.1; }
.stat-sub { font-size: 11px; color: var(--text-secondary); }

/* Skeleton */
.skeleton { pointer-events: none; }
.skel-icon { width: 28px; height: 28px; border-radius: 7px; background: var(--bg-grouped); flex-shrink: 0; }
.skel-line { height: 12px; border-radius: 4px; background: var(--bg-grouped); animation: pulse 1.4s ease-in-out infinite; }
.skel-line.big { height: 28px; width: 50%; margin: 4px 0; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* Bottom dual panel */
.bottom-panels {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}

.section-card {
  background: white; border-radius: 12px; box-shadow: var(--shadow-1); border: 1px solid var(--border); overflow: hidden;
}
.section-head { padding: 16px 20px; border-bottom: 1px solid var(--separator); display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }

/* Table */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 10px 20px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--separator); }
.data-table td { padding: 12px 20px; font-size: 13px; border-bottom: 1px solid var(--separator); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-grouped); }
.task-name { font-weight: 500; color: var(--text-primary); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-secondary { color: var(--text-secondary); }
.empty-row { text-align: center; color: var(--text-tertiary); padding: 32px !important; }

/* Completion rate */
.completion-cell { display: flex; align-items: center; gap: 8px; min-width: 100px; }
.progress-bar { flex: 1; height: 4px; background: var(--bg-grouped); border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary); border-radius: 2px; transition: width 0.3s ease; }
.progress-pct { font-size: 11px; color: var(--text-secondary); white-space: nowrap; min-width: 28px; }

/* Type / status badges */
.type-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; background: rgba(0,102,204,0.08); color: var(--color-primary); }
.status-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.status-badge.draft { background: rgba(142,142,147,0.12); color: var(--text-secondary); }
.status-badge.published { background: rgba(52,199,89,0.12); color: var(--color-success); }
.status-badge.archived { background: rgba(255,149,0,0.12); color: var(--color-warning); }

/* Chart panel */
.chart-panel {}
.chart-wrap { padding: 16px 20px 12px; }
.chart-wrap svg { width: 100%; height: auto; display: block; }
</style>
