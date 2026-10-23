import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '@/features/auth/AuthView.vue'
import { getSession } from '@/features/auth/auth.service'
import DashboardView from '@/features/dashboard'
import OwnerDashboardView from '@/features/dashboard/OwnerDashboardView.vue'
import HistoryView from '@/features/dashboard/HistoryView.vue'
import CashierView from '@/features/sales/CashierView.vue'
import CashierManagementView from '@/features/admin/CashierManagementView.vue'
import OwnerReportsView from '@/features/reports/OwnerReportsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'login' },
    },
    {
      path: '/login',
      name: 'login',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: AuthView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      meta: { requiresAuth: true, roles: ['owner'] },
      component: OwnerDashboardView,
    },
    {
      path: '/history',
      name: 'history',
      meta: { requiresAuth: true, roles: ['owner', 'cashier'] },
      component: HistoryView,
    },
    {
      path: '/cashier',
      name: 'cashier',
      meta: { requiresAuth: true, roles: ['cashier'] },
      component: CashierView,
    },
    {
      path: '/admin/products',
      name: 'product-management',
      meta: { requiresAuth: true, roles: ['owner'] },
      component: DashboardView,
    },
    {
      path: '/admin/cashiers',
      name: 'cashier-management',
      meta: { requiresAuth: true, roles: ['owner'] },
      component: CashierManagementView,
    },
    {
      path: '/owner/reports',
      name: 'owner-reports',
      redirect: { name: 'dashboard' },
    },
    {
      path: '/register',
      name: 'register',
      component: AuthView,
    },
  ],
})

router.beforeEach((to) => {
  const session = getSession()
  if (to.meta.requiresAuth && !session) return { name: 'login' }
  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && session && !allowedRoles.includes(session.role)) {
    return { name: session.role === 'owner' ? 'dashboard' : 'cashier' }
  }
  return true
})

export default router
