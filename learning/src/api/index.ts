// ## Axios 实例配置 ────────────────────────────────────────────────────────
import axios from 'axios'

const api: any = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 60000,
})

// ## 请求拦截：自动附加 Bearer Token ──────────────────────────────────────
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ## 响应拦截：401 自动跳转登录（仅非登录请求触发跳转，避免登录页自环）──────
api.interceptors.response.use(
  (res: any) => res.data,
  (err: any) => {
    if (err.response?.status === 401) {
      // 如果当前请求本身就是登录接口，不做跳转——让 LoginView 自己处理错误
      const isLoginRequest = err.config?.url?.includes('/auth/login')
      if (!isLoginRequest) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.hash = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ## API 模块 ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  updateProfile: (data: { display_name?: string }) => api.patch('/auth/me', data),
  changePassword: (data: { old_password: string; new_password: string }) => api.post('/auth/change-password', data),
}

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: number | string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  unreadCount: () => api.get('/notifications/unread-count'),
}

export const tasksApi = {
  myTasks: () => api.get('/tasks/my'),
  get: (id: string) => api.get(`/tasks/${id}`),
  reportReadingPage: (taskId: string, fileId: string, page: number, totalPages: number) =>
    api.post(`/tasks/${taskId}/materials/${fileId}/page`, { page, total_pages: totalPages }),
  mySubmissions: (taskId: string) => api.get(`/qa/tasks/${taskId}/my-submissions`),
}

export const filesApi = {
  get: (id: string) => api.get(`/files/${id}`),
  downloadUrl: (id: string) => {
    const token = localStorage.getItem('token') || ''
    return `${api.defaults.baseURL}/files/${id}/download?token=${encodeURIComponent(token)}`
  },
}

export const personasApi = {
  list: (params?: { task_id?: string }) => api.get('/personas', { params }),
}

export const qaApi = {
  startSession: (data: { task_id: string; mode: string }) => api.post('/qa/start-session', data),
  submitAnswer: (data: {
    submission_id: string
    question_id: string
    question_order: number
    audio_file_id: string
    mode: string
    text_override?: string
  }) => api.post('/qa/submit-answer', data, { timeout: 180000 }),
  completeSession: (data: { submission_id: string }) => api.post('/qa/complete-session', data),
  getSession: (id: string) => api.get(`/qa/sessions/${id}`),
}

export const uploadApi = {
  uploadAudio: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const systemConfigApi = {
  getPublic: () => api.get('/system-config/public'),
}

export const roleplayApi = {
  getResult: (submissionId: string) => {
    const token = localStorage.getItem('token')
    return api.get(`/roleplay/sessions/${submissionId}`, { params: { token } })
  },
}

// ## TTS：直接用 fetch，需要拿回 Blob 再转 ObjectURL ──────────────────────
export const ttsApi = {
  synthesize: async (text: string): Promise<string> => {
    const token = localStorage.getItem('token')
    const resp = await fetch(`${api.defaults.baseURL}/tts/synthesize?text=${encodeURIComponent(text)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error('TTS failed')
    const blob = await resp.blob()
    return URL.createObjectURL(blob)
  },
}

export default api
