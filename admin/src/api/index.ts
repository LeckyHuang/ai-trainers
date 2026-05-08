// ## Axios 实例配置 ────────────────────────────────────────────────────────
import axios from 'axios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 60000,
})

// ## 请求拦截：自动附加 Bearer Token ──────────────────────────────────────
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ## 响应拦截：401 自动跳转登录 ────────────────────────────────────────────
api.interceptors.response.use(
  (res: any) => res.data,
  (err: any) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/#/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export default api

// ## API 模块 ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
}

export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

export const filesApi = {
  list: (params?: any) => api.get('/files', { params }),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/files/upload', form)
  },
  delete: (id: string) => api.delete(`/files/${id}`),
  downloadUrl: (id: string) => {
    const token = localStorage.getItem('access_token') || ''
    return `${api.defaults.baseURL}/files/${id}/download?token=${encodeURIComponent(token)}`
  },
}

export const banksApi = {
  list: (params?: any) => api.get('/question-banks', { params }),
  get: (id: string) => api.get(`/question-banks/${id}`),
  create: (data: any) => api.post('/question-banks', data),
  update: (id: string, data: any) => api.put(`/question-banks/${id}`, data),
  delete: (id: string) => api.delete(`/question-banks/${id}`),
  listQuestions: (bankId: string, params?: any) =>
    api.get(`/question-banks/${bankId}/questions`, { params }),
  createQuestion: (bankId: string, data: any) =>
    api.post(`/question-banks/${bankId}/questions`, data),
  updateQuestion: (_bankId: string, qid: string, data: any) =>
    api.put(`/question-banks/questions/${qid}`, data),
  deleteQuestion: (_bankId: string, qid: string) =>
    api.delete(`/question-banks/questions/${qid}`),
  generate: (id: string, data: any) =>
    api.post(`/question-banks/${id}/generate`, data),
  generateFromFile: (id: string, data: { file_id: string; question_count?: number }) =>
    api.post(`/question-banks/${id}/generate-from-file`, data),
}

export const personasApi = {
  list: (params?: any) => api.get('/personas', { params }),
  get: (id: string) => api.get(`/personas/${id}`),
  create: (data: any) => api.post('/personas', data),
  update: (id: string, data: any) => api.put(`/personas/${id}`, data),
  delete: (id: string) => api.delete(`/personas/${id}`),
  generateCard: (id: string) => api.post(`/personas/${id}/generate-card`),
  generateAvatar: (id: string) => api.post(`/personas/${id}/generate-avatar`),
  tryChat: (id: string, messages: {role: string; content: string}[]) =>
    api.post(`/personas/${id}/try-chat`, { messages }),
}

export const ttsApi = {
  voices: () => api.get('/tts/voices'),
  // 试听：通过 axios 带认证 header 请求，返回 arraybuffer 用于播放
  preview: (voiceId: string, text = '你好，我是这个角色的声音，请多关照。') =>
    api.get('/tts/synthesize', {
      params: { voice_id: voiceId, text },
      responseType: 'arraybuffer',
    }),
}

export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  publish: (id: string, data: { user_ids: string[] }) =>
    api.post(`/tasks/${id}/publish`, data),
  getProgress: (id: string) => api.get(`/tasks/${id}/progress`),
  getProgressDetail: (id: string) => api.get(`/tasks/${id}/progress-detail`),
  updateAssociations: (id: string, data: { material_ids?: string[]; bank_ids?: string[]; persona_ids?: string[] }) =>
    api.put(`/tasks/${id}/associations`, data),
  getDimensionStats: (id: string) => api.get(`/tasks/${id}/dimension-stats`),
}

export const systemConfigApi = {
  getAll: () => api.get('/system-config'),
  update: (key: string, data: { value: string }) => api.put(`/system-config/${key}`, data),
  getAuditLogs: (params?: any) => api.get('/audit-logs', { params }),
}

export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: number | string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}
