// ## 路由配置（Hash 模式，兼容静态文件部署）──────────────────────────────
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/LoginView.vue') },

    // ## 带底部导航的主布局路由
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        { path: '', redirect: '/home' },
        { path: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'notifications', component: () => import('@/views/NotificationsView.vue') },
        { path: 'profile', component: () => import('@/views/ProfileView.vue') },
        { path: 'tasks/:id', component: () => import('@/views/TaskDetailView.vue') },
        { path: 'tasks/:id/role-select', component: () => import('@/views/RoleSelectView.vue') },
        { path: 'qa/:submissionId/result', component: () => import('@/views/QaResultView.vue') },
        { path: 'roleplay/:submissionId/result', component: () => import('@/views/RoleplayResultView.vue') },
      ],
    },

    // ## 全屏路由（无底部导航）
    { path: '/tasks/:id/pdf', component: () => import('@/views/PdfReaderView.vue') },
    { path: '/tasks/:id/qa', component: () => import('@/views/QaSessionView.vue') },
    { path: '/tasks/:id/roleplay', component: () => import('@/views/RoleplayView.vue') },
    { path: '/tasks/:id/exam', component: () => import('@/views/ExamView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
})

// ## 路由守卫：未登录强制跳转 ──────────────────────────────────────────────
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path !== '/login' && !auth.isLoggedIn) return '/login'
})

export default router
