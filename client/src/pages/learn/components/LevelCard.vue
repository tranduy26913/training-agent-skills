<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import type { LevelStatsDto } from '@/types/learn.types';

// レベルカードコンポーネント / Displays progress for one JLPT level
const props = defineProps<{
  level: string;
  stats: LevelStatsDto;
}>();

const emit = defineEmits<{
  start: [level: string];
}>();

// 既知語彙の割合 / Percentage of known vocabularies
const knownPercent = computed(() =>
  props.stats.total > 0 ? Math.round((props.stats.known / props.stats.total) * 100) : 0,
);
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900">
    <!-- レベルバッジ / Level badge -->
    <div class="flex items-center justify-between">
      <span class="text-2xl font-bold text-primary">{{ level }}</span>
      <span class="text-sm text-surface-500">{{ stats.total }} 語 / words</span>
    </div>

    <!-- 進捗バー / Progress bar -->
    <ProgressBar :value="knownPercent" class="h-2" />

    <!-- 統計 / Stats row -->
    <div class="flex justify-between text-sm">
      <span class="text-green-600">✓ {{ stats.known }} 習得</span>
      <span class="text-yellow-500">↻ {{ stats.learning }} 学習中</span>
      <span class="text-surface-400">✦ {{ stats.new_count }} 未学習</span>
    </div>

    <!-- 開始ボタン / Start button -->
    <Button
      :label="`${level} を学ぶ`"
      icon="pi pi-play"
      class="w-full"
      @click="emit('start', level)"
    />
  </div>
</template>
