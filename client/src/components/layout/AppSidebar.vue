<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@stores/auth.store';
import { useUiStore } from '@stores/ui.store';

const { t } = useI18n();
const authStore = useAuthStore();
const uiStore = useUiStore();
const { sidebarCollapsed, mobileSidebarOpen } = storeToRefs(uiStore);
const { isAdmin } = storeToRefs(authStore);

interface MenuItem {
  labelKey: string;
  icon: string;
  to: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    labelKey: 'sidebar.overview',
    icon: 'pi pi-home',
    to: '/dashboard',
  },
  {
    labelKey: 'sidebar.users',
    icon: 'pi pi-users',
    to: '/users',
    roles: ['admin'],
  },
  {
    labelKey: 'sidebar.vocabularies',
    icon: 'pi pi-book',
    to: '/vocabularies',
    roles: ['admin'],
  },
  {
    labelKey: 'sidebar.settings',
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

<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-surface-200/70 bg-surface-0/95 shadow-2xl shadow-surface-900/10 backdrop-blur-xl transition-all duration-300 ease-out dark:border-surface-800 dark:bg-surface-900/95 dark:shadow-black/30 md:translate-x-0 md:shadow-none"
    :class="[
      sidebarCollapsed ? 'w-[17.5rem] md:w-[5.25rem]' : 'w-[17.5rem]',
      mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <!-- Logo -->
    <div class="flex h-[4.5rem] items-center gap-3 border-b border-surface-200/70 px-5 dark:border-surface-800">
      <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-lg shadow-primary-500/25">
        <i class="pi pi-sparkles text-lg"></i>
      </div>
      <div class="min-w-0" :class="sidebarCollapsed ? 'md:hidden' : ''">
        <p class="truncate text-base font-extrabold tracking-tight text-surface-900 dark:text-white">
          {{ isAdmin ? t('sidebar.adminPanel') : t('sidebar.userPanel') }}
        </p>
        <p class="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-500">Control center</p>
      </div>
      <button type="button" class="icon-button ml-auto md:hidden" aria-label="Close navigation" @click="uiStore.closeMobileSidebar()">
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-5">
      <p class="mb-3 px-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-surface-400" :class="sidebarCollapsed ? 'md:hidden' : ''">Menu</p>
      <ul class="space-y-1.5">
        <li v-for="item in visibleMenuItems" :key="item.to">
          <router-link
            :to="item.to"
            class="group flex items-center gap-3 rounded-xl px-3 py-3 text-surface-600 transition-all duration-200 hover:bg-surface-100 hover:text-surface-950 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white"
            active-class="!bg-primary-50 !text-primary-700 font-semibold shadow-sm ring-1 ring-primary-100 dark:!bg-primary-950/50 dark:!text-primary-300 dark:ring-primary-900"
            @click="uiStore.closeMobileSidebar()"
          >
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-100 transition-colors group-hover:bg-surface-200 dark:bg-surface-800 dark:group-hover:bg-surface-700">
              <i :class="item.icon" class="text-base"></i>
            </span>
            <span class="text-sm" :class="sidebarCollapsed ? 'md:hidden' : ''">{{ t(item.labelKey) }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Collapse toggle -->
    <div class="hidden border-t border-surface-200 p-3 dark:border-surface-800 md:block">
      <button
        @click="uiStore.toggleSidebar()"
        class="flex w-full items-center justify-center rounded-xl py-2.5 text-surface-500 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
      >
        <i :class="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" class="text-lg"></i>
      </button>
    </div>
  </aside>
</template>
