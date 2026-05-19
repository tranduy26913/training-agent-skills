/**
 * NotebookLM Chat Routes
 * チャット機能のルート定義
 */
import type { RouteRecordRaw } from 'vue-router';

export const notebooklmChatRoutes: RouteRecordRaw[] = [
  {
    path: '/notebooklm/workspaces/:workspaceId/chat',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'NotebooklmChatSessionList',
        component: () => import('./ChatSessionListPage.vue'),
        meta: { title: 'Chat Sessions' },
      },
      {
        path: 'create',
        name: 'NotebooklmChatSessionCreate',
        component: () => import('./ChatSessionCreatePage.vue'),
        meta: { title: 'New Chat Session' },
      },
      {
        path: ':sessionId',
        name: 'NotebooklmChatSessionEdit',
        component: () => import('./ChatSessionEditPage.vue'),
        meta: { title: 'Chat Session' },
      },
    ],
  },
];
