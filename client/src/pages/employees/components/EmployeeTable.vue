<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import AppDataTable from '@/components/AppDataTable.vue';
import type { AppTableColumn } from '@/types/table.types';
import type { Employee } from '@/types/employees.types';
import type { PaginationInfo } from '@/types/api.types';

const { t } = useI18n();

// Props / プロパティ定義
const props = defineProps<{
  employees: Employee[];
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

// ステータスタグの色マッピング / Status → PrimeVue severity
const statusSeverityMap: Record<string, 'success' | 'warn'> = {
  active: 'success',
  inactive: 'warn',
};

// 日付フォーマット / Format ISO date to DD/MM/YYYY
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// 給与フォーマット / Format salary with thousand separators
function formatSalary(value: number): string {
  return new Intl.NumberFormat().format(value);
}

// 列定義 / Column definitions
const columns = computed<AppTableColumn<Employee>[]>(() => [
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
    field: 'employee_code',
    header: t('employees.employeeCode'),
    width: '130px',
    sortable: true,
    columnAlign: 'left',
  },
  {
    field: 'full_name',
    header: t('employees.fullName'),
    width: '160px',
    sortable: true,
    truncate: true,
    columnAlign: 'left',
  },
  {
    field: 'email',
    header: t('employees.email'),
    width: '200px',
    sortable: true,
    truncate: true,
    hideBelow: 900,
    columnAlign: 'left',
  },
  {
    field: 'department',
    header: t('employees.department'),
    width: '130px',
    sortable: true,
    hideBelow: 1024,
    columnAlign: 'center',
  },
  {
    field: 'position',
    header: t('employees.position'),
    width: '140px',
    sortable: true,
    hideBelow: 1280,
    columnAlign: 'center',
  },
  {
    field: 'hire_date',
    header: t('employees.hireDate'),
    width: '120px',
    sortable: true,
    hideBelow: 1024,
    columnAlign: 'center',
    formatter: (row) => formatDate(row.hire_date),
  },
  {
    field: 'salary',
    header: t('employees.salary'),
    width: '120px',
    sortable: true,
    hideBelow: 1280,
    columnAlign: 'right',
    formatter: (row) => formatSalary(row.salary),
  },
  {
    field: 'status',
    header: t('employees.status'),
    width: '110px',
    sortable: true,
    columnAlign: 'center',
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
    :value="employees"
    :loading="loading"
    :pagination="pagination"
    :sort-field="sortField"
    :sort-order="sortOrder"
    table-width="1400px"
    @page-change="(p) => emit('pageChange', p)"
    @sort-change="(f, o) => emit('sortChange', f, o)"
  >
    <!-- 空メッセージ / Empty state -->
    <template #empty>
      <div class="text-center py-8 text-surface-500">
        {{ t('employees.noEmployeesFound') }}
      </div>
    </template>

    <!-- 部署バッジ / Department badge -->
    <template #cell-department="{ data }">
      <Tag :value="t(`employees.departments.${data.department}`)" severity="secondary" />
    </template>

    <!-- 役職バッジ / Position badge -->
    <template #cell-position="{ data }">
      <span class="text-sm">{{ t(`employees.positions.${data.position}`) }}</span>
    </template>

    <!-- ステータスバッジ / Status badge -->
    <template #cell-status="{ data }">
      <Tag
        :value="t(`employees.statuses.${data.status}`)"
        :severity="statusSeverityMap[data.status as string]"
      />
    </template>

    <!-- アクションボタン / Action buttons -->
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
