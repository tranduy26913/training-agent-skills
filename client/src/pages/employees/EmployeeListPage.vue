<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import { useEmployeesStore } from '@/stores/employees.store';
import EmployeeTable from './components/EmployeeTable.vue';
import EmployeeFilters from './components/EmployeeFilters.vue';
import type { EmployeeFilters as EmployeeFiltersType } from '@/types/employees.types';

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const employeesStore = useEmployeesStore();

// 初期読み込み / Load employees on mount
onMounted(() => {
  employeesStore.fetchEmployees();
});

// フィルター変更ハンドラ / Handle filter changes from EmployeeFilters
function handleFilterChange(filters: EmployeeFiltersType): void {
  employeesStore.fetchEmployees({ ...filters, page: 1 });
}

// ページ変更ハンドラ / Handle pagination change from EmployeeTable
function handlePageChange(page: number): void {
  employeesStore.fetchEmployees({ ...employeesStore.filters, page });
}

// 編集ハンドラ / Navigate to employee edit page
function handleEdit(id: number): void {
  router.push({ name: 'EmployeeEdit', params: { id } });
}

// ソート状態 / Active sort state
const sortField = shallowRef<string>('hire_date');
const sortOrder = shallowRef<1 | -1>(-1);

// ソート変更ハンドラ / Handle sort change from table
function handleSortChange(field: string, order: 1 | -1): void {
  sortField.value = field;
  sortOrder.value = order;
  employeesStore.fetchEmployees({
    ...employeesStore.filters,
    page: 1,
    sortBy: field,
    sortOrder: order === 1 ? 'asc' : 'desc',
  });
}

// 削除ハンドラ / Delete employee with confirmation dialog
function handleDelete(id: number): void {
  confirm.require({
    message: t('employees.deleteConfirm'),
    header: t('employees.deleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: t('common.yes'),
    rejectLabel: t('common.no'),
    accept: async () => {
      try {
        await employeesStore.deleteEmployee(id);
        toast.add({
          severity: 'success',
          summary: t('common.success'),
          detail: t('employees.deletedSuccess'),
          life: 3000,
        });
      } catch {
        toast.add({
          severity: 'error',
          summary: t('common.error'),
          detail: t('employees.deletedError'),
          life: 3000,
        });
      }
    },
  });
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100">
        {{ t('employees.title') }}
      </h2>
      <Button
        :label="t('employees.createEmployee')"
        icon="pi pi-plus"
        @click="router.push({ name: 'EmployeeCreate' })"
      />
    </div>

    <EmployeeFilters @filter-change="handleFilterChange" />

    <EmployeeTable
      :employees="employeesStore.employees"
      :loading="employeesStore.loading"
      :pagination="employeesStore.pagination"
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
