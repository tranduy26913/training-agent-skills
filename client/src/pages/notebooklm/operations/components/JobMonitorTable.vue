<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import AppDataTable from '@/components/AppDataTable.vue';
import type { AppTableColumn } from '@/types/table.types';
import type { PaginationInfo } from '@/types/api.types';
import type { NotebooklmJobMonitorItem } from '@/types/notebooklm.types';

const props = defineProps<{
  jobs: NotebooklmJobMonitorItem[];
  loading: boolean;
  pagination: PaginationInfo;
  sortField?: string;
  sortOrder?: 1 | -1;
}>();

const emit = defineEmits<{
  view: [id: number];
  retry: [id: number];
  purge: [id: number];
  pageChange: [page: number];
  sortChange: [field: string, order: 1 | -1];
}>();

function statusSeverity(status: NotebooklmJobMonitorItem['status']): 'secondary' | 'info' | 'warn' | 'success' | 'danger' {
  if (status === 'done') return 'success';
  if (status === 'failed' || status === 'dead_letter') return 'danger';
  if (status === 'processing') return 'warn';
  if (status === 'retrying') return 'info';
  return 'secondary';
}

function canRetry(status: NotebooklmJobMonitorItem['status']): boolean {
  return status === 'failed' || status === 'dead_letter';
}

function canPurge(status: NotebooklmJobMonitorItem['status']): boolean {
  return status === 'dead_letter';
}

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleString();
}

const columns = computed<AppTableColumn<NotebooklmJobMonitorItem>[]>(() => [
  { field: 'id', header: 'Job ID', width: '90px', sortable: true, frozen: true, alignFrozen: 'left' },
  { field: 'type', header: 'Type', width: '150px', sortable: true },
  { field: 'status', header: 'Status', width: '140px', sortable: true },
  { field: 'retryCount', header: 'Retry', width: '90px', sortable: true, columnAlign: 'right' },
  { field: 'workerId', header: 'Worker', width: '160px', truncate: true },
  { field: 'workspaceId', header: 'Workspace', width: '120px', sortable: true, columnAlign: 'right' },
  { field: 'correlationId', header: 'Correlation', width: '220px', truncate: true },
  { field: 'updatedAt', header: 'Updated', width: '180px', sortable: true, formatter: (row) => formatDate(row.updatedAt) },
  { field: 'actions', header: 'Actions', width: '210px', frozen: true, alignFrozen: 'right', headerAlign: 'right' },
]);
</script>

<template>
  <AppDataTable
    :columns="columns"
    :value="jobs"
    :loading="loading"
    :pagination="pagination"
    :sort-field="sortField"
    :sort-order="sortOrder"
    table-width="1450px"
    @page-change="(page) => emit('pageChange', page)"
    @sort-change="(field, order) => emit('sortChange', field, order)"
  >
    <template #empty>
      <div class="py-6 text-center text-surface-500">No jobs found for current filters.</div>
    </template>

    <template #cell-status="{ data }">
      <Tag data-testid="job-status-tag" :value="data.status" :severity="statusSeverity(data.status)" />
    </template>

    <template #cell-actions="{ data }">
      <div class="flex justify-end gap-1">
        <Button
          data-testid="job-view-btn"
          icon="pi pi-eye"
          label="View"
          size="small"
          text
          @click="emit('view', data.id as number)"
        />
        <Button
          v-if="canRetry(data.status as NotebooklmJobMonitorItem['status'])"
          data-testid="job-retry-btn"
          icon="pi pi-refresh"
          label="Retry"
          size="small"
          text
          severity="warn"
          @click="emit('retry', data.id as number)"
        />
        <Button
          v-if="canPurge(data.status as NotebooklmJobMonitorItem['status'])"
          data-testid="job-purge-btn"
          icon="pi pi-trash"
          label="Purge"
          size="small"
          text
          severity="danger"
          @click="emit('purge', data.id as number)"
        />
      </div>
    </template>
  </AppDataTable>
</template>
