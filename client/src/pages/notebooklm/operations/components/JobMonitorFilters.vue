<script setup lang="ts">
import { computed, ref } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import type { NotebooklmOperationsFilters } from '@/types/notebooklm.types';

const { t } = useI18n();

const emit = defineEmits<{
  filterChange: [filters: NotebooklmOperationsFilters];
}>();

const search = ref('');
const type = ref<NotebooklmOperationsFilters['type']>('');
const status = ref<NotebooklmOperationsFilters['status']>('');
const workspaceId = ref<string>('');
const failedOnly = ref(false);
const dateRange = ref<Date[] | null>(null);

const typeOptions = computed(() => [
  { label: 'All', value: '' },
  { label: 'INGEST', value: 'INGEST' },
  { label: 'QUERY', value: 'QUERY' },
  { label: 'DELETE_DOC', value: 'DELETE_DOC' },
  { label: 'DELETE_WORKSPACE', value: 'DELETE_WORKSPACE' },
]);

const statusOptions = computed(() => [
  { label: 'All', value: '' },
  { label: 'pending', value: 'pending' },
  { label: 'processing', value: 'processing' },
  { label: 'retrying', value: 'retrying' },
  { label: 'done', value: 'done' },
  { label: 'failed', value: 'failed' },
  { label: 'dead_letter', value: 'dead_letter' },
]);

function buildFilters(): NotebooklmOperationsFilters {
  const filters: NotebooklmOperationsFilters = {
    search: search.value || undefined,
    type: type.value || undefined,
    status: status.value || undefined,
    failedOnly: failedOnly.value || undefined,
    page: 1,
    limit: 25,
  };

  const parsedWorkspaceId = Number(workspaceId.value);
  if (Number.isFinite(parsedWorkspaceId) && parsedWorkspaceId > 0) {
    filters.workspaceId = parsedWorkspaceId;
  }

  if (dateRange.value?.[0]) {
    filters.startDate = dateRange.value[0].toISOString().split('T')[0];
  }

  if (dateRange.value?.[1]) {
    filters.endDate = dateRange.value[1].toISOString().split('T')[0];
  }

  return filters;
}

function emitFilters(): void {
  emit('filterChange', buildFilters());
}

watchDebounced(search, emitFilters, { debounce: 350, maxWait: 800 });

function clearFilters(): void {
  search.value = '';
  type.value = '';
  status.value = '';
  workspaceId.value = '';
  failedOnly.value = false;
  dateRange.value = null;
  emitFilters();
}
</script>

<template>
  <section class="mb-4 rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <div class="space-y-1 xl:col-span-2">
        <label class="text-xs font-medium text-surface-600 dark:text-surface-300">{{ t('common.search') }}</label>
        <InputText
          v-model="search"
          data-testid="job-filter-search"
          placeholder="Job ID or correlation ID"
          fluid
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium text-surface-600 dark:text-surface-300">Type</label>
        <Select
          v-model="type"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          data-testid="job-filter-type"
          fluid
          @change="emitFilters"
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium text-surface-600 dark:text-surface-300">Status</label>
        <Select
          v-model="status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          data-testid="job-filter-status"
          fluid
          @change="emitFilters"
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium text-surface-600 dark:text-surface-300">Workspace ID</label>
        <InputText
          v-model="workspaceId"
          data-testid="job-filter-workspace"
          placeholder="e.g. 42"
          fluid
          @change="emitFilters"
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium text-surface-600 dark:text-surface-300">Date Range</label>
        <DatePicker
          v-model="dateRange"
          data-testid="job-filter-daterange"
          selectionMode="range"
          dateFormat="dd/mm/yy"
          fluid
          @date-select="emitFilters"
        />
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <ToggleSwitch v-model="failedOnly" data-testid="job-filter-failed-only" @change="emitFilters" />
        <span class="text-sm text-surface-600 dark:text-surface-300">Only failed/dead-letter jobs</span>
      </div>

      <Button
        data-testid="job-filter-clear"
        severity="secondary"
        outlined
        icon="pi pi-filter-slash"
        label="Clear"
        @click="clearFilters"
      />
    </div>
  </section>
</template>
