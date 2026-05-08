<!-- ## 平台仪表盘（超管）：全平台用户数统计概览 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usersApi } from '@/api'

const stats = ref({ tenants: 0, totalUsers: 0, activeAdmins: 0, expiringSoon: 0 })
const recentAdmins = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [allUsersRes, adminsRes] = await Promise.all([
      usersApi.list({ page: 1, page_size: 1 }),
      usersApi.list({ page: 1, page_size: 10, role: 'admin' }),
    ])
    stats.value.totalUsers = allUsersRes.total
    stats.value.tenants = adminsRes.total
    stats.value.activeAdmins = adminsRes.items.filter((u: any) => u.is_active).length
    recentAdmins.value = adminsRes.items
  } catch {}
  loading.value = false
})

const cards = [
  { label: '总企业数', key: 'tenants', sub: '已开通', color: 'var(--color-purple)' },
  { label: '平台学员数', key: 'totalUsers', sub: '全平台累计', color: 'var(--color-primary)' },
  { label: '正常运营', key: 'activeAdmins', sub: '企业', color: 'var(--color-success)' },
  { label: '即将到期', key: 'expiringSoon', sub: '30天内', color: 'var(--color-warning)' },
]
</script>

<template>
  <div class="page">
    <!-- Stat cards -->
    <div class="stat-grid">
      <div class="stat-card" v-for="c in cards" :key="c.key">
        <div class="stat-label">{{ c.label }}</div>
        <div class="stat-val" :style="{ color: c.color }">
          {{ loading ? '—' : stats[c.key as keyof typeof stats] }}
        </div>
        <div class="stat-sub">{{ c.sub }}</div>
      </div>
    </div>

    <!-- Recent tenants -->
    <div class="section-card">
      <div class="section-head">
        <span class="section-title">近期企业账号</span>
        <router-link to="/sa/tenants" class="see-all">管理全部 →</router-link>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>企业</th>
            <th>账号</th>
            <th>状态</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4" class="empty">加载中...</td></tr>
          <tr v-else-if="recentAdmins.length === 0"><td colspan="4" class="empty">暂无企业账号</td></tr>
          <tr v-for="u in recentAdmins" :key="u.id">
            <td>
              <div class="tenant-cell">
                <div class="t-avatar">{{ (u.display_name || u.username).charAt(0) }}</div>
                <span class="fw">{{ u.display_name || u.username }}</span>
              </div>
            </td>
            <td class="muted">{{ u.username }}</td>
            <td><span :class="u.is_active ? 'badge-on' : 'badge-off'">{{ u.is_active ? '● 正常' : '● 已停用' }}</span></td>
            <td class="muted">{{ u.created_at?.slice(0, 10) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Notice -->
    <div class="notice">
      <span class="notice-icon">i</span>
      <div>
        <div class="notice-title">当前运行模式：Standalone（单机本地部署）</div>
        <div class="notice-body">如需多租户 SaaS 模式，请修改 .env 中 <code>DEPLOYMENT_MODE=saas</code> 并配置数据库隔离策略。</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card { background: white; border-radius: 10px; padding: 16px; box-shadow: var(--shadow-1); border: 1px solid var(--border); }
.stat-label { font-size: 12px; color: var(--text-secondary); }
.stat-val { font-size: 28px; font-weight: 700; line-height: 1.2; margin: 4px 0; }
.stat-sub { font-size: 11px; color: var(--text-tertiary); }

.section-card { background: white; border-radius: 10px; box-shadow: var(--shadow-1); border: 1px solid var(--border); overflow: hidden; }
.section-head { padding: 14px 16px; border-bottom: 1px solid var(--separator); display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.see-all { font-size: 12px; color: #AF52DE; text-decoration: none; font-weight: 500; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid var(--separator); background: #FAFAFA; }
.data-table td { padding: 11px 12px; font-size: 13px; border-top: 1px solid var(--separator); }
.data-table tr:hover td { background: var(--bg-grouped); }
.empty { text-align: center; color: var(--text-tertiary); padding: 32px !important; border-top: none !important; }
.tenant-cell { display: flex; align-items: center; gap: 8px; }
.t-avatar { width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(135deg,#AF52DE,#FF2D92); color: white; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fw { font-weight: 600; }
.muted { color: var(--text-secondary); font-size: 12px; }
.badge-on { font-size: 12px; font-weight: 600; color: var(--color-success); }
.badge-off { font-size: 12px; font-weight: 600; color: var(--text-tertiary); }

.notice { background: rgba(175,82,222,0.06); border: 1px solid rgba(175,82,222,0.15); border-radius: 10px; padding: 14px 18px; display: flex; gap: 12px; align-items: flex-start; }
.notice-icon { font-size: 18px; flex-shrink: 0; }
.notice-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.notice-body { font-size: 12px; color: var(--text-secondary); margin-top: 3px; line-height: 1.5; }
code { font-family: monospace; background: rgba(175,82,222,0.1); padding: 1px 5px; border-radius: 3px; color: #AF52DE; font-size: 11px; }
</style>
