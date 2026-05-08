<!-- ## 通用对话框：支持自定义标题、宽度、footer 插槽 -->
<script setup lang="ts">
defineProps<{
  title: string
  width?: number
  confirmText?: string
  cancelText?: string
  confirmDisabled?: boolean
  confirmLoading?: boolean
}>()
defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <teleport to="body">
    <div class="modal-mask" @click.self="$emit('close')">
      <div class="modal-box" :style="{ width: `${width || 480}px` }">
        <div class="modal-header">
          <span class="modal-title">{{ title }}</span>
          <button class="modal-close" @click="$emit('close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <!-- Footer: props-driven buttons (inside Modal's own template, no slot+scoped issues) -->
        <div class="modal-footer" v-if="confirmText || $slots.footer">
          <slot name="footer">
            <button class="m-btn-ghost" @click="$emit('close')">
              {{ cancelText || '取消' }}
            </button>
            <button
              class="m-btn-primary"
              :disabled="confirmDisabled || confirmLoading"
              @click="$emit('confirm')"
            >
              {{ confirmLoading ? '处理中...' : confirmText }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.modal-box {
  background: white; border-radius: 14px;
  box-shadow: var(--shadow-3); overflow: hidden;
  animation: modal-in 200ms var(--ease-spring);
  max-height: 90vh; display: flex; flex-direction: column;
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--separator);
  flex-shrink: 0;
}
.modal-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.modal-close {
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--bg-grouped); color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  transition: all 120ms;
}
.modal-close:hover { background: rgba(255,59,48,0.1); color: #FF3B30; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; min-height: 0; }
.modal-footer {
  padding: 14px 20px; border-top: 1px solid var(--separator);
  display: flex; justify-content: flex-end; gap: 8px;
  flex-shrink: 0;
}

/* Buttons defined inside Modal — scoped attribute matches, no teleport issues */
.m-btn-primary {
  height: 34px; padding: 0 16px; border-radius: 8px;
  background: var(--color-primary); color: white;
  font-size: 13px; font-weight: 600; cursor: pointer; border: none;
}
.m-btn-primary:hover { opacity: 0.88; }
.m-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.m-btn-ghost {
  height: 34px; padding: 0 16px; border-radius: 8px;
  background: var(--bg-grouped); color: var(--text-primary);
  font-size: 13px; font-weight: 500; cursor: pointer;
  border: 1px solid var(--border);
}
.m-btn-ghost:hover { background: var(--bg-selected); }
</style>
