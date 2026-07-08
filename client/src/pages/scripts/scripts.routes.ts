import type { RouteRecordRaw } from 'vue-router';

export const scriptRoutes: RouteRecordRaw[] = [
  {
    path: '/projects/:projectId/scripts',
    component: () => import('@layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'ScriptList',
        component: () => import('./ScriptListPage.vue'),
        meta: { title: 'Scripts', breadcrumb: 'Scripts' },
      },
      {
        path: 'create',
        name: 'ScriptCreate',
        component: () => import('./ScriptFormPage.vue'),
        meta: { title: 'Create Script', breadcrumb: 'Create Script' },
      },
      {
        path: ':scriptId/edit',
        name: 'ScriptEdit',
        component: () => import('./ScriptFormPage.vue'),
        meta: { title: 'Edit Script', breadcrumb: 'Edit Script' },
      },
    ],
  },
];
