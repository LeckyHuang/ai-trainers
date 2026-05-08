<!-- ## 通知管理：查看系统通知，标记已读 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminIcon from '@/components/AdminIcon.vue'
import { notificationsApi } from '@/api'
import type { Notification } from '@/api/types'
import { showToast } from '@/composables/toast'

const notifications = ref<Notification[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const markingAll = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await notificationsApi.list({ page: page.value, page_size: pageSize })
    notifications.value = res.items
    total.value = res.total
  } catch { showToast('加载失败', 'error') }
  loading.value = false
}

onMounted(load)

async function markRead(n: Notification) {
  if (n.is_read) return
  try {
    await notificationsApi.markRead(n.id)
    n.is_read = true
  } catch {}
}

async function markAllRead() {
  markingAll.value = true
  try {
    await notificationsApi.markAllRead()
    notifications.value.forEach(n => n.is_read = true)
    showToast('全部已读', 'success')
  } catch { showToast('操作失败', 'error') }
  markingAll.value = false
}

const totalPages = () => Math.ceil(total.value / pageSize)
const unreadCount = () => notifications.value.filter(n => !n.is_read).length

function typeIcon(t?: string) {
  return { task_assigned: 'tasks', task_completed: 'check', system: 'notifications', reminder: 'clock' }[t || ''] || 'notifications'
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h2>通知管理</h2>
        <span class="page-sub">共 {{ total }} 条通知，{{ unreadCount() }} 条未读</span>
      </div>
      <button
        class="btn-ghost"
        :disabled="markingAll || unreadCount() === 0"
        @click="markAllRead"
      >{{ markingAll ? '处理中...' : '全部标为已读' }}</button>
    </div>

    <div class="notif-list">
      <div v-if="loading" class="loading-state">加载中...</div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <div class="empty-icon"><AdminIcon name="notifications" /></div>
        <div class="empty-title">暂无通知</div>
      </div>

      <template v-else>
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notif-item"
          :class="{ unread: !n.is_read }"
          @click="markRead(n)"
        >
          <div class="notif-icon"><AdminIcon :name="typeIcon((n as any).notification_type ?? n.type)" /></div>
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-content" v-if="(n as any).content ?? n.body">{{ (n as any).content ?? n.body }}</div>
            <div class="notif-time">{{ n.created_at?.slice(0, 16).replace('T', ' ') }}</div>
          </div>
          <div class="notif-unread-dot" v-if="!n.is_read" />
        </div>
      </template>
    </div>

    <div class="pagination" v-if="total > pageSize">
      <button class="pg-btn" :disabled="page === 1" @click="page--; load()">‹ 上一页</button>
      <span class="pg-info">{{ page }} / {{ totalPages() }}</span>
      <button class="pg-btn" :disabled="page >= totalPages()" @click="page++; load()">下一页 ›</button>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; height: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-sub { font-size: 12px; color: var(--text-tertiary); display: block; margin-top: 2px; }
.loading-state { text-align: center; color: var(--text-tertiary); padding: 60px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 80px; }
.empty-icon { opacity: 0.4; color: var(--text-tertiary); margin-bottom: 8px; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }

.notif-list { background: white; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-1); overflow: hidden; }
.notif-item {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px 20px; border-bottom: 1px solid var(--separator);
  cursor: pointer; transition: background 120ms; position: relative;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--bg-grouped); }
.notif-item.unread { background: rgba(0,102,204,0.02); }
.notif-icon { flex-shrink: 0; margin-top: 1px; color: var(--text-tertiary); }
.notif-body { flex: 1; min-width: 0; }
.notif-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.notif-item.unread .notif-title { font-weight: 700; }
.notif-content { font-size: 13px; color: var(--text-secondary); margin-top: 3px; line-height: 1.5; }
.notif-time { font-size: 11px; color: var(--text-tertiary); margin-top: 6px; }
.notif-unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); flex-shrink: 0; margin-top: 6px; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pg-btn { padding: 5px 14px; border-radius: 7px; font-size: 13px; background: white; color: var(--text-primary); cursor: pointer; border: 1px solid var(--border); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 12px; color: var(--text-secondary); }
.btn-ghost { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); color: var(--text-primary); font-size: 13px; cursor: pointer; border: 1px solid var(--border); }
.btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
