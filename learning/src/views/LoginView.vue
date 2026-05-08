<!-- ## 登录页 -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const shaking = ref(false)

const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

async function handleLogin() {
  if (!username.value || !password.value) { error.value = '请输入账号和密码'; return }
  loading.value = true; error.value = ''
  try {
    const res = await authApi.login({ username: username.value, password: password.value })
    // 确认拿到 token 再存储
    if (!res || !res.access_token) {
      throw new Error('服务器响应缺少 access_token，请联系管理员')
    }
    auth.setAuth(res.access_token, res.user)
    router.push('/home')
  } catch (e: any) {
    // 打到 console 便于排查，不影响用户体验
    console.error('[Login] 登录失败:', {
      code: e?.code,
      status: e?.response?.status,
      data: e?.response?.data,
      message: e?.message,
    })

    const status = e?.response?.status
    const detail = e?.response?.data?.detail

    if (!e?.response) {
      // 请求根本没有收到响应 —— 网络不通或服务未启动
      error.value = `无法连接到服务器（${e?.code || '网络异常'}），请确认服务正常运行`
    } else if (status === 401) {
      error.value = detail || '账号或密码错误'
    } else if (status === 422) {
      error.value = '请求格式错误，请刷新后重试'
    } else if (detail) {
      error.value = detail
    } else {
      error.value = `登录失败（HTTP ${status}），请刷新后重试`
    }

    shaking.value = true
    setTimeout(() => { shaking.value = false }, 500)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- ========== PC Split-screen Layout ========== -->
  <div v-if="isPC" class="pc-login-page">
    <!-- Left brand panel -->
    <div class="pc-brand-panel">
      <div class="pc-brand-content">
        <div class="pc-logo-mark"><AppIcon name="target" :size="40" /></div>
        <div class="pc-brand-title">AI 陪练</div>
        <div class="pc-brand-sub">企业培训智能陪练平台</div>
        <div class="pc-features">
          <div class="pc-feature-item">
            <div class="pc-feature-icon"><AppIcon name="task-qa" :size="20" /></div>
            <div>
              <div class="pc-feature-label">知识问答训练</div>
              <div class="pc-feature-desc">AI 即时评分，强化知识掌握</div>
            </div>
          </div>
          <div class="pc-feature-item">
            <div class="pc-feature-icon"><AppIcon name="task-roleplay" :size="20" /></div>
            <div>
              <div class="pc-feature-label">模拟对练</div>
              <div class="pc-feature-desc">真实场景对话，提升实战能力</div>
            </div>
          </div>
          <div class="pc-feature-item">
            <div class="pc-feature-icon"><AppIcon name="trophy" :size="20" /></div>
            <div>
              <div class="pc-feature-label">考核模式</div>
              <div class="pc-feature-desc">限时考核，客观评估学习效果</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="pc-form-panel">
      <div class="pc-login-card card" :class="{ shaking: shaking }">
        <div class="logo-area">
          <div class="logo-mark"><AppIcon name="target" :size="48" /></div>
          <h1>欢迎回来</h1>
          <p>请登录您的账号</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="field">
            <label>账号 / 手机号</label>
            <input
              v-model="username"
              placeholder="请输入账号或手机号"
              autocomplete="username"
              :disabled="loading"
            />
          </div>
          <div class="field">
            <label>密码</label>
            <div class="input-wrapper">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
                :disabled="loading"
              />
              <button type="button" class="eye-toggle" @click="showPassword = !showPassword" tabindex="-1">
                <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="18" />
              </button>
            </div>
          </div>
          <div v-if="error" class="error-box">{{ error }}</div>
          <button type="submit" class="btn-primary login-btn" :disabled="loading">
            <span v-if="loading" class="spinner" style="width:18px;height:18px;" />
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- ========== Mobile Layout ========== -->
  <div v-else class="login-page">
    <div class="login-bg">
      <div class="blob blob-1" />
      <div class="blob blob-2" />
    </div>

    <div class="login-card card" :class="{ shaking: shaking }">
      <div class="logo-area">
        <div class="logo-mark"><AppIcon name="target" :size="48" /></div>
        <h1>AI 陪练</h1>
        <p>企业培训陪练平台</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label>账号 / 手机号</label>
          <input
            v-model="username"
            placeholder="请输入账号或手机号"
            autocomplete="username"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label>密码</label>
          <div class="input-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button type="button" class="eye-toggle" @click="showPassword = !showPassword" tabindex="-1">
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="18" />
            </button>
          </div>
        </div>

        <div v-if="error" class="error-box">{{ error }}</div>

        <button type="submit" class="btn-primary login-btn" :disabled="loading">
          <span v-if="loading" class="spinner" style="width:18px;height:18px;" />
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>

.login-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #E8F4FF 0%, #F2F2F7 50%, #EEE5FF 100%);
  padding: 20px;
  position: relative; overflow: hidden;
}
.login-bg { position: absolute; inset: 0; pointer-events: none; }
.blob {
  position: absolute; border-radius: 50%;
  filter: blur(60px); opacity: 0.5;
}
.blob-1 {
  width: 300px; height: 300px;
  background: rgba(0,122,255,0.2);
  top: -60px; left: -60px;
}
.blob-2 {
  width: 250px; height: 250px;
  background: rgba(175,82,222,0.15);
  bottom: -40px; right: -40px;
}

.login-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  padding: 36px 28px;
  display: flex; flex-direction: column; gap: 24px;
}

