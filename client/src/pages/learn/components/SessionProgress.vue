<script setup lang="ts">
import { computed } from 'vue';
import ProgressBar from 'primevue/progressbar';

// セッション進捗コンポーネント / Displays current card position in a session
const props = defineProps<{
  current: number;
  total: number;
}>();

const percent = computed(() =>
  props.total > 0 ? Math.round((props.current / props.total) * 100) : 0,
);
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex justify-between text-sm text-surface-500">
      <span>{{ current }} / {{ total }}</span>
      <span>{{ percent }}%</span>
    </div>
    <ProgressBar :value="percent" class="h-2" />
  </div>
</template>
