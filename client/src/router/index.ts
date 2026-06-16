import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Debug: Log all registered routes
router.getRoutes().forEach(route => {
  console.log('[Router] Registered route:', {
    path: route.path,
    name: route.name,
    meta: route.meta,
  });
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  console.log('[Router Guard]', {
    to: to.path,
    token: token ? 'exists' : 'missing',
    user: user,
    requiresAuth: to.meta.requiresAuth,
    roles: to.meta.roles,
  });

  // Redirect to login if auth required and not logged in
  if (to.meta.requiresAuth && !token) {
    console.log('[Router Guard] Redirecting to login - no token');
    next({ name: 'Login' });
    return;
  }

  // Redirect to dashboard if already logged in and going to login
  if (to.name === 'Login' && token) {
    console.log('[Router Guard] Redirecting to dashboard - already logged in');
    next({ name: 'Dashboard' });
    return;
  }

  // Role-based access control
  if (to.meta.roles && user) {
    const parsed = JSON.parse(user);
    const allowedRoles = to.meta.roles as string[];
    console.log('[Router Guard] Role check', {
      userRole: parsed.role,
      parsed: parsed,
      allowedRoles,
      allowed: allowedRoles.includes(parsed.role),
    });
    if (!allowedRoles.includes(parsed.role)) {
      console.log('[Router Guard] Redirecting to dashboard - role not allowed');
      next({ name: 'Dashboard' });
      return;
    }
  }

  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} | App`;
  }

  console.log('[Router Guard] Allowing navigation');
  next();
});
