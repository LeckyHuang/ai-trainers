// ## 路由配置（Hash 模式，兼容静态文件部署）──────────────────────────────
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/LoginView.vue') },

    // ## 超管路由（/sa/*）
    {
      path: '/sa',
      component: () => import('@/layouts/SuperadminLayout.vue'),
      children: [
        { path: '', redirect: '/sa/dashboard' },
        { path: 'dashboard', component: () => import('@/views/sa/PlatformDashboardView.vue') },
        { path: 'tenants', component: () => import('@/views/sa/TenantsView.vue') },
        { path: 'config', component: () => import('@/views/sa/SystemConfigView.vue') },
        { path: 'audit', component: () => import('@/views/sa/AuditLogView.vue') },
      ],
    },

    // ## 企业管理员路由（/*）
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'users', component: () => import('@/views/UsersView.vue') },
        { path: 'files', component: () => import('@/views/FilesView.vue') },
        { path: 'question-banks', component: () => import('@/views/QuestionBanksView.vue') },
        { path: 'question-banks/:id', component: () => import('@/views/QuestionBankDetailView.vue') },
        { path: 'personas', component: () => import('@/views/PersonasView.vue') },
        { path: 'tasks', component: () => import('@/views/TasksView.vue') },
        { path: 'tasks/create', component: () => import('@/views/TaskCreateView.vue') },
        { path: 'tasks/:id', component: () => import('@/views/TaskDetailView.vue') },
        { path: 'notifications', component: () => import('@/views/NotificationsView.vue') },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

// ## 路由守卫：登录态 & 角色权限 ──────────────────────────────────────────
router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')
  const userStr = localStorage.getItem('user')

  if (!token) {
    if (to.path !== '/login') return '/login'
    return true
  }

  if (to.path === '/login') {
    const user = userStr ? JSON.parse(userStr) : null
    return user?.role === 'superadmin' ? '/sa/dashboard' : '/dashboard'
  }

  const user = userStr ? JSON.parse(userStr) : null
  const isSuperadmin = user?.role === 'superadmin'

  if (isSuperadmin && !to.path.startsWith('/sa')) return '/sa/dashboard'
  if (!isSuperadmin && to.path.startsWith('/sa')) return '/dashboard'

  return true
})

export default router
