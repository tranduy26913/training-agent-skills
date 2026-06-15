<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { AnalyticsData } from '@/types/vocabularies.types';

const { t } = useI18n();

// Props
defineProps<{
  analytics: AnalyticsData | null;
}>();
</script>

<template>
  <div v-if="analytics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Learn Count -->
    <div class="p-4 bg-surface-50 dark:bg-surface-900 rounded-lg shadow-sm">
      <div class="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">
        {{ t('vocab.label.learn_count') }}
      </div>
      <div class="text-3xl font-bold text-surface-900 dark:text-surface-100">
        {{ analytics.learn_count }}
      </div>
    </div>

    <!-- Favorite Count -->
    <div class="p-4 bg-surface-50 dark:bg-surface-900 rounded-lg shadow-sm">
      <div class="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">
        {{ t('vocab.label.favorite_count') }}
      </div>
      <div class="text-3xl font-bold text-surface-900 dark:text-surface-100">
        {{ analytics.favorite_count }}
      </div>
    </div>

    <!-- Report Count -->
    <div class="p-4 bg-surface-50 dark:bg-surface-900 rounded-lg shadow-sm">
      <div class="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">
        {{ t('vocab.label.report_count') }}
      </div>
      <div class="text-3xl font-bold text-surface-900 dark:text-surface-100">
        {{ analytics.report_count }}
      </div>
    </div>

    <!-- Relation Count -->
    <div class="p-4 bg-surface-50 dark:bg-surface-900 rounded-lg shadow-sm">
      <div class="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">
        {{ t('vocab.label.relation_count') }}
      </div>
      <div class="text-3xl font-bold text-surface-900 dark:text-surface-100">
        {{ analytics.relation_count }}
      </div>
    </div>
  </div>
  <div v-else class="text-center py-8 text-surface-500">
    {{ t('vocab.noAnalyticsData') }}
  </div>
</template>
