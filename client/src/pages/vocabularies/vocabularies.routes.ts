import type { RouteRecordRaw } from 'vue-router';

export const vocabularyRoutes: RouteRecordRaw[] = [
  {
    path: '/vocabularies',
    component: () => import('@layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'VocabularyList',
        component: () => import('./VocabularyListPage.vue'),
        meta: { title: 'Vocabularies', breadcrumb: 'Vocabularies' },
      },
      {
        path: 'create',
        name: 'VocabularyCreate',
        component: () => import('./VocabularyFormPage.vue'),
        meta: { title: 'Create Vocabulary', breadcrumb: 'Create Vocabulary' },
      },
      {
        path: ':id/edit',
        name: 'VocabularyEdit',
        component: () => import('./VocabularyFormPage.vue'),
        meta: { title: 'Edit Vocabulary', breadcrumb: 'Edit Vocabulary' },
      },
    ],
  },
];
