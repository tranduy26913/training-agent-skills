import type { RouteRecordRaw } from 'vue-router';

export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    component: () => import('@layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'UserList',
        component: () => import('./UserListPage.vue'),
        meta: { title: 'Users', titleKey: 'users.title', breadcrumb: 'Users' },
      },
      {
        path: 'create',
        name: 'UserCreate',
        component: () => import('./UserCreatePage.vue'),
        meta: { title: 'Create User', titleKey: 'users.createUser' },
      },
      {
        path: ':id/edit',
        name: 'UserEdit',
        component: () => import('./UserEditPage.vue'),
        meta: { title: 'Edit User', titleKey: 'users.editUser' },
      },
    ],
  },
];
