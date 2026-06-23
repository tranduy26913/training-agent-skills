// Projects module route definitions.
import type { RouteRecordRaw } from 'vue-router';

export const projectRoutes: RouteRecordRaw[] = [
  {
    path: '/projects',
    component: () => import('@layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'ProjectList',
        component: () => import('./ProjectListPage.vue'),
        meta: { title: 'Quản lý Project', titleKey: 'projects.title', breadcrumb: 'Projects' },
      },
      {
        path: ':id',
        name: 'ProjectDetail',
        component: () => import('./ProjectDetailPage.vue'),
        meta: { title: 'Chi tiết Project', titleKey: 'projects.detail' },
      },
    ],
  },
];
