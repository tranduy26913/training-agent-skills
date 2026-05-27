<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import AppDataTable from '@/components/AppDataTable.vue';
import type { AppTableColumn } from '@/types/table.types';
import type { VocabularyRow, VocabularyLevel, VocabularyStatus } from '@/types/vocabularies.types';
import type { PaginationInfo } from '@/types/api.types';

const { t } = useI18n();

// Props / プロパティ定義
const props = defineProps<{
  vocabularies: VocabularyRow[];
  loading: boolean;
  pagination: PaginationInfo;
}>();

// Emits / イベント定義
const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
  pageChange: [page: number];
}>();

// レベルバッジのカラー / JLPT level severity mapping
const levelSeverityMap: Record<VocabularyLevel, 'secondary' | 'success' | 'info' | 'warn' | 'danger'> = {
  N5: 'secondary',
  N4: 'success',
  N3: 'info',
  N2: 'warn',
  N1: 'danger',
};

// ステータスバッジのカラー / Status severity mapping
const statusSeverityMap: Record<VocabularyStatus, 'success' | 'warn' | 'danger'> = {
  publish: 'success',
  hide: 'warn',
  delete: 'danger',
};

// 日付フォーマット / Format date string to DD/MM/YYYY
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// カラム定義 / Column definitions
const columns = computed<AppTableColumn<VocabularyRow>[]>(() => [
  { field: 'id', header: t('common.id'), width: '72px', sortable: true, frozen: true, alignFrozen: 'left', columnAlign: 'center' },
  { field: 'kanji', header: t('vocabularies.col.kanji'), width: '140px', sortable: true, truncate: true },
  { field: 'meaning_vi', header: t('vocabularies.col.meaningVi'), width: '200px', truncate: true },
  { field: 'level', header: t('vocabularies.col.level'), width: '90px', columnAlign: 'center' },
  { field: 'status', header: t('vocabularies.col.status'), width: '110px', columnAlign: 'center' },
  { field: 'tags', header: t('vocabularies.col.tags'), width: '160px' },
  { field: 'created_at', header: t('vocabularies.col.createdAt'), width: '130px', sortable: true, hideBelow: 1024 },
  { field: 'actions', header: t('common.actions'), width: '100px', frozen: true, alignFrozen: 'right', columnAlign: 'center' },
]);
</script>

<template>
  <AppDataTable
    :value="props.vocabularies"
    :columns="columns"
    :loading="props.loading"
    :pagination="props.pagination"
    @page-change="(p) => emit('pageChange', p)"
  >
    <!-- レベルバッジ / Level badge -->
    <template #cell-level="{ data }">
      <Tag :value="data.level" :severity="levelSeverityMap[data.level]" />
    </template>

    <!-- ステータスバッジ / Status badge -->
    <template #cell-status="{ data }">
      <Tag :value="data.status" :severity="statusSeverityMap[data.status]" />
    </template>

    <!-- タグ表示 / Tags with overflow -->
    <template #cell-tags="{ data }">
      <div class="flex flex-wrap gap-1">
        <Tag
          v-for="tag in data.tags.slice(0, 3)"
          :key="tag"
          :value="tag"
          severity="secondary"
          class="text-xs"
        />
        <Tag
          v-if="data.tags.length > 3"
          :value="`+${data.tags.length - 3}`"
          severity="secondary"
          class="text-xs"
        />
      </div>
    </template>

    <!-- 作成日 / Created at -->
    <template #cell-created_at="{ data }">
      {{ formatDate(data.created_at) }}
    </template>

    <!-- アクションボタン / Action buttons -->
    <template #cell-actions="{ data }">
      <div class="flex gap-1 justify-center">
        <Button
          icon="pi pi-pencil"
          severity="info"
          text
          rounded
          size="small"
          data-testid="vocab-edit-btn"
          :aria-label="t('common.edit')"
          @click="emit('edit', data.id)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          size="small"
          data-testid="vocab-delete-btn"
          :aria-label="t('common.delete')"
          @click="emit('delete', data.id)"
        />
      </div>
    </template>
  </AppDataTable>
</template>
