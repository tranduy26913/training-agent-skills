import type { RouteRecordRaw } from 'vue-router';

// 従業員管理ルート定義 / Employee management route definitions (lazy-loaded, admin-only)
export const employeeRoutes: RouteRecordRaw[] = [
  {
    path: '/employees',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'EmployeeList',
        component: () => import('./EmployeeListPage.vue'),
        meta: { title: 'Employees', titleKey: 'employees.title', breadcrumb: 'Employees' },
      },
      {
        path: 'create',
        name: 'EmployeeCreate',
        component: () => import('./EmployeeCreatePage.vue'),
        meta: { title: 'Create Employee', titleKey: 'employees.createEmployee' },
      },
      {
        path: ':id/edit',
        name: 'EmployeeEdit',
        component: () => import('./EmployeeEditPage.vue'),
        meta: { title: 'Edit Employee', titleKey: 'employees.editEmployee' },
      },
    ],
  },
];
