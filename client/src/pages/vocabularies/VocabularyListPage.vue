<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import ConfirmDialog from 'primevue/confirmdialog';
import { useVocabulariesStore } from '@/stores/vocabularies.store';
import VocabularyFilters from './components/VocabularyFilters.vue';
import VocabularyTable from './components/VocabularyTable.vue';
import type { VocabularyFilters as VocabularyFiltersType } from '@/types/vocabularies.types';

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const store = useVocabulariesStore();

// アクティブフィルターがあるか / Has any active filter set
const hasActiveFilter = computed(() =>
  !!(store.filters.search || store.filters.level || store.filters.status),
);

// 初期読み込み / Load vocabulary list on mount
onMounted(() => {
  store.fetchVocabularies();
});

// フィルター変更ハンドラ / Handle filter changes from VocabularyFilters
function handleFilterChange(filters: VocabularyFiltersType & { page: number }): void {
  store.fetchVocabularies(filters);
}

// ページ変更ハンドラ / Handle pagination page change
function handlePageChange(page: number): void {
  store.fetchVocabularies({ ...store.filters, page });
}

// 編集ナビゲーション / Navigate to vocabulary edit page
function handleEdit(id: number): void {
  router.push({ name: 'VocabularyEdit', params: { id } });
}

// 削除確認ダイアログ / Open confirm dialog before delete
function handleDelete(id: number): void {
  confirm.require({
    message: t('vocabularies.deleteConfirm'),
    header: t('vocabularies.deleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: t('common.yes'),
    rejectLabel: t('common.no'),
    accept: async () => {
      try {
        await store.deleteVocabulary(id);
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('vocabularies.deletedSuccess'), life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('vocabularies.deletedError'), life: 3000 });
      }
    },
  });
}
</script>

<template>
  <div>
    <!-- ヘッダー / Page header -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100">
        {{ t('vocabularies.title') }}
      </h2>
      <Button
        :label="t('vocabularies.createNew')"
        icon="pi pi-plus"
        data-testid="vocab-create-btn"
        @click="router.push({ name: 'VocabularyCreate' })"
      />
    </div>

    <!-- フィルター / Filter bar -->
    <VocabularyFilters @filter-change="handleFilterChange" />

    <!-- ローディングスケルトン / Loading skeleton -->
    <div v-if="store.loading" data-testid="vocab-skeleton" class="flex flex-col gap-2">
      <Skeleton v-for="n in 5" :key="n" height="2.5rem" />
    </div>

    <!-- データなし空状態 / Empty state — no data and no active filters -->
    <div
      v-else-if="store.items.length === 0 && !hasActiveFilter"
      data-testid="vocab-empty"
      class="text-center py-12 text-surface-500"
    >
      <i class="pi pi-book text-4xl mb-3 block" />
      <p>{{ t('common.noData') }}</p>
    </div>

    <!-- フィルター有りの空状態 / Empty-filter state — filters active but no results -->
    <div
      v-else-if="store.items.length === 0 && hasActiveFilter"
      data-testid="vocab-empty-filter"
      class="text-center py-12 text-surface-500"
    >
      <i class="pi pi-search text-4xl mb-3 block" />
      <p>{{ t('common.noData') }}</p>
    </div>

    <!-- テーブル / Vocabulary data table -->
    <VocabularyTable
      v-else
      :vocabularies="store.items"
      :loading="false"
      :pagination="store.pagination"
      @edit="handleEdit"
      @delete="handleDelete"
      @page-change="handlePageChange"
    />

    <ConfirmDialog />
  </div>
</template>
