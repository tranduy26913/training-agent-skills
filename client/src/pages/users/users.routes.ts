import type { RouteRecordRaw } from 'vue-router';

export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'UserList',
        component: () => import('./UserListPage.vue'),
        meta: { title: 'Users', breadcrumb: 'Users' },
      },
    ],
  },
];
