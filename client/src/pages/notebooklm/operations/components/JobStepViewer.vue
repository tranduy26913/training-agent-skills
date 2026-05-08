<script setup lang="ts">
import { computed } from 'vue';
import Drawer from 'primevue/drawer';
import Tag from 'primevue/tag';
import Timeline from 'primevue/timeline';
import type { NotebooklmJobDetail } from '@/types/notebooklm.types';

const props = defineProps<{
  visible: boolean;
  loading?: boolean;
  job: NotebooklmJobDetail | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const stepEvents = computed(() => props.job?.steps ?? []);

function severity(status: string): 'secondary' | 'warn' | 'success' | 'danger' | 'info' {
  if (status === 'done') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'running' || status === 'processing') return 'warn';
  if (status === 'retrying') return 'info';
  return 'secondary';
}

function close(): void {
  emit('update:visible', false);
}
</script>

<template>
  <Drawer
    :visible="visible"
    header="Job step details"
    position="right"
    class="w-full md:!w-[34rem]"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="loading" class="text-sm text-surface-500">Loading job details...</div>
    <div v-else-if="!job" class="text-sm text-surface-500">Select a job to inspect step timeline.</div>
    <div v-else class="space-y-4" data-testid="job-step-viewer">
      <div class="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="text-base font-semibold">Job #{{ job.id }}</h4>
          <Tag :value="job.status" :severity="severity(job.status)" />
        </div>
        <p class="text-xs text-surface-500">Type: {{ job.type }} • Retry: {{ job.retryCount }}</p>
      </div>

      <Timeline :value="stepEvents" align="left" class="w-full">
        <template #marker="slotProps">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            :class="{
              'bg-emerald-500': slotProps.item.status === 'done',
              'bg-red-500': slotProps.item.status === 'failed',
              'bg-amber-500': slotProps.item.status === 'running',
              'bg-slate-500': !['done', 'failed', 'running'].includes(slotProps.item.status),
            }"
          >
            {{ (slotProps.item.stepName || '?').slice(0, 1).toUpperCase() }}
          </span>
        </template>
        <template #content="slotProps">
          <div class="rounded-md border border-surface-200 p-3 dark:border-surface-700" data-testid="job-step-item">
            <div class="mb-1 flex items-center justify-between gap-2">
              <p class="font-medium">{{ slotProps.item.stepName }}</p>
              <Tag :value="slotProps.item.status" :severity="severity(slotProps.item.status)" />
            </div>
            <p v-if="slotProps.item.detail" class="text-xs text-surface-600 dark:text-surface-300">
              {{ slotProps.item.detail }}
            </p>
          </div>
        </template>
      </Timeline>

      <div class="flex justify-end">
        <button type="button" class="rounded border border-surface-300 px-3 py-2 text-sm" @click="close">Close</button>
      </div>
    </div>
  </Drawer>
</template>