@media (min-width: 768px) {
  .login-card {
    box-shadow: var(--shadow-3);
    border-radius: var(--radius-xl);
  }
}

.login-card.shaking {
  animation: ios-shake 0.4s var(--ease-quick, cubic-bezier(0.4,0,0.2,1));
}

.input-wrapper { position: relative; }
.input-wrapper input { padding-right: 44px; width: 100%; box-sizing: border-box; }
.eye-toggle {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 16px; color: var(--text-3, rgba(60,60,67,0.3)); padding: 4px;
  line-height: 1;
}

.logo-area {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.logo-mark {
  width: 64px; height: 64px; border-radius: 18px;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  font-size: 32px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(0,122,255,0.35);
  margin-bottom: 4px;
}
h1 { font-size: 26px; font-weight: 800; color: var(--text-1); letter-spacing: -0.5px; }
p { font-size: 13px; color: var(--text-3); }

form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 13px; font-weight: 600; color: var(--text-2); }

.error-box {
  background: rgba(255,59,48,0.08);
  border: 1px solid rgba(255,59,48,0.2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--danger);
  text-align: center;
}

.login-btn { margin-top: 4px; height: 48px; font-size: 16px; border-radius: 10px; }

/* ========== PC Split-screen ========== */
.pc-login-page {
  display: flex; min-height: 100vh;
}
.pc-brand-panel {
  width: 50%; background: linear-gradient(160deg, #007AFF 0%, #5856D6 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
}
.pc-brand-content {
  display: flex; flex-direction: column; gap: 20px;
  color: white; max-width: 360px;
}
.pc-logo-mark {
  width: 64px; height: 64px; border-radius: 18px;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  border: 2px solid rgba(255,255,255,0.3);
}
.pc-brand-title { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
.pc-brand-sub { font-size: 15px; opacity: 0.8; margin-top: -12px; }
.pc-features { display: flex; flex-direction: column; gap: 16px; margin-top: 12px; }
.pc-feature-item {
  display: flex; align-items: flex-start; gap: 14px;
  background: rgba(255,255,255,0.12);
  border-radius: 12px; padding: 14px 16px;
}
.pc-feature-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pc-feature-label { font-size: 14px; font-weight: 600; }
.pc-feature-desc { font-size: 12px; opacity: 0.75; margin-top: 2px; }

.pc-form-panel {
  width: 50%; background: var(--bg-system, #F2F2F7);
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
}
.pc-login-card {
  width: 100%; max-width: 420px;
  padding: 36px 32px;
  display: flex; flex-direction: column; gap: 24px;
  box-shadow: var(--shadow-3); border-radius: var(--radius-xl);
}
.pc-login-card.shaking {
  animation: ios-shake 0.4s var(--ease-quick, cubic-bezier(0.4,0,0.2,1));
}
</style>
