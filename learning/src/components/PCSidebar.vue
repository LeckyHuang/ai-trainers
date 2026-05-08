<!-- ## PC 左侧导航栏：Logo + 导航项 + 未读消息角标 -->
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps<{ unread: number }>()
const router = useRouter()
const route = useRoute()

const items = [
  { to: '/home', icon: 'home', label: '首页' },
  { to: '/notifications', icon: 'bell', label: '通知', badge: true },
  { to: '/profile', icon: 'user', label: '我的' },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function go(to: string) {
  router.push(to)
}
</script>

<template>
  <aside class="pc-sidebar">
    <div class="pc-sidebar-logo">
      <div class="pc-sidebar-logo-icon"><AppIcon name="sparkle" :size="18" /></div>
      <div class="pc-sidebar-logo-text">AI 陪练</div>
    </div>

    <button
      v-for="item in items"
      :key="item.to"
      class="pc-sidebar-item"
      :class="{ active: isActive(item.to) }"
      @click="go(item.to)"
    >
      <span class="icon"><AppIcon :name="item.icon" :size="20" /></span>
      <span class="label">{{ item.label }}</span>
      <span v-if="item.badge && unread > 0" class="badge-dot">
        {{ unread > 99 ? '99+' : unread }}
      </span>
    </button>

    <div style="flex: 1" />

    <div class="pc-sidebar-tip">
      <div class="pc-sidebar-tip-title">
        <AppIcon name="bolt" :size="14" /> 学习提示
      </div>
      坚持每日练习 15 分钟，可显著提升留存率
    </div>
  </aside>
</template>
