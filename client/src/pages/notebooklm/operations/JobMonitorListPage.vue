<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import ConfirmDialog from 'primevue/confirmdialog';
import JobMonitorFilters from './components/JobMonitorFilters.vue';
import JobMonitorTable from './components/JobMonitorTable.vue';
import JobStepViewer from './components/JobStepViewer.vue';
import { useNotebooklmOperationsStore } from '@/stores/notebooklm-operations.store';
import type { NotebooklmOperationsFilters } from '@/types/notebooklm.types';

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const operationsStore = useNotebooklmOperationsStore();

const drawerVisible = ref(false);
const sortField = shallowRef('updatedAt');
const sortOrder = shallowRef<1 | -1>(-1);

onMounted(async () => {
  await operationsStore.fetchItems({ page: 1, limit: 25, sortBy: 'updated_at', sortOrder: 'desc' });
});

function handleFilterChange(filters: NotebooklmOperationsFilters): void {
  operationsStore.fetchItems({ ...filters, page: 1 });
}

function handlePageChange(page: number): void {
  operationsStore.fetchItems({ ...operationsStore.filters, page });
}

function handleSortChange(field: string, order: 1 | -1): void {
  sortField.value = field;
  sortOrder.value = order;
  operationsStore.fetchItems({
    ...operationsStore.filters,
    page: 1,
    sortBy: field,
    sortOrder: order === 1 ? 'asc' : 'desc',
  });
}

async function handleView(id: number): Promise<void> {
  drawerVisible.value = true;
  await operationsStore.fetchItem(id);
}

function handleRetry(id: number): void {
  router.push({ name: 'NotebooklmJobRetryCreate', params: { id } });
}

function handlePurge(id: number): void {
  confirm.require({
    message: 'Purge selected dead-letter item permanently?',
    header: 'Confirm purge',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await operationsStore.deleteItem({ ids: [id] });
      toast.add({ severity: 'success', summary: 'Success', detail: 'DLQ item purged', life: 2500 });
      await operationsStore.fetchItems({ ...operationsStore.filters });
    },
  });
}
</script>

<template>
  <div class="space-y-4">
    <header class="rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-semibold">NotebookLM Job Monitor</h2>
          <p class="text-sm text-surface-500">Track processing health, inspect job steps, and execute controlled retries.</p>
        </div>
      </div>
    </header>

    <JobMonitorFilters @filter-change="handleFilterChange" />

    <JobMonitorTable
      :jobs="operationsStore.items"
      :loading="operationsStore.loading"
      :pagination="operationsStore.pagination"
      :sort-field="sortField"
      :sort-order="sortOrder"
      @view="handleView"
      @retry="handleRetry"
      @purge="handlePurge"
      @page-change="handlePageChange"
      @sort-change="handleSortChange"
    />

    <JobStepViewer
      v-model:visible="drawerVisible"
      :job="operationsStore.currentItem"
      :loading="operationsStore.loadingCurrent"
    />

    <ConfirmDialog />
  </div>
</template>
