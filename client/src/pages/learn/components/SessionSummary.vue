<script setup lang="ts">
import Button from 'primevue/button';
import type { SessionResults } from '@/types/learn.types';

// セッションサマリーコンポーネント / Displays end-of-session results
const props = defineProps<{
  results: SessionResults;
}>();

const emit = defineEmits<{
  retry: [];
  backToList: [];
}>();

const total = props.results.knownCount + props.results.unknownCount;
const knownPercent = total > 0 ? Math.round((props.results.knownCount / total) * 100) : 0;
</script>

<template>
  <div class="flex flex-col items-center gap-6 rounded-2xl border border-surface-200 bg-surface-0 p-8 shadow-md dark:border-surface-700 dark:bg-surface-900">
    <h2 class="text-2xl font-bold">セッション完了 🎉</h2>

    <!-- 結果サマリー / Result statistics -->
    <div class="grid w-full grid-cols-3 gap-4 text-center">
      <div class="flex flex-col gap-1">
        <span class="text-3xl font-bold text-green-500">{{ results.knownCount }}</span>
        <span class="text-sm text-surface-500">✓ 正解 / Known</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-3xl font-bold text-red-400">{{ results.unknownCount }}</span>
        <span class="text-sm text-surface-500">✗ 要復習 / Review</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-3xl font-bold text-yellow-500">{{ results.newFavoriteCount }}</span>
        <span class="text-sm text-surface-500">★ お気に入り</span>
      </div>
    </div>

    <!-- 正答率 / Accuracy rate -->
    <p class="text-surface-500">正答率: <strong class="text-primary">{{ knownPercent }}%</strong></p>

    <!-- アクションボタン / Action buttons -->
    <div class="flex gap-3">
      <Button
        label="もう一度 / Retry"
        icon="pi pi-refresh"
        outlined
        @click="emit('retry')"
      />
      <Button
        label="一覧へ戻る / Back to List"
        icon="pi pi-arrow-left"
        @click="emit('backToList')"
      />
    </div>
  </div>
</template>
