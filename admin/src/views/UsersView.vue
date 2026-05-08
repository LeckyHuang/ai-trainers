<!-- ## 用户管理：列表 + 创建/编辑/停用，管理员不可见/修改超管账号 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usersApi } from '@/api'
import type { User } from '@/api/types'
import Modal from '@/components/Modal.vue'
import { showToast } from '@/composables/toast'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isSuperadmin = computed(() => auth.user?.role === 'superadmin')

const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 15
const loading = ref(false)
const search = ref('')
const roleFilter = ref<string>('all')

const ROLE_TABS = [
  { key: 'all', label: '全部' },
  { key: 'admin', label: '管理员' },
  { key: 'trainee', label: '学员' },
]

const filteredUsers = computed(() => {
  if (roleFilter.value === 'all') return users.value
  return users.value.filter(u => u.role === roleFilter.value)
})

const showModal = ref(false)
const editing = ref<User | null>(null)
const form = ref({ username: '', display_name: '', phone: '', password: '', role: 'learner' as string })
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await usersApi.list({ page: page.value, page_size: pageSize, keyword: search.value || undefined })
    users.value = res.items || []
    total.value = res.total || 0
  } catch { showToast('加载失败', 'error') }
  loading.value = false
}

onMounted(load)

function openCreate() {
  editing.value = null
  form.value = { username: '', display_name: '', phone: '', password: '', role: 'learner' }
  showModal.value = true
}

function openEdit(u: User) {
  editing.value = u
  form.value = { username: u.username, display_name: u.display_name || '', phone: u.phone || '', password: '', role: u.role }
  showModal.value = true
}

async function save() {
  if (!form.value.username) { showToast('请输入用户名', 'error'); return }
  saving.value = true
  try {
    if (editing.value) {
      const payload: any = { display_name: form.value.display_name, phone: form.value.phone, role: form.value.role }
      if (form.value.password) payload.password = form.value.password
      await usersApi.update(editing.value.id, payload)
      showToast('更新成功', 'success')
    } else {
      if (!form.value.password) { showToast('请输入密码', 'error'); saving.value = false; return }
      await usersApi.create({ username: form.value.username, display_name: form.value.display_name, phone: form.value.phone, password: form.value.password, role: form.value.role })
      showToast('创建成功', 'success')
    }
    showModal.value = false
    load()
  } catch (e: any) { showToast(e?.message || '操作失败', 'error') }
  saving.value = false
}

async function toggleActive(u: User) {
  try {
    await usersApi.update(u.id, { is_active: !u.is_active })
    u.is_active = !u.is_active
    showToast(u.is_active ? '已启用' : '已禁用', 'success')
  } catch { showToast('操作失败', 'error') }
}

const totalPages = () => Math.ceil(total.value / pageSize)

function roleLabel(r: string) {
  return { superadmin: '超级管理员', admin: '管理员', learner: '学员' }[r] || r
}

