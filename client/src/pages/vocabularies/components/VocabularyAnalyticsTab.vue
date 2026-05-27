<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props - analytics stats from vocabulary / 語彙のアナリティクス統計
const props = defineProps<{
  learnCount: number;
  favoriteCount: number;
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 学習回数 / Learn count card -->
    <div class="flex flex-col gap-1 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
      <span class="text-sm text-surface-500">{{ t('vocabularies.analytics.learnCount') }}</span>
      <span class="text-3xl font-bold text-primary" data-testid="analytics-learn-count">
        {{ learnCount }}
      </span>
    </div>

    <!-- お気に入り回数 / Favorite count card -->
    <div class="flex flex-col gap-1 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
      <span class="text-sm text-surface-500">{{ t('vocabularies.analytics.favoriteCount') }}</span>
      <span class="text-3xl font-bold text-primary" data-testid="analytics-favorite-count">
        {{ favoriteCount }}
      </span>
    </div>
  </div>
</template>
