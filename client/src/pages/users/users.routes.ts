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
      {
        path: 'create',
        name: 'UserCreate',
        component: () => import('./UserCreatePage.vue'),
        meta: { title: 'Create User' },
      },
      {
        path: ':id/edit',
        name: 'UserEdit',
        component: () => import('./UserEditPage.vue'),
        meta: { title: 'Edit User' },
      },
    ],
  },
];
