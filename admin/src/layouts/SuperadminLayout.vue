<!-- ## 超管布局：左侧导航栏（紫色主题）+ 右侧内容区 + 工具栏面包屑 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminIcon from '@/components/AdminIcon.vue'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const navItems = [
  { group: '概览', items: [
    { id: 'dashboard', label: '平台仪表盘', icon: 'chart', path: '/sa/dashboard' },
  ]},
  { group: '超管', items: [
    { id: 'tenants', label: '企业账号', icon: 'building', path: '/sa/tenants' },
    { id: 'config', label: 'Prompt 管理', icon: 'code', path: '/sa/config' },
    { id: 'audit', label: 'AI 配置 & 审计', icon: 'shield', path: '/sa/audit' },
  ]},
]

const activeId = computed(() => route.path.split('/').pop() || 'dashboard')

function go(path: string) { router.push(path) }
function logout() { auth.logout(); router.push('/login') }

const initials = computed(() => {
  const name = auth.user?.display_name || auth.user?.username || ''
  return name.charAt(0).toUpperCase() || 'S'
})
</script>

<template>
  <div class="layout mac-theme">
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5Z" />
          </svg>
        </div>
        <div class="logo-wrap">
          <span class="logo-text">AI 陪练</span>
          <span class="sa-badge">超级管理员</span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <template v-for="g in navItems" :key="g.group">
          <div class="nav-group-label" :class="{ 'sa-group': g.group === '超管' }">{{ g.group }}</div>
          <div
            v-for="item in g.items" :key="item.id"
            class="nav-item"
            :class="{ active: activeId === item.id, 'sa-item': g.group === '超管' }"
            @click="go(item.path)"
          >
            <span class="nav-icon">
              <AdminIcon :name="item.icon" />
            </span>
            <span>{{ item.label }}</span>
          </div>
        </template>
      </nav>

      <!-- User -->
      <div class="sidebar-user">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.user?.display_name || auth.user?.username }}</div>
          <div class="user-role sa-role">超级管理员</div>
        </div>
        <button class="logout-btn" @click="logout" title="退出登录"><AdminIcon name="logout" /></button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main-area">
      <div class="toolbar">
        <div class="breadcrumb">
          <span class="bc-root">管理控制台</span>
          <span class="bc-sep">›</span>
          <span class="bc-cur">{{ { dashboard: '平台仪表盘', tenants: '企业账号', config: 'Prompt 管理', audit: 'AI 配置 & 审计' }[activeId] || '' }}</span>
        </div>
        <span class="env-pill">STANDALONE MODE</span>
      </div>
      <div class="scroll-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <Toast />
  </div>
</template>

<style scoped>
.layout { display: flex; height: 100vh; overflow: hidden; background: var(--bg-window); }

.sidebar {
  width: 220px; flex-shrink: 0;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
}
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--separator);
}
.logo-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: linear-gradient(135deg, #AF52DE, #FF2D92);
  color: white; font-size: 16px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.logo-wrap { display: flex; flex-direction: column; gap: 2px; }
.logo-text { font-size: 14px; font-weight: 700; color: var(--text-primary); line-height: 1; }
.sa-badge {
  font-size: 9px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;
  color: #AF52DE; background: rgba(175,82,222,0.1); padding: 1px 5px; border-radius: 3px; width: fit-content;
}

.sidebar-nav {
  flex: 1; overflow-y: auto; padding: 10px 8px;
  display: flex; flex-direction: column; gap: 2px;
}
.nav-group-label {
  padding: 10px 10px 4px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;
  color: var(--text-tertiary);
}
.nav-group-label.sa-group { color: #AF52DE; }

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
/* SA items get purple accent when active */
.nav-item.sa-item.active {
  background: rgba(175,82,222,0.08);
  color: #AF52DE;
  border-left-color: #AF52DE;
}
.nav-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: inherit; }

.sidebar-user {
  display: flex; align-items: center; gap: 8px;
  padding: 12px; border-top: 1px solid var(--separator);
}
.user-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #AF52DE, #FF2D92);
  color: white; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-role { font-size: 10px; color: var(--text-secondary); }
.sa-role { color: #AF52DE !important; }
.logout-btn { padding: 4px 6px; border-radius: 5px; font-size: 14px; color: var(--text-secondary); }
.logout-btn:hover { background: var(--bg-grouped); color: var(--color-danger); }

.main-area { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.toolbar {
  height: 44px; padding: 0 20px; flex-shrink: 0;
  background: rgba(246,246,246,0.9); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px; font-size: 13px;
}
.breadcrumb { display: flex; align-items: center; gap: 6px; flex: 1; }
.bc-root { color: var(--text-secondary); }
.bc-sep { color: var(--text-tertiary); }
.bc-cur { color: var(--text-primary); font-weight: 600; }
.env-pill {
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  padding: 2px 8px; border-radius: 4px;
  background: rgba(175,82,222,0.1); color: #AF52DE;
}
.scroll-area { flex: 1; overflow-y: auto; }
.fade-enter-active, .fade-leave-active { transition: opacity 100ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
