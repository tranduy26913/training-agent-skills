import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard: auth check, role-based access, and page title.
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  // Redirect to login if auth required and not logged in.
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' });
    return;
  }

  // Redirect to dashboard if already logged in and going to login.
  if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' });
    return;
  }

  // Role-based access control.
  if (to.meta.roles && user) {
    const parsed = JSON.parse(user);
    const allowedRoles = to.meta.roles as string[];
    if (!allowedRoles.includes(parsed.role)) {
      next({ name: 'Dashboard' });
      return;
    }
  }

  // Set page title.
  if (to.meta.title) {
    document.title = `${to.meta.title} | App`;
  }

  next();
});