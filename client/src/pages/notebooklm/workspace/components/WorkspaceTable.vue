<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import AppDataTable from '@/components/AppDataTable.vue';
import type { AppTableColumn } from '@/types/table.types';
import type { Workspace } from '@/types/notebooklm.types';
import type { PaginationInfo } from '@/types/api.types';

defineProps<{
  workspaces: Workspace[];
  loading?: boolean;
  pagination?: PaginationInfo;
}>();

const emit = defineEmits<{
  open: [id: number];
  edit: [id: number];
  delete: [id: number];
  pageChange: [page: number];
}>();

function canMutate(row: Workspace): boolean {
  return row.role === 'owner' || row.role === 'editor';
}

function roleSeverity(role: Workspace['role']): 'success' | 'warn' | 'info' {
  if (role === 'owner') return 'success';
  if (role === 'editor') return 'info';
  return 'warn';
}

const columns = computed<AppTableColumn<Workspace>[]>(() => [
  { field: 'name', header: 'Workspace', width: '360px' },
  { field: 'role', header: 'Role', width: '120px', hideBelow: 768 },
  { field: 'documentCount', header: 'Documents', width: '120px', columnAlign: 'right', hideBelow: 992 },
  { field: 'actions', header: 'Actions', width: '240px', headerAlign: 'right', columnAlign: 'right', frozen: true, alignFrozen: 'right' },
]);
</script>

<template>
  <AppDataTable
    :columns="columns"
    :value="workspaces"
    :loading="loading"
    :pagination="pagination"
    table-width="760px"
    @page-change="(page) => emit('pageChange', page)"
  >
    <template #empty>
      <div class="py-6 text-center text-surface-500">No workspaces found</div>
    </template>

    <template #cell-name="{ data }">
      <div class="min-w-[220px]">
        <p class="font-medium">{{ data.name }}</p>
        <p class="text-xs text-surface-500 break-words">{{ data.description || 'No description' }}</p>
      </div>
    </template>

    <template #cell-role="{ data }">
      <Tag :value="data.role" :severity="roleSeverity(data.role)" />
    </template>

    <template #cell-actions="{ data }">
      <div class="flex flex-wrap justify-end gap-1">
        <Button
          type="button"
          :data-testid="`workspace-open-${data.id}`"
          label="Open"
          icon="pi pi-folder-open"
          text
          size="small"
          @click="emit('open', data.id)"
        />
        <Button
          v-if="canMutate(data)"
          type="button"
          data-testid="workspace-edit"
          label="Edit"
          icon="pi pi-pencil"
          text
          size="small"
          @click="emit('edit', data.id)"
        />
        <Button
          v-if="data.role === 'owner'"
          type="button"
          data-testid="workspace-delete"
          label="Delete"
          icon="pi pi-trash"
          text
          size="small"
          severity="danger"
          @click="emit('delete', data.id)"
        />
      </div>
    </template>
  </AppDataTable>
</template>
