<script setup lang="ts">
import { onMounted, shallowRef, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import { useVocabularies } from './composables/useVocabularies';
import VocabularyTable from './components/VocabularyTable.vue';
import VocabularyFilter from './components/VocabularyFilter.vue';
import type { VocabularyFilters } from './composables/useVocabularies';

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const { getVocabularies, deleteVocabulary, loading, error } = useVocabularies();

// State
const vocabularies = ref([]);
const pagination = ref({ page: 1, limit: 20, total: 0, total_pages: 0 });
const currentFilters = ref<VocabularyFilters>({});

// Initial load
onMounted(async () => {
  await fetchVocabularies();
});

// Fetch vocabularies with filters
async function fetchVocabularies(filters?: VocabularyFilters): Promise<void> {
  try {
    const result = await getVocabularies(filters);
    vocabularies.value = result.data;
    pagination.value = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      total_pages: result.total_pages,
    };
  } catch (err) {
    toast.add({ 
      severity: 'error', 
      summary: t('common.error'), 
      detail: t('vocab.fetchError'), 
      life: 3000 
    });
  }
}

// Filter change handler
function handleFilterChange(filters: VocabularyFilters): void {
  currentFilters.value = filters;
  fetchVocabularies({ ...filters, page: 1 });
}

// Page change handler
function handlePageChange(page: number): void {
  fetchVocabularies({ ...currentFilters.value, page });
}

// Sort field and order
const sortField = shallowRef<string>('updated_at');
const sortOrder = shallowRef<1 | -1>(-1);

// Sort change handler
function handleSortChange(field: string, order: 1 | -1): void {
  sortField.value = field;
  sortOrder.value = order;
  fetchVocabularies({ 
    ...currentFilters.value, 
    page: 1, 
    sortBy: field, 
    sortOrder: order === 1 ? 'asc' : 'desc' 
  });
}

// Edit handler
function handleEdit(id: number): void {
  router.push({ name: 'VocabularyEdit', params: { id } });
}

// Delete handler
function handleDelete(id: number): void {
  confirm.require({
    message: t('vocab.deleteConfirm'),
    header: t('vocab.deleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: t('common.yes'),
    rejectLabel: t('common.no'),
    accept: async () => {
      try {
        await deleteVocabulary(id);
        toast.add({ 
          severity: 'success', 
          summary: t('common.success'), 
          detail: t('vocab.deletedSuccess'), 
          life: 3000 
        });
        await fetchVocabularies(currentFilters.value);
      } catch {
        toast.add({ 
          severity: 'error', 
          summary: t('common.error'), 
          detail: t('vocab.deletedError'), 
          life: 3000 
        });
      }
    },
  });
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 data-testid="vocabularies-list-heading" class="text-2xl font-semibold text-surface-800 dark:text-surface-100">
        {{ t('vocab.title') }}
      </h2>
      <Button
        :label="t('vocab.btn.create')"
        icon="pi pi-plus"
        @click="router.push({ name: 'VocabularyCreate' })"
      />
    </div>

    <VocabularyFilter @search="handleFilterChange" @reset="() => handleFilterChange({})" />

    <VocabularyTable
      :items="vocabularies"
      :loading="loading"
      :pagination="pagination"
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
