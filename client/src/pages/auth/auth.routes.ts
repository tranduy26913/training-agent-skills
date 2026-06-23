import type { RouteRecordRaw } from 'vue-router';

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('./LoginPage.vue'),
        meta: { title: 'Login', titleKey: 'auth.loginTitle' },
      },
    ],
  },
];
