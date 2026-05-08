// ## Toast 通知（全局共享响应式队列，3s 后自动消失）────────────────────
import { ref } from 'vue'

interface ToastItem { id: number; message: string; type: 'success' | 'error' | 'info' }

export const toasts = ref<ToastItem[]>([])
let seq = 0

export function showToast(message: string, type: ToastItem['type'] = 'info') {
  const id = ++seq
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
}
