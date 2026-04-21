<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const { user } = storeToRefs(authStore);
const { darkMode } = storeToRefs(uiStore);

/** Resolve page title from route meta key / ルートメタからページタイトルを解決 */
const currentTitle = computed(() => {
  const metaKey = route.meta.titleKey as string | undefined;
  if (metaKey) return t(metaKey);
  return (route.meta.title as string) || t('common.dashboard');
});

function handleLogout(): void {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <header class="h-16 bg-surface-0 dark:bg-surface-900 flex items-center justify-between px-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] z-40 relative">
    <!-- Left: Page title / ページタイトル -->
    <div>
      <h1 class="text-lg font-semibold text-surface-800 dark:text-surface-100">
        {{ currentTitle }}
      </h1>
    </div>

    <!-- Right: Actions / アクションエリア -->
    <div class="flex items-center gap-4">
      <!-- Language switcher / 言語切替 -->
      <LanguageSwitcher />

      <!-- Dark mode toggle / ダークモード切替 -->
      <button
        @click="uiStore.toggleDarkMode()"
        class="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        :title="darkMode ? t('topbar.lightMode') : t('topbar.darkMode')"
      >
        <i :class="darkMode ? 'pi pi-sun' : 'pi pi-moon'" class="text-lg"></i>
      </button>

      <!-- User info & logout / ユーザー情報＆ログアウト -->
      <div class="flex items-center gap-3">
        <div class="text-right">
          <p class="text-sm font-medium text-surface-700 dark:text-surface-200">{{ user?.name }}</p>
          <p class="text-xs text-surface-400 capitalize">{{ user?.role }}</p>
        </div>
        <button
          @click="handleLogout"
          class="p-2 rounded-lg text-surface-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
          :title="t('auth.logout')"
        >
          <i class="pi pi-sign-out text-lg"></i>
        </button>
      </div>
    </div>
  </header>
</template>