function exportUsers() {
  showToast('导出功能开发中', 'info')
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h2>用户管理</h2>
        <span class="page-sub">共 {{ total }} 名用户</span>
      </div>
      <div class="header-actions">
        <input v-model="search" class="search-input" placeholder="搜索用户名/手机号" @keyup.enter="load" />
        <button class="btn-export" @click="exportUsers">导出用户</button>
        <button class="btn-primary" @click="openCreate">+ 新建用户</button>
      </div>
    </div>

    <!-- Role filter chips -->
    <div class="role-chips">
      <button
        v-for="tab in ROLE_TABS"
        :key="tab.key"
        class="role-chip"
        :class="{ active: roleFilter === tab.key }"
        @click="roleFilter = tab.key"
      >{{ tab.label }}</button>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>显示名称</th>
            <th>手机号</th>
            <th>角色</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty-row"><span class="loading-dot">加载中...</span></td>
          </tr>
          <tr v-else-if="filteredUsers.length === 0">
            <td colspan="7" class="empty-row">暂无数据</td>
          </tr>
          <tr v-for="u in filteredUsers" :key="u.id">
            <td>
              <div class="user-cell">
                <div class="avatar">{{ (u.display_name || u.username).charAt(0) }}</div>
                {{ u.username }}
              </div>
            </td>
            <td>{{ u.display_name || '—' }}</td>
            <td>{{ u.phone || '—' }}</td>
            <td><span class="role-badge" :class="u.role">{{ roleLabel(u.role) }}</span></td>
            <td>
              <span class="status-dot" :class="u.is_active ? 'active' : 'inactive'">
                {{ u.is_active ? '正常' : '已禁用' }}
              </span>
            </td>
            <td class="text-secondary">{{ u.created_at?.slice(0, 10) }}</td>
            <td>
              <div class="row-actions">
                <template v-if="isSuperadmin || u.role !== 'superadmin'">
                  <button class="act-btn" @click="openEdit(u)">编辑</button>
                  <button class="act-btn danger" @click="toggleActive(u)">{{ u.is_active ? '禁用' : '启用' }}</button>
                </template>
                <span v-else class="text-secondary">—</span>
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

    <Modal v-if="showModal" :title="editing ? '编辑用户' : '新建用户'" @close="showModal = false">
      <div class="form-grid">
        <div class="field" v-if="!editing">
          <label>用户名 <span class="required">*</span></label>
          <input v-model="form.username" placeholder="唯一用户名" />
        </div>
        <div class="field">
          <label>显示名称</label>
          <input v-model="form.display_name" placeholder="可选" />
        </div>
        <div class="field">
          <label>手机号</label>
          <input v-model="form.phone" placeholder="可选" />
        </div>
        <div class="field">
          <label>{{ editing ? '新密码（留空不修改）' : '密码 *' }}</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" />
        </div>
        <div class="field">
          <label>角色</label>
          <select v-model="form.role">
            <option value="learner">学员</option>
            <option value="admin">管理员</option>
            <option v-if="isSuperadmin" value="superadmin">超级管理员</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showModal = false">取消</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? '确认中...' : (editing ? '确认修改' : '确认创建') }}</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; height: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-sub { font-size: 12px; color: var(--text-tertiary); display: block; margin-top: 2px; }
.header-actions { display: flex; gap: 10px; align-items: center; }
.search-input { height: 34px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border-strong); background: white; font-size: 13px; width: 200px; }

.role-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.role-chip {
  height: 30px; padding: 0 14px; border-radius: 15px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1px solid var(--border); background: var(--bg-grouped);
  color: var(--text-secondary); transition: all 150ms;
}
.role-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.role-chip.active { background: var(--color-primary, #0066CC); color: white; border-color: var(--color-primary, #0066CC); }

.btn-export {
  height: 34px; padding: 0 14px; border-radius: 8px;
  background: var(--bg-grouped); color: var(--text-primary);
  font-size: 13px; font-weight: 500; cursor: pointer;
  border: 1px solid var(--border); transition: all 150ms;
}
.btn-export:hover { background: var(--bg-selected); }

.table-card { background: white; border-radius: 12px; box-shadow: var(--shadow-1); border: 1px solid var(--border); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--separator); }
.data-table td { padding: 11px 16px; font-size: 13px; border-bottom: 1px solid var(--separator); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-grouped); }
.empty-row { text-align: center; color: var(--text-tertiary); padding: 40px !important; }
.text-secondary { color: var(--text-secondary); }

.user-cell { display: flex; align-items: center; gap: 8px; }
.avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#0066CC,#5856D6); color: white; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.role-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.role-badge.learner { background: rgba(0,102,204,0.08); color: var(--color-primary); }
.role-badge.admin { background: rgba(88,86,214,0.08); color: #5856D6; }
.role-badge.superadmin { background: rgba(255,149,0,0.1); color: var(--color-warning); }
.status-dot { font-size: 12px; font-weight: 500; }
.status-dot.active { color: var(--color-success); }
.status-dot.inactive { color: var(--text-tertiary); }
.row-actions { display: flex; gap: 6px; }
.act-btn { padding: 4px 10px; border-radius: 6px; font-size: 12px; background: var(--bg-grouped); color: var(--text-primary); cursor: pointer; border: 1px solid var(--border); transition: all 120ms; }
.act-btn:hover { background: var(--bg-selected); color: var(--color-primary); border-color: var(--color-primary); }
.act-btn.danger:hover { background: rgba(255,59,48,0.08); color: var(--color-danger); border-color: var(--color-danger); }

.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px; border-top: 1px solid var(--separator); }
.pg-btn { padding: 5px 14px; border-radius: 7px; font-size: 13px; background: var(--bg-grouped); color: var(--text-primary); cursor: pointer; border: 1px solid var(--border); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 12px; color: var(--text-secondary); }

.form-grid { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.required { color: var(--color-danger); }
input, select { height: 36px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); }
input:focus, select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,102,204,0.1); outline: none; }

.btn-primary { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--color-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 150ms; }
.btn-primary:hover { background: var(--color-primary-darker); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--bg-selected); }
</style>
