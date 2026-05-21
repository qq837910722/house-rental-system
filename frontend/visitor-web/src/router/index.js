import { createRouter, createWebHistory } from 'vue-router'
import VisitorHomeView from '../views/VisitorHomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'visitor-home',
      component: VisitorHomeView,
    },
  ],
})

export default router