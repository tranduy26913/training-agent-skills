import { authRoutes } from '@/pages/auth/auth.routes';
import { dashboardRoutes } from '@/pages/dashboard/dashboard.routes';
import { userRoutes } from '@/pages/users/users.routes';
import { settingsRoutes } from '@/pages/settings/settings.routes';
import { profileRoutes } from '@/pages/profile/profile.routes';
import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  ...authRoutes,
  ...dashboardRoutes,
  ...userRoutes,
  ...settingsRoutes,
  ...profileRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];