import type { RouteRecordRaw } from 'vue-router';

export const notebooklmWorkspaceRoutes: RouteRecordRaw[] = [
  {
    path: '/notebooklm',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'NotebooklmWorkspaceList',
        component: () => import('./WorkspaceListPage.vue'),
        meta: { title: 'NotebookLM Workspaces' },
      },
      {
        path: 'create',
        name: 'NotebooklmWorkspaceCreate',
        component: () => import('./WorkspaceCreatePage.vue'),
        meta: { title: 'Create NotebookLM Workspace' },
      },
      {
        path: ':id/edit',
        name: 'NotebooklmWorkspaceEdit',
        component: () => import('./WorkspaceEditPage.vue'),
        meta: { title: 'Edit NotebookLM Workspace' },
      },
    ],
  },
];
