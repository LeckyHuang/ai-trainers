<!-- ## 管理员主布局：左侧导航栏 + 右侧内容区 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminIcon from '@/components/AdminIcon.vue'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const navGroups = [
  { group: '概览', items: [{ id: 'dashboard', label: '仪表盘', icon: 'dashboard', path: '/dashboard' }] },
  { group: '用户管理', items: [{ id: 'users', label: '用户列表', icon: 'users', path: '/users' }] },
  { group: '内容管理', items: [
    { id: 'files', label: '文件库', icon: 'files', path: '/files' },
    { id: 'banks', label: '题库管理', icon: 'question-bank', path: '/question-banks' },
    { id: 'personas', label: '角色库', icon: 'personas', path: '/personas' },
  ]},
  { group: '培训任务', items: [{ id: 'tasks', label: '任务管理', icon: 'tasks', path: '/tasks' }] },
  { group: '消息', items: [{ id: 'notifications', label: '通知管理', icon: 'notifications', path: '/notifications' }] },
]

const activeId = computed(() => {
  const p = route.path
  if (p.startsWith('/question-banks')) return 'banks'
  if (p.startsWith('/tasks')) return 'tasks'
  return p.replace('/', '')
})

function go(path: string) { router.push(path) }
function logout() {
  auth.logout()
  router.push('/login')
}

const initials = computed(() => {
  const name = auth.user?.display_name || auth.user?.username || ''
  return name.charAt(0) || 'A'
})

const currentPageLabel = computed(() => {
  for (const g of navGroups) {
    const found = g.items.find(item => item.id === activeId.value)
    if (found) return found.label
  }
  return ''
})
</script>

<template>
  <div class="layout mac-theme">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <AdminIcon name="ai" />
        </div>
        <span class="logo-text">AI 陪练</span>
      </div>

      <nav class="sidebar-nav">
        <template v-for="g in navGroups" :key="g.group">
          <div class="nav-group-label">{{ g.group }}</div>
          <div
            v-for="item in g.items" :key="item.id"
            class="nav-item"
            :class="{ active: activeId === item.id }"
            @click="go(item.path)"
          >
            <span class="nav-icon"><AdminIcon :name="item.icon" /></span>
            <span>{{ item.label }}</span>
          </div>
        </template>
      </nav>

      <div class="sidebar-user">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.user?.display_name || auth.user?.username }}</div>
          <div class="user-role">{{ auth.user?.role === 'superadmin' ? '超级管理员' : '管理员' }}</div>
        </div>
        <button class="logout-btn" @click="logout" title="退出登录"><AdminIcon name="logout" /></button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main-area">
      <div class="main-toolbar">
        <div class="toolbar-breadcrumb">
          <span class="breadcrumb-root">管理后台</span>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-current">{{ currentPageLabel }}</span>
        </div>
      </div>
      <div class="main-content">
        <router-view />
      </div>
    </main>

    <Toast />
  </div>
</template>

<style scoped>
.layout {
  display: flex; height: 100vh; overflow: hidden;
  background: var(--bg-window);
}

/* Sidebar */
.sidebar {
  width: 240px; flex-shrink: 0;
  background: var(--bg-sidebar);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--separator);
}
.logo-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: linear-gradient(135deg, #0066CC, #5856D6);
  color: white;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.logo-text { font-size: 15px; font-weight: 700; color: var(--text-primary); }

.sidebar-nav {
  flex: 1; overflow-y: auto; padding: 10px 8px;
  display: flex; flex-direction: column; gap: 2px;
}
.nav-group-label {
  padding: 10px 10px 4px;
  font-size: 10px; font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.6px; text-transform: uppercase;
}
.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 7px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  color: var(--text-primary);
  border-left: 3px solid transparent;
  transition: all 150ms;
}
.nav-item:hover { background: var(--bg-grouped); }
.nav-item.active {
  background: var(--bg-selected);
  color: var(--color-primary);
  font-weight: 600;
  border-left-color: var(--color-primary);
}
.nav-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: inherit; }

.sidebar-user {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 12px; border-top: 1px solid var(--separator);
}
.user-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #FF9500, #FF2D55);
  color: white; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-role { font-size: 10px; color: var(--text-secondary); }
.logout-btn {
  padding: 4px; border-radius: 5px;
  color: var(--text-secondary); display: flex;
}
.logout-btn:hover { background: var(--bg-grouped); color: var(--color-danger); }

/* Main area */
.main-area {
  flex: 1; overflow: hidden; display: flex; flex-direction: column;
}

.main-toolbar {
  height: 44px;
  background: var(--bg-toolbar);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 20px;
  flex-shrink: 0;
  position: sticky; top: 0; z-index: 10;
}
.toolbar-breadcrumb { display: flex; align-items: center; gap: 6px; }
.breadcrumb-root { font-size: 12px; color: var(--text-tertiary); }
.breadcrumb-sep { font-size: 11px; color: var(--text-tertiary); }
.breadcrumb-current { font-size: 12px; font-weight: 600; color: var(--text-secondary); }

.main-content { flex: 1; overflow-y: auto; }

.fade-enter-active, .fade-leave-active { transition: opacity 100ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
