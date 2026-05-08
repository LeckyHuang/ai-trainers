<!-- ## 管理员登录页 -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) { error.value = '请输入用户名和密码'; return }
  loading.value = true; error.value = ''
  try {
    await auth.login(username.value, password.value)
    const role = auth.user?.role
    router.push(role === 'superadmin' ? '/sa/dashboard' : '/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e?.detail || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- macOS window title bar -->
      <div class="card-header">
        <div class="traffic-lights">
          <span class="dot red" />
          <span class="dot yellow" />
          <span class="dot green" />
        </div>
        <span class="header-title">管理后台</span>
      </div>

      <!-- Logo area -->
      <div class="login-logo">
        <h1>AI 陪练</h1>
        <p>管理后台</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label>用户名 / 手机号</label>
          <input v-model="username" placeholder="请输入用户名" autocomplete="username" />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
      <p class="login-hint">默认账号：admin / admin123</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1C1C1E;
}

.login-card {
  width: 380px;
  border-radius: 12px;
  background: rgba(44, 44, 46, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* macOS title bar */
.card-header {
  position: relative;
  height: 44px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.traffic-lights {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.dot.red    { background: #FF5F57; }
.dot.yellow { background: #FEBC2E; }
.dot.green  { background: #28C840; }

.header-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

/* Logo area */
.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 32px 40px 20px;
}

.login-logo h1 {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.login-logo p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 40px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

input {
  height: 42px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.07);
  font-size: 14px;
  color: white;
  transition: border-color 150ms, box-shadow 150ms;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

input:focus {
  outline: none;
  border-color: rgba(0, 102, 204, 0.8);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.25);
}

.error-msg {
  font-size: 12px;
  color: #FF6B6B;
  padding: 8px 12px;
  background: rgba(255, 59, 48, 0.12);
  border-radius: 7px;
  text-align: center;
}

.btn-login {
  height: 42px;
  border-radius: 8px;
  background: #0066CC;
  color: white;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 150ms;
  margin-top: 6px;
}

.btn-login:hover:not(:disabled) {
  background: #0055B3;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  margin: 16px 0 24px;
  padding: 0 40px;
}
</style>
