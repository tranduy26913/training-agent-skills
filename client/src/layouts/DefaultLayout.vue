<template>
  <div class="app-shell min-h-screen bg-surface-50 dark:bg-surface-950">
    <!-- Toast notifications -->
    <Toast />

    <!-- Sidebar -->
    <AppSidebar />

    <button
      v-if="mobileSidebarOpen"
      type="button"
      class="fixed inset-0 z-40 bg-surface-950/45 backdrop-blur-sm md:hidden"
      aria-label="Close navigation"
      @click="uiStore.closeMobileSidebar()"
    />

    <!-- Main content -->
    <div
      class="flex min-h-screen min-w-0 flex-col overflow-x-hidden transition-[margin] duration-300 ease-out"
      :class="sidebarCollapsed ? 'md:ml-[5.25rem]' : 'md:ml-[17.5rem]'"
    >
      <!-- Topbar -->
      <AppTopbar />

      <!-- Page content -->
      <main class="relative flex-1 bg-transparent px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div class="mx-auto w-full max-w-[1600px]">
          <router-view />
        </div>

        <Transition name="loading-fade">
          <div
            v-if="isLoading"
            class="absolute inset-0 z-30 flex items-center justify-center bg-surface-50/75 backdrop-blur-[2px] dark:bg-surface-950/75"
            role="status"
            aria-live="polite"
            :aria-label="t('common.loading')"
          >
            <div class="loading-indicator">
              <ProgressSpinner class="!h-12 !w-12" stroke-width="4" />
              <span class="text-sm font-semibold text-surface-700 dark:text-surface-200">
                {{ t('common.loading') }}
              </span>
            </div>
          </div>
        </Transition>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@stores/ui.store';
import AppSidebar from '@components/layout/AppSidebar.vue';
import AppTopbar from '@components/layout/AppTopbar.vue';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';

const { t } = useI18n();
const uiStore = useUiStore();
const { sidebarCollapsed, mobileSidebarOpen, isLoading } = storeToRefs(uiStore);
</script>
