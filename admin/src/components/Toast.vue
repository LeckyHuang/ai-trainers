<!-- ## Toast 通知组件：消费全局 toasts 队列，固定右下角展示 -->
<script setup lang="ts">
import { toasts } from '@/composables/toast'
</script>

<template>
  <teleport to="body">
    <div class="toast-container">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
          <span class="toast-icon">{{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ' }}</span>
          {{ t.message }}
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped>
.toast-container {
  position: fixed; top: 20px; right: 20px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.toast {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 500;
  background: white; box-shadow: var(--shadow-3);
  pointer-events: all; min-width: 220px; max-width: 320px;
}
.toast.success { border-left: 3px solid var(--color-success); }
.toast.error { border-left: 3px solid var(--color-danger); }
.toast.info { border-left: 3px solid var(--color-primary); }
.toast-icon { font-weight: 700; font-size: 12px; }
.toast.success .toast-icon { color: var(--color-success); }
.toast.error .toast-icon { color: var(--color-danger); }
.toast.info .toast-icon { color: var(--color-primary); }
.toast-enter-active { transition: all 250ms var(--ease-spring); }
.toast-leave-active { transition: all 200ms var(--ease-quick); }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>
