<template>
  <aside
    class="fixed left-0 top-0 h-full bg-surface-0 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 z-50 transition-all duration-300 flex flex-col"
    :class="sidebarCollapsed ? 'w-16' : 'w-64'"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center justify-center border-b border-surface-200 dark:border-surface-700 px-4">
      <span v-if="!sidebarCollapsed" class="text-xl font-bold text-primary">
        {{ isAdmin ? 'Admin Panel' : 'User Panel' }}
      </span>
      <span v-else class="text-xl font-bold text-primary">
        {{ isAdmin ? 'A' : 'U' }}
      </span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4">
      <ul class="space-y-1 px-2">
        <li v-for="item in visibleMenuItems" :key="item.to">
          <router-link
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            active-class="!bg-primary/10 !text-primary font-semibold"
          >
            <i :class="item.icon" class="text-lg" style="min-width: 24px; text-align: center;"></i>
            <span v-if="!sidebarCollapsed" class="text-sm">{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Collapse toggle -->
    <div class="border-t border-surface-200 dark:border-surface-700 p-2">
      <button
        @click="uiStore.toggleSidebar()"
        class="w-full flex items-center justify-center py-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
      >
        <i :class="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" class="text-lg"></i>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';

const authStore = useAuthStore();
const uiStore = useUiStore();
const { sidebarCollapsed } = storeToRefs(uiStore);
const { isAdmin } = storeToRefs(authStore);

interface MenuItem {
  label: string;
  icon: string;
  to: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Overview',
    icon: 'pi pi-home',
    to: '/dashboard',
  },
  {
    label: 'Users',
    icon: 'pi pi-users',
    to: '/users',
    roles: ['admin'],
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    to: '/settings',
  },
];

const visibleMenuItems = computed(() => {
  return menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(authStore.userRole);
  });
});
</script>
