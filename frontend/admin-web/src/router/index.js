import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import Layout from '../layout/Layout.vue'

import DashboardView from '../views/DashboardView.vue'
import TenantView from '../views/TenantView.vue'
import ContractView from '../views/ContractView.vue'
import WorkOrderView from '../views/WorkOrderView.vue'
import NoticeView from '../views/NoticeView.vue'
import UtilityView from '../views/UtilityView.vue'
import HouseView from '../views/HouseView.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: 'dashboard',
        component: DashboardView,
      },
      {
        path: 'tenants',
        component: TenantView,
      },
      {
        path: 'contracts',
        component: ContractView,
      },
      {
        path: 'work-orders',
        component: WorkOrderView,
      },
      {
        path: 'notices',
        component: NoticeView,
      },
      {
        path: 'utilities',
        component: UtilityView,
      },
      {
        path: 'houses',
        component: HouseView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const adminUser = localStorage.getItem('admin_user')

  if (to.name !== 'login' && !adminUser) {
    return '/'
  }

  if (to.name === 'login' && adminUser) {
    return '/dashboard'
  }

  return true
})

export default router
