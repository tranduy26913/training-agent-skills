import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    title?: string;
    breadcrumb?: string;
    roles?: string[];
  }
}
