import type { RouteRecordRaw } from 'vue-router';

export const vocabulariesRoutes: RouteRecordRaw[] = [
  {
    path: '/vocabularies',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'VocabularyList',
        component: () => import('./VocabularyListPage.vue'),
        meta: { title: 'Vocabulary Management', titleKey: 'vocab.title', breadcrumb: 'Vocabularies' },
      },
      {
        path: 'create',
        name: 'VocabularyCreate',
        component: () => import('./VocabularyFormPage.vue'),
        meta: { title: 'Create Vocabulary', titleKey: 'vocab.createVocabulary' },
      },
      {
        path: ':id/edit',
        name: 'VocabularyEdit',
        component: () => import('./VocabularyFormPage.vue'),
        meta: { title: 'Edit Vocabulary', titleKey: 'vocab.editVocabulary' },
      },
    ],
  },
];
