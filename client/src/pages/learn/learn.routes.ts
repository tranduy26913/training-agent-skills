// 学習ルート定義 / FlashCard learning module routes
import type { RouteRecordRaw } from 'vue-router';

export const learnRoutes: RouteRecordRaw[] = [
  {
    path: '/learn',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['user'] },
    children: [
      {
        path: '',
        name: 'LearnLevel',
        component: () => import('./LearnLevelPage.vue'),
        meta: { title: '学習レベル選択 / Choose Level', breadcrumb: '学習' },
      },
      {
        path: ':level/list',
        name: 'LearnVocabList',
        component: () => import('./LearnVocabListPage.vue'),
        meta: { title: '語彙一覧 / Vocabulary List' },
      },
      {
        path: ':level/session',
        name: 'LearnSession',
        component: () => import('./LearnSessionPage.vue'),
        meta: { title: 'フラッシュカード / Flashcard Session' },
      },
    ],
  },
];
