<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUiStore } from '@stores/ui.store';
import LanguageSwitcher from '@components/layout/LanguageSwitcher.vue';
import UserAvatarDropdown from '@components/layout/UserAvatarDropdown.vue';

const { t } = useI18n();
const route = useRoute();
const uiStore = useUiStore();
const { darkMode } = storeToRefs(uiStore);

// Resolve page title from route meta key.
const currentTitle = computed(() => {
  const metaKey = route.meta.titleKey as string | undefined;
  if (metaKey) return t(metaKey);
  return (route.meta.title as string) || t('common.dashboard');
});
</script>

<template>
  <header class="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-surface-200/70 bg-surface-0/85 px-4 backdrop-blur-xl dark:border-surface-800/80 dark:bg-surface-900/85 sm:px-6 lg:px-8">
    <!-- Left: Page title -->
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="icon-button md:hidden"
        aria-label="Open navigation"
        @click="uiStore.toggleMobileSidebar()"
      >
        <i class="pi pi-bars"></i>
      </button>
      <div class="min-w-0">
        <p class="mb-0.5 hidden text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary-500 sm:block">Workspace</p>
        <h1 class="truncate text-lg font-bold tracking-tight text-surface-900 dark:text-surface-50 sm:text-xl">
        {{ currentTitle }}
        </h1>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-1.5 sm:gap-3">
      <!-- Language switcher -->
      <LanguageSwitcher />

      <!-- Dark mode toggle -->
      <button
        @click="uiStore.toggleDarkMode()"
        class="icon-button"
        :title="darkMode ? t('topbar.lightMode') : t('topbar.darkMode')"
      >
        <i :class="darkMode ? 'pi pi-sun' : 'pi pi-moon'" class="text-lg"></i>
      </button>

      <!-- User avatar dropdown -->
      <UserAvatarDropdown />
    </div>
  </header>
</template>
