<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div>
    <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-4">{{ t('settings.title') }}</h2>
    <p class="text-surface-500">{{ t('settings.overview') }} - {{ t('common.comingSoon') }}</p>
  </div>
</template>
