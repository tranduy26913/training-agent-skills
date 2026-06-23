import type { RouteRecordRaw } from 'vue-router';

// Profile route definition.
export const profileRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    component: () => import('@layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('./ProfilePage.vue'),
        meta: { title: 'Profile', titleKey: 'profile.title' },
      },
    ],
  },
];
