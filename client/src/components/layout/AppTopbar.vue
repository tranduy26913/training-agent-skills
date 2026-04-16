<template>
  <header class="h-16 bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6">
    <!-- Left: Page title -->
    <div>
      <h1 class="text-lg font-semibold text-surface-800 dark:text-surface-100">
        {{ currentTitle }}
      </h1>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-4">
      <!-- Dark mode toggle -->
      <button
        @click="uiStore.toggleDarkMode()"
        class="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        :title="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <i :class="darkMode ? 'pi pi-sun' : 'pi pi-moon'" class="text-lg"></i>
      </button>

      <!-- User info & logout -->
      <div class="flex items-center gap-3">
        <div class="text-right">
          <p class="text-sm font-medium text-surface-700 dark:text-surface-200">{{ user?.name }}</p>
          <p class="text-xs text-surface-400 capitalize">{{ user?.role }}</p>
        </div>
        <button
          @click="handleLogout"
          class="p-2 rounded-lg text-surface-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
          title="Logout"
        >
          <i class="pi pi-sign-out text-lg"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const { user } = storeToRefs(authStore);
const { darkMode } = storeToRefs(uiStore);

const currentTitle = computed(() => {
  return (route.meta.title as string) || 'Dashboard';
});

function handleLogout(): void {
  authStore.logout();
  router.push('/login');
}
</script>
