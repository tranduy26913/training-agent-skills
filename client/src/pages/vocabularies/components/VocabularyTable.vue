<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import AppDataTable from '@/components/AppDataTable.vue';
import type { AppTableColumn } from '@/types/table.types';
import type { Vocabulary, PaginationInfo } from '../composables/useVocabularies';

const { t } = useI18n();

// Props / プロパティ定義
const props = defineProps<{
  vocabularies: Vocabulary[];
  loading: boolean;
  pagination: PaginationInfo;
  sortField?: string;
  sortOrder?: 1 | -1;
}>();

// Emits / イベント定義
const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  pageChange: [page: number];
  sortChange: [field: string, order: 1 | -1];
}>();

// レベルバッジカラー / Level badge severity mapping
const levelSeverityMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
  N5: 'success',
  N4: 'info',
  N3: 'warn',
  N2: 'danger',
  N1: 'danger',
};

// ステータスバッジカラー / Status badge severity mapping
const statusSeverityMap: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
  publish: 'success',
  hide: 'warn',
  deleted: 'danger',
};

// タグ表示 (最大3個) / Display tags (max 3 + "+n" overflow)
function displayTags(tags: string[] | null): string[] {
  if (!tags || tags.length === 0) return [];
  return tags.slice(0, 3);
}

function overflowCount(tags: string[] | null): number {
  if (!tags || tags.length <= 3) return 0;
  return tags.length - 3;
}

// 列定義 / Column definitions
const columns = computed<AppTableColumn<Vocabulary>[]>(() => [
  {
    field: 'kanji',
    header: t('vocab.kanji'),
    width: '140px',
    sortable: true,
    columnAlign: 'left',
  },
  {
    field: 'hiragana',
    header: t('vocab.hiragana'),
    width: '160px',
    sortable: true,
    columnAlign: 'left',
  },
  {
    field: 'meaning_vi',
    header: t('vocab.meaningVi'),
    width: '200px',
    sortable: true,
    truncate: true,
    columnAlign: 'left',
  },
  {
    field: 'level',
    header: t('vocab.level'),
    width: '90px',
    sortable: true,
    columnAlign: 'center',
  },
  {
    field: 'status',
    header: t('vocab.status'),
    width: '110px',
    sortable: true,
    columnAlign: 'center',
  },
  {
    field: 'tags',
    header: t('vocab.tags'),
    width: '160px',
    columnAlign: 'left',
  },
]);
</script>

<template>
  <AppDataTable
    :columns="columns"
    :value="vocabularies"
    :loading="loading"
    :pagination="{ page: pagination.page, limit: pagination.limit, total: pagination.total }"
    :sort-field="sortField"
    :sort-order="sortOrder"
    table-width="960px"
    @page-change="emit('pageChange', $event)"
    @sort-change="emit('sortChange', $event, $event)"
  >
    <!-- レベルバッジ / Level badge column -->
    <template #column-level="{ data }">
      <Tag
        :value="data.level"
        :severity="levelSeverityMap[data.level] ?? 'secondary'"
        data-testid="vocab-level-badge"
      />
    </template>

    <!-- ステータスバッジ / Status badge column -->
    <template #column-status="{ data }">
      <Tag
        :value="data.status"
        :severity="statusSeverityMap[data.status] ?? 'secondary'"
        data-testid="vocab-status-badge"
      />
    </template>

    <!-- タグチップス / Tags chips column -->
    <template #column-tags="{ data }">
      <div class="flex flex-wrap gap-1">
        <Tag
          v-for="tag in displayTags(data.tags)"
          :key="tag"
          :value="tag"
          severity="secondary"
          class="text-xs"
        />
        <span v-if="overflowCount(data.tags) > 0" class="text-xs text-surface-500">
          +{{ overflowCount(data.tags) }}
        </span>
      </div>
    </template>

    <!-- アクション列 / Actions column -->
    <template #actions="{ data }">
      <div class="flex gap-1">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="secondary"
          :data-testid="`vocab-edit-btn-${data.id}`"
          @click="emit('edit', data.id)"
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          :data-testid="`vocab-delete-btn-${data.id}`"
          @click="emit('delete', data.id)"
        />
      </div>
    </template>
  </AppDataTable>
</template>
