import type { RouteRecordRaw } from 'vue-router';

export const notebooklmOperationsRoutes: RouteRecordRaw[] = [
  {
    path: '/notebooklm/jobs',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'NotebooklmJobMonitor',
        component: () => import('./JobMonitorListPage.vue'),
        meta: { title: 'NotebookLM Operations', breadcrumb: 'NotebookLM Jobs' },
      },
      {
        path: ':id/retry',
        name: 'NotebooklmJobRetryCreate',
        component: () => import('./RetryRequestCreatePage.vue'),
        meta: { title: 'Retry NotebookLM Job' },
      },
      {
        path: 'dlq/:id/edit',
        name: 'NotebooklmDlqItemEdit',
        component: () => import('./DlqItemEditPage.vue'),
        meta: { title: 'Edit DLQ Item' },
      },
    ],
  },
];
