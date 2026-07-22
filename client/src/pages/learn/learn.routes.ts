import type { RouteRecordRaw } from 'vue-router';

export const learnRoutes: RouteRecordRaw[] = [
  {
    path: '/learn',
    component: () => import('@layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/learn/levels',
      },
      {
        path: 'levels',
        name: 'LearningLevels',
        component: () => import('./LearningLevelsPage.vue'),
        meta: { titleKey: 'learning.title' },
      },
      {
        path: 'levels/:level',
        name: 'LearningLessons',
        component: () => import('./LearningLevelsPage.vue'),
        meta: { titleKey: 'learning.lessons' },
      },
      {
        path: 'lessons/:id',
        name: 'LearningLesson',
        component: () => import('./LessonPage.vue'),
        meta: { titleKey: 'learning.lessons' },
      },
      {
        path: 'flashcards/:id',
        name: 'Flashcards',
        component: () => import('./FlashcardPage.vue'),
        meta: { titleKey: 'learning.studyCards' },
      },
      {
        path: 'review',
        name: 'Review',
        component: () => import('./ReviewPage.vue'),
        meta: { titleKey: 'learning.review' },
      },
      {
        path: 'review/:id',
        name: 'ReviewPlayer',
        component: () => import('./ReviewPlayerPage.vue'),
        meta: { titleKey: 'learning.review' },
      },
    ],
  },
];
