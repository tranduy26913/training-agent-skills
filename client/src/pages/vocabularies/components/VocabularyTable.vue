<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import AppDataTable from '@/components/AppDataTable.vue';
import type { AppTableColumn } from '@/types/table.types';
import type { VocabularyResponse, PaginationInfo } from '../composables/useVocabularies';

const { t } = useI18n();

// Props
const props = defineProps<{
  items: VocabularyResponse[];
  loading: boolean;
  pagination: PaginationInfo;
  sortField?: string;
  sortOrder?: 1 | -1;
}>();

// Emits
const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  pageChange: [page: number];
  sortChange: [field: string, order: 1 | -1];
}>();

// Status severity map
const statusSeverityMap: Record<string, 'success' | 'warn' | 'danger'> = {
  Publish: 'success',
  Hide: 'warn',
  Delete: 'danger',
};

// Level color map
const levelColorMap: Record<string, 'info' | 'secondary' | 'warn' | 'danger' | 'contrast'> = {
  N5: 'info',
  N4: 'secondary',
  N3: 'warn',
  N2: 'danger',
  N1: 'contrast',
};

// Format date string to DD/MM/YYYY HH:mm (null-safe)
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Column definitions
const columns = computed<AppTableColumn<VocabularyResponse>[]>(() => [
  {
    field: 'id',
    header: t('common.id'),
    width: '72px',
    sortable: true,
    hideBelow: 768,
    frozen: true,
    alignFrozen: 'left',
    columnAlign: 'center',
  },
  {
    field: 'kanji',
    header: t('vocab.col.kanji'),
    width: '160px',
    sortable: true,
    truncate: true,
    columnAlign: 'left',
  },
  {
    field: 'hiragana',
    header: t('vocab.col.hiragana'),
    width: '140px',
    sortable: true,
    truncate: true,
    columnAlign: 'left',
  },
  {
    field: 'level',
    header: t('vocab.col.level'),
    width: '100px',
    sortable: true,
    columnAlign: 'center',
  },
  {
    field: 'status',
    header: t('vocab.col.status'),
    width: '120px',
    sortable: true,
    columnAlign: 'center',
  },
  {
    field: 'meaning_vi',
    header: t('vocab.col.meaning'),
    width: '220px',
    sortable: true,
    truncate: true,
    hideBelow: 1024,
    columnAlign: 'left',
  },
  {
    field: 'updated_at',
    header: t('common.updatedAt'),
    width: '160px',
    sortable: true,
    truncate: true,
    hideBelow: 1280,
    columnAlign: 'center',
    formatter: (row) => formatDate(row.updated_at),
  },
  {
    field: 'actions',
    header: t('common.actions'),
    width: '120px',
    frozen: true,
    alignFrozen: 'right',
    headerAlign: 'right',
    columnAlign: 'center',
  },
]);
</script>

<template>
  <AppDataTable
    :columns="columns"
    :value="items"
    :loading="loading"
    :pagination="pagination"
    :sort-field="sortField"
    :sort-order="sortOrder"
    table-width="1200px"
    @page-change="(p) => emit('pageChange', p)"
    @sort-change="(f, o) => emit('sortChange', f, o)"
  >
    <!-- Empty state -->
    <template #empty>
      <div class="text-center py-8 text-surface-500">
        {{ t('vocab.noVocabulariesFound') }}
      </div>
    </template>

    <!-- Level badge -->
    <template #cell-level="{ data }">
      <Tag 
        v-if="data.level" 
        :value="data.level" 
        :severity="levelColorMap[data.level]" 
      />
      <span v-else class="text-surface-400">-</span>
    </template>

    <!-- Status badge -->
    <template #cell-status="{ data }">
      <Tag :value="data.status" :severity="statusSeverityMap[data.status]" />
    </template>

    <!-- Action buttons -->
    <template #cell-actions="{ data }">
      <div class="flex gap-2">
        <Button
          icon="pi pi-pencil"
          severity="info"
          text
          rounded
          @click="emit('edit', data.id as number)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          @click="emit('delete', data.id as number)"
        />
      </div>
    </template>
  </AppDataTable>
</template>
