<!-- ## 企业账号管理（超管）：管理企业管理员账号，创建/停用 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usersApi } from '@/api'
import type { User } from '@/api/types'
import Modal from '@/components/Modal.vue'
import { showToast } from '@/composables/toast'

const tenants = ref<User[]>([])
const allUsers = ref<any>({ total: 0 })
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const search = ref('')

const showModal = ref(false)
const saving = ref(false)
const form = ref({ username: '', display_name: '', phone: '', password: '' })

async function load() {
  loading.value = true
  try {
    const [adminRes, userRes] = await Promise.all([
      usersApi.list({ page: page.value, page_size: pageSize, role: 'admin', search: search.value || undefined }),
      usersApi.list({ page: 1, page_size: 1 }),
    ])
    tenants.value = adminRes.items
    total.value = adminRes.total
    allUsers.value = userRes
  } catch { showToast('加载失败', 'error') }
  loading.value = false
}

onMounted(load)

async function create() {
  if (!form.value.username || !form.value.password) { showToast('请填写账号和密码', 'error'); return }
  saving.value = true
  try {
    const payload: Record<string, any> = { role: 'admin' }
    for (const [k, v] of Object.entries(form.value)) {
      if (v !== '') payload[k] = v
    }
    await usersApi.create(payload)
    showToast('企业账号创建成功', 'success')
    showModal.value = false
    load()
  } catch (e: any) { showToast(e?.detail || e?.message || '创建失败', 'error') }
  saving.value = false
}

async function toggleActive(u: User) {
  try {
    await usersApi.update(u.id, { is_active: !u.is_active })
    u.is_active = !u.is_active
    showToast(u.is_active ? '已启用' : '已禁用', 'success')
  } catch { showToast('操作失败', 'error') }
}

function tenantStatus(u: User): 'active' | 'inactive' {
  return u.is_active ? 'active' : 'inactive'
}

const statCards = computed(() => [
  { label: '总企业数', value: total.value, sub: '已开通', color: 'var(--color-purple)' },
  { label: '总用户数', value: allUsers.value.total, sub: '全平台', color: 'var(--color-primary)' },
  { label: '正常运营', value: tenants.value.filter(t => t.is_active).length, sub: '企业', color: 'var(--color-success)' },
  { label: '已停用', value: tenants.value.filter(t => !t.is_active).length, sub: '企业', color: 'var(--color-warning)' },
])

const totalPages = () => Math.ceil(total.value / pageSize)
</script>

