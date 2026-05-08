<!-- ## 审计日志（超管）：查看所有用户操作记录 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { systemConfigApi } from '@/api'

const logs = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const pageSize = 30

async function load() {
  loading.value = true
  try {
    const res = await systemConfigApi.getAuditLogs({ page: page.value, page_size: pageSize })
    logs.value = res.items || res
    total.value = res.total || logs.value.length
  } catch {
    // Audit logs endpoint may not exist yet — show placeholder
    logs.value = []
  }
  loading.value = false
}

onMounted(load)

function actionLabel(action: string) {
  const map: Record<string, string> = { login: '登录', logout: '退出', create: '创建', update: '更新', delete: '删除', publish: '发布' }
  return map[action] || action
}
function actionClass(action: string) {
  if (['delete', 'logout'].includes(action)) return 'danger'
  if (['create', 'publish'].includes(action)) return 'success'
  return 'info'
}

const totalPages = () => Math.ceil(total.value / pageSize)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>审计日志</h2>
        <span class="sub">记录所有管理员操作行为，用于安全审计</span>
      </div>
      <button class="btn-ghost" @click="load">↻ 刷新</button>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作者</th>
            <th>操作类型</th>
            <th>对象</th>
            <th>详情</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="empty">加载中...</td></tr>
          <tr v-else-if="logs.length === 0">
            <td colspan="6" class="empty">
              <div class="empty-icon">—</div>
              <div>暂无审计日志</div>
              <div class="empty-hint">用户登录、数据变更等操作将自动记录在此</div>
            </td>
          </tr>
          <tr v-for="log in logs" :key="log.id">
            <td class="mono">{{ log.created_at?.slice(0, 16).replace('T', ' ') }}</td>
            <td>
              <div class="user-cell">
                <div class="mini-avatar">{{ (log.user?.username || '?').charAt(0) }}</div>
                {{ log.user?.username || `#${log.user_id}` }}
              </div>
            </td>
            <td><span class="action-badge" :class="actionClass(log.action)">{{ actionLabel(log.action) }}</span></td>
            <td class="muted">{{ log.resource_type }} #{{ log.resource_id }}</td>
            <td class="muted detail">{{ log.detail || '—' }}</td>
            <td class="mono muted">{{ log.ip_address || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <div class="pagination" v-if="total > pageSize">
        <button class="pg-btn" :disabled="page === 1" @click="page--; load()">‹</button>
        <span class="pg-info">{{ page }} / {{ totalPages() }}</span>
        <button class="pg-btn" :disabled="page >= totalPages()" @click="page++; load()">›</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.sub { font-size: 12px; color: var(--text-tertiary); display: block; margin-top: 2px; }

.table-card { background: white; border-radius: 10px; box-shadow: var(--shadow-1); border: 1px solid var(--border); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid var(--separator); background: #FAFAFA; }
.data-table td { padding: 11px 14px; font-size: 12px; border-bottom: 1px solid var(--separator); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-grouped); }
.empty { text-align: center; color: var(--text-tertiary); padding: 50px !important; }
.empty-icon { font-size: 32px; margin-bottom: 8px; }
.empty-hint { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; }
.mono { font-family: 'SF Mono', 'Menlo', monospace; font-size: 11px; }
.muted { color: var(--text-secondary); }
.detail { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-cell { display: flex; align-items: center; gap: 7px; }
.mini-avatar { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg,#AF52DE,#FF2D92); color: white; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.action-badge { padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.action-badge.success { background: rgba(52,199,89,0.1); color: var(--color-success); }
.action-badge.danger { background: rgba(255,59,48,0.1); color: var(--color-danger); }
.action-badge.info { background: rgba(0,102,204,0.08); color: var(--color-primary); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px; border-top: 1px solid var(--separator); }
.pg-btn { padding: 4px 10px; border-radius: 6px; font-size: 13px; background: var(--bg-grouped); border: 1px solid var(--border); cursor: pointer; }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 12px; color: var(--text-secondary); }
.btn-ghost { height: 32px; padding: 0 14px; border-radius: 8px; background: var(--bg-grouped); border: 1px solid var(--border); font-size: 13px; cursor: pointer; }
</style>
