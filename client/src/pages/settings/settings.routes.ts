import type { RouteRecordRaw } from 'vue-router';

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Settings',
        component: () => import('./SettingsPage.vue'),
        meta: { title: 'Settings', breadcrumb: 'Settings' },
      },
    ],
  },
];