<template>
  <div class="page">
    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-val" :style="{ color: s.color }">{{ loading ? '—' : s.value }}</div>
        <div class="stat-sub">{{ s.sub }}</div>
      </div>
    </div>

    <!-- Header -->
    <div class="table-header">
      <div class="header-left">
        <h3>企业账号列表</h3>
        <span class="count-badge">共 {{ total }} 家</span>
      </div>
      <div class="header-right">
        <input v-model="search" class="search-input" placeholder="搜索企业名称或账号" @keyup.enter="load" />
        <button class="btn-primary" @click="showModal = true; form = { username: '', display_name: '', phone: '', password: '' }">
          + 创建企业
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>企业</th>
            <th>账号</th>
            <th>手机号</th>
            <th>状态</th>
            <th>创建时间</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="empty">加载中...</td></tr>
          <tr v-else-if="tenants.length === 0"><td colspan="6" class="empty">暂无企业账号，点击「创建企业」开始</td></tr>
          <tr v-for="t in tenants" :key="t.id">
            <td>
              <div class="tenant-cell">
                <div class="tenant-avatar">{{ (t.display_name || t.username).charAt(0) }}</div>
                <span class="tenant-name">{{ t.display_name || t.username }}</span>
              </div>
            </td>
            <td class="muted-sm">{{ t.username }}</td>
            <td class="muted-sm">{{ t.phone || '—' }}</td>
            <td>
              <span class="status-pill" :class="tenantStatus(t)">
                {{ t.is_active ? '● 正常' : '● 已停用' }}
              </span>
            </td>
            <td class="muted-sm">{{ t.created_at?.slice(0, 10) }}</td>
            <td>
              <div class="row-actions">
                <button class="act-btn" @click="toggleActive(t)">
                  {{ t.is_active ? '停用' : '启用' }}
                </button>
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

    <!-- Create Modal -->
    <Modal v-if="showModal" title="创建企业账号" :width="480" @close="showModal = false">
      <div class="form-grid">
        <div class="field">
          <label>企业名称（显示名）</label>
          <input v-model="form.display_name" placeholder="如：某某科技有限公司" />
        </div>
        <div class="field">
          <label>登录账号 <span class="req">*</span></label>
          <input v-model="form.username" placeholder="唯一标识，建议用企业英文缩写" />
        </div>
        <div class="field">
          <label>联系手机</label>
          <input v-model="form.phone" placeholder="可选" />
        </div>
        <div class="field">
          <label>初始密码 <span class="req">*</span></label>
          <input v-model="form.password" type="password" placeholder="至少 6 位" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showModal = false">取消</button>
        <button class="btn-primary" :disabled="saving" @click="create">{{ saving ? '创建中...' : '确认创建' }}</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card {
  background: white; border-radius: 10px; padding: 16px;
  box-shadow: var(--shadow-1); border: 1px solid var(--border);
}
.stat-label { font-size: 12px; color: var(--text-secondary); }
.stat-val { font-size: 28px; font-weight: 700; line-height: 1.2; margin: 4px 0; }
.stat-sub { font-size: 11px; color: var(--text-tertiary); }

.table-header { display: flex; align-items: center; justify-content: space-between; }
.header-left { display: flex; align-items: center; gap: 10px; }
.header-left h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
.count-badge { font-size: 12px; color: var(--text-tertiary); }
.header-right { display: flex; gap: 10px; align-items: center; }
.search-input { height: 34px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border-strong); background: white; font-size: 13px; width: 200px; }

.table-card { background: white; border-radius: 10px; box-shadow: var(--shadow-1); border: 1px solid var(--border); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid var(--separator); background: #FAFAFA; }
.data-table td { padding: 12px 12px; font-size: 13px; border-top: 1px solid var(--separator); }
.data-table tr:hover td { background: var(--bg-grouped); }
.empty { text-align: center; color: var(--text-tertiary); padding: 40px !important; border-top: none !important; }

.tenant-cell { display: flex; align-items: center; gap: 10px; }
.tenant-avatar {
  width: 32px; height: 32px; border-radius: 7px;
  background: linear-gradient(135deg, #AF52DE, #FF2D92);
  color: white; font-weight: 600; font-size: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tenant-name { font-weight: 600; color: var(--text-primary); }
.muted-sm { font-size: 12px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }

.status-pill { font-size: 12px; font-weight: 600; }
.status-pill.active { color: var(--color-success); }
.status-pill.inactive { color: var(--text-tertiary); }

.row-actions { display: flex; gap: 6px; }
.act-btn { padding: 4px 10px; border-radius: 6px; font-size: 12px; background: var(--bg-grouped); color: var(--text-primary); cursor: pointer; border: 1px solid var(--border); transition: all 120ms; }
.act-btn:hover { background: rgba(175,82,222,0.08); color: #AF52DE; border-color: #AF52DE; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; border-top: 1px solid var(--separator); }
.pg-btn { padding: 4px 12px; border-radius: 7px; font-size: 13px; background: var(--bg-grouped); border: 1px solid var(--border); cursor: pointer; }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 12px; color: var(--text-secondary); }

.form-grid { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.req { color: var(--color-danger); }
input { height: 36px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); }
input:focus { border-color: #AF52DE; box-shadow: 0 0 0 3px rgba(175,82,222,0.1); outline: none; }
.btn-primary { height: 34px; padding: 0 18px; border-radius: 8px; background: #AF52DE; color: white; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #9B46C8; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); border: 1px solid var(--border); font-size: 13px; cursor: pointer; }
</style>
