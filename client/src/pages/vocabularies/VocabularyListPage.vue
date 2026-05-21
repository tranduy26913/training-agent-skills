<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import { useVocabulariesStore } from '@/stores/vocabularies.store';
import VocabularyTable from './components/VocabularyTable.vue';
import VocabularyFilters from './components/VocabularyFilters.vue';
import type { VocabularyFilters as VocabularyFiltersType } from './composables/useVocabularies';

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const vocabStore = useVocabulariesStore();

// 初期読み込み / Load vocabularies on mount
onMounted(() => {
  vocabStore.fetchVocabularies();
});

// フィルター変更ハンドラ / Handle filter changes — reset page to 1
function handleFilterChange(filters: VocabularyFiltersType): void {
  vocabStore.fetchVocabularies({ ...filters, page: 1 });
}

// ページ変更ハンドラ / Handle page changes
function handlePageChange(page: number): void {
  vocabStore.fetchVocabularies({ ...vocabStore.filters, page });
}

// 編集ハンドラ / Navigate to edit page
function handleEdit(id: number): void {
  router.push({ name: 'VocabularyEdit', params: { id } });
}

// ソートフィールドとオーダー / Active sort state
const sortField = shallowRef<string>('created_at');
const sortOrder = shallowRef<1 | -1>(-1);

// ソート変更ハンドラ / Handle sort change from table
function handleSortChange(field: string, order: 1 | -1): void {
  sortField.value = field;
  sortOrder.value = order;
  vocabStore.fetchVocabularies({
    ...vocabStore.filters,
    page: 1,
    sortBy: field,
    sortOrder: order === 1 ? 'asc' : 'desc',
  });
}

// 削除ハンドラ / Soft delete vocabulary with confirmation
function handleDelete(id: number): void {
  confirm.require({
    message: t('vocab.deleteConfirm', '削除してもよろしいですか？'),
    header: t('vocab.deleteHeader', '確認'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: t('common.yes'),
    rejectLabel: t('common.no'),
    accept: async () => {
      try {
        await vocabStore.deleteVocabulary(id);
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('vocab.deletedSuccess', '削除しました'), life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('vocab.deletedError', '削除に失敗しました'), life: 3000 });
      }
    },
  });
}
</script>

<template>
  <div data-testid="vocab-list-page">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100">
        {{ t('vocab.pageTitle') }}
      </h2>
      <Button
        :label="t('vocab.createBtn')"
        icon="pi pi-plus"
        data-testid="vocab-create-btn"
        @click="router.push({ name: 'VocabularyCreate' })"
      />
    </div>

    <VocabularyFilters @filter-change="handleFilterChange" />

    <VocabularyTable
      :vocabularies="vocabStore.vocabularies"
      :loading="vocabStore.loading"
      :pagination="vocabStore.pagination"
      :sort-field="sortField"
      :sort-order="sortOrder"
      @edit="handleEdit"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @sort-change="handleSortChange"
    />

    <ConfirmDialog />
  </div>
</template>
