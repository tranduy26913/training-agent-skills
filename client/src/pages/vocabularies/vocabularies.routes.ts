import type { RouteRecordRaw } from 'vue-router';

export const vocabularyRoutes: RouteRecordRaw[] = [
  {
    path: '/vocabularies',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'VocabularyList',
        component: () => import('./VocabularyListPage.vue'),
        meta: { title: 'Vocabulary', titleKey: 'vocab.pageTitle', breadcrumb: 'Vocabulary' },
      },
      {
        path: 'create',
        name: 'VocabularyCreate',
        component: () => import('./VocabularyCreatePage.vue'),
        meta: { title: 'Create Vocabulary', titleKey: 'vocab.createTitle' },
      },
      {
        path: ':id/edit',
        name: 'VocabularyEdit',
        component: () => import('./VocabularyEditPage.vue'),
        meta: { title: 'Edit Vocabulary', titleKey: 'vocab.editTitle' },
      },
    ],
  },
];
