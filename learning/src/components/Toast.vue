<!-- ## Toast 通知组件：消费全局 toasts 队列，固定右下角展示 -->
<script setup lang="ts">
import { toasts } from '@/composables/toast'
</script>

<template>
  <Teleport to="body">
    <div class="toast-wrap">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
          <span class="toast-icon">{{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ' }}</span>
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-wrap {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; flex-direction: column; gap: 8px;
  pointer-events: none; min-width: 220px; max-width: 320px;
}
.toast {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 12px;
  font-size: 14px; font-weight: 500;
  backdrop-filter: blur(16px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  pointer-events: auto;
}
.toast.success { background: rgba(52,199,89,0.92); color: white; }
.toast.error { background: rgba(255,59,48,0.92); color: white; }
.toast.info { background: rgba(28,28,30,0.88); color: white; }
.toast-icon { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }

.toast-enter-active { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-12px) scale(0.92); }
.toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.95); }
</style>
