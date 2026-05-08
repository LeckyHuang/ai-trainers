// ## 认证状态管理（Pinia）────────────────────────────────────────────────
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  // ## 状态（持久化到 localStorage）
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'))

  async function login(username: string, password: string) {
    const res: any = await authApi.login(username, password)
    token.value = res.access_token
    user.value = res.user
    localStorage.setItem('access_token', res.access_token)
    localStorage.setItem('user', JSON.stringify(res.user))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }

  return { token, user, login, logout }
})
