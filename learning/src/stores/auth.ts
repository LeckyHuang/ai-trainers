// ## 认证状态管理（Pinia）────────────────────────────────────────────────
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  // ## 状态（持久化到 localStorage，key="token"）
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(t: string, u: User) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, setAuth, logout }
})
