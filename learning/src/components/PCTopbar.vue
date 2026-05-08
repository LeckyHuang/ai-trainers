<!-- ## PC 顶部导航栏：面包屑路径 + 返回按钮 + 用户头像 + 通知入口 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'

defineProps<{ unread: number }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// 根路径 —— 不需要返回按钮
const ROOT_PATHS = ['/home', '/notifications', '/profile']
const isRoot = computed(() => ROOT_PATHS.some(p => route.path === p))

const pageLabel = computed(() => {
  const map: Record<string, string> = {
    home: '首页',
    notifications: '通知中心',
    profile: '个人中心',
    tasks: '任务详情',
    qa: '练习结果',
    roleplay: '对练结果',
  }
  const seg = route.path.split('/')[1] || 'home'
  return map[seg] || seg
})

function goBack() { router.back() }
function goHome() { router.push('/home') }
function goNotifications() { router.push('/notifications') }

const initial = computed(() => {
  const name = auth.user?.display_name || auth.user?.username || '?'
  return name.charAt(0).toUpperCase()
})
</script>

<template>
  <header class="pc-topbar">
    <!-- 返回按钮（非根页面显示） -->
    <button v-if="!isRoot" class="back-btn" @click="goBack">
      <AppIcon name="chevron-left" :size="18" />
    </button>

    <!-- 面包屑 -->
    <div class="pc-topbar-breadcrumb">
      <span class="crumb-link" @click="goHome">首页</span>
      <span v-if="!isRoot" class="crumb-sep">/</span>
      <span v-if="!isRoot" class="crumb-current">{{ pageLabel }}</span>
    </div>

    <div style="flex: 1" />
    <input class="pc-topbar-search" placeholder="搜索任务、题库、角色..." readonly />
    <button style="position: relative" @click="goNotifications">
      <AppIcon name="bell" :size="20" />
      <span
        v-if="unread > 0"
        style="position:absolute;top:-2px;right:-4px;background:var(--color-danger);color:white;font-size:9px;font-weight:700;padding:1px 4px;border-radius:8px;min-width:14px;text-align:center"
      >{{ unread > 99 ? '99+' : unread }}</span>
    </button>
    <div class="pc-topbar-avatar">{{ initial }}</div>
  </header>
</template>

<style scoped>
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
  color: var(--text-secondary); transition: background 120ms;
  margin-right: 2px;
}
.back-btn:hover { background: var(--bg-grouped); color: var(--text-primary); }

.crumb-link {
  color: var(--text-secondary); font-size: 13px; cursor: pointer;
  transition: color 120ms;
}
.crumb-link:hover { color: var(--color-primary); }
.crumb-sep { color: var(--text-tertiary); font-size: 13px; margin: 0 6px; }
.crumb-current { font-size: 13px; color: var(--text-primary); font-weight: 500; }
</style>
