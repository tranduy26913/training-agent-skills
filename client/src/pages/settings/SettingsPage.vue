<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ t('settings.title') }}</h2>
        <p class="page-subtitle">{{ t('settings.overview') }}</p>
      </div>
    </div>
    <div class="surface-card flex min-h-80 flex-col items-center justify-center px-6 py-16 text-center">
      <div class="grid h-16 w-16 place-items-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-950/50 dark:text-primary-300 dark:ring-primary-900">
        <i class="pi pi-cog text-2xl"></i>
      </div>
      <h3 class="mt-5 text-lg font-bold text-surface-900 dark:text-surface-50">{{ t('settings.title') }}</h3>
      <p class="mt-2 max-w-md text-sm leading-6 text-surface-500 dark:text-surface-400">{{ t('common.comingSoon') }}</p>
    </div>
  </div>
</template>
