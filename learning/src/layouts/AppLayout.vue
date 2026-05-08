<!-- ## 主布局：PC 显示左侧栏+顶栏，移动端显示底部导航栏 -->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterView, RouterLink } from 'vue-router'
import { notificationsApi } from '@/api'
import PCSidebar from '@/components/PCSidebar.vue'
import PCTopbar from '@/components/PCTopbar.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const unread = ref(0)
const windowWidth = ref(window.innerWidth)

const isPC = computed(() => windowWidth.value >= 768)

function onResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  // 每次回到通知页、或通知被标记后刷新未读数
  window.addEventListener('notif-read', fetchUnread)
  fetchUnread()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('notif-read', fetchUnread)
})

async function fetchUnread() {
  try {
    const res = await notificationsApi.unreadCount()
    unread.value = res.count ?? 0
  } catch {}
}

const navItems = [
  { to: '/home', icon: 'home', label: '首页' },
  { to: '/notifications', icon: 'bell', label: '消息' },
  { to: '/profile', icon: 'user', label: '我的' },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <!-- PC Layout -->
  <div v-if="isPC" class="pc-layout">
    <PCSidebar :unread="unread" />
    <div class="pc-main">
      <PCTopbar :unread="unread" />
      <div class="pc-content">
        <RouterView />
      </div>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div v-else class="layout">
    <div class="content-area">
      <RouterView />
    </div>
    <nav class="bottom-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
      >
        <div class="nav-icon-wrap">
          <AppIcon :name="item.icon" :size="24" />
          <span v-if="item.to === '/notifications' && unread > 0" class="badge">
            {{ unread > 99 ? '99+' : unread }}
          </span>
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
/* Mobile layout (existing) */
.layout { height: 100vh; display: flex; flex-direction: column; }
.content-area { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }

.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: calc(var(--nav-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-top: 1px solid var(--separator);
  display: flex; align-items: stretch;
  z-index: 100;
}

.nav-item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 3px;
  color: var(--text-3); text-decoration: none;
  transition: color 150ms;
}
.nav-item.active { color: var(--primary); }

.nav-icon-wrap { position: relative; }
.nav-icon-wrap { display: flex; align-items: center; justify-content: center; }
.badge {
  position: absolute; top: -4px; right: -8px;
  background: var(--danger); color: white;
  font-size: 9px; font-weight: 700;
  min-width: 16px; height: 16px;
  border-radius: 8px; padding: 0 4px;
  display: flex; align-items: center; justify-content: center;
}
.nav-label { font-size: 10px; font-weight: 500; }
</style>
