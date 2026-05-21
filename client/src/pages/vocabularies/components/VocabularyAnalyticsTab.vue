<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { VocabularyAnalytics } from '../composables/useVocabularies';

const { t } = useI18n();

// Props / プロパティ定義
const props = defineProps<{
  analytics?: VocabularyAnalytics | null;
  loading?: boolean;
}>();
</script>

<template>
  <div class="space-y-4 p-4" data-testid="vocab-analytics-tab">
    <div v-if="loading" class="text-sm text-surface-500">
      Loading...
    </div>
    <div v-else class="grid grid-cols-2 gap-4">
      <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg text-center">
        <div class="text-3xl font-bold text-primary mb-1">
          {{ analytics?.learn_count ?? 0 }}
        </div>
        <div class="text-sm text-surface-500">{{ t('vocab.learnCount') }}</div>
      </div>
      <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg text-center">
        <div class="text-3xl font-bold text-primary mb-1">
          {{ analytics?.favorite_count ?? 0 }}
        </div>
        <div class="text-sm text-surface-500">{{ t('vocab.favoriteCount') }}</div>
      </div>
    </div>
  </div>
</template>
