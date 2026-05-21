import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import TenantLayout from '../layout/TenantLayout.vue'
import TenantHomeView from '../views/TenantHomeView.vue'
import MyContractView from '../views/MyContractView.vue'
import MyUtilitiesView from '../views/MyUtilitiesView.vue'
import MyNoticesView from '../views/MyNoticesView.vue'
import MyWorkOrdersView from '../views/MyWorkOrdersView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: TenantLayout,
      children: [
        {
          path: 'home',
          name: 'tenant-home',
          component: TenantHomeView,
        },
        {
          path: 'my-contract',
          name: 'my-contract',
          component: MyContractView,
        },
        {
          path: 'my-utilities',
          name: 'my-utilities',
          component: MyUtilitiesView,
        },
        {
          path: 'my-notices',
          name: 'my-notices',
          component: MyNoticesView,
        },
        {
        path: 'my-work-orders',
        name: 'my-work-orders',
        component: MyWorkOrdersView,
        },
      ],
    },
  ],
})

export default router