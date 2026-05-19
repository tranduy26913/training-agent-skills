<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import type { EmployeeFilters } from '@/types/employees.types';

const { t } = useI18n();

// Emits / イベント定義
const emit = defineEmits<{
  filterChange: [filters: EmployeeFilters];
}>();

// フィルター状態 / Filter state
const search = shallowRef('');
const department = shallowRef('');
const status = shallowRef('');

// デバウンスタイマー / Debounce timer for search input
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// 部署オプション / Department options
const departmentOptions = computed(() => [
  { label: t('employees.allDepartments'), value: '' },
  { label: t('employees.departments.engineering'), value: 'engineering' },
  { label: t('employees.departments.hr'), value: 'hr' },
  { label: t('employees.departments.finance'), value: 'finance' },
  { label: t('employees.departments.marketing'), value: 'marketing' },
  { label: t('employees.departments.operations'), value: 'operations' },
]);

// ステータスオプション / Status options
const statusOptions = computed(() => [
  { label: t('employees.allStatuses'), value: '' },
  { label: t('employees.statuses.active'), value: 'active' },
  { label: t('employees.statuses.inactive'), value: 'inactive' },
]);

// フィルター発行 / Emit current filter values
function emitFilters(): void {
  emit('filterChange', {
    search: search.value || undefined,
    department: department.value || undefined,
    status: status.value || undefined,
  });
}

// 検索デバウンス / Debounced search handler
function onSearchInput(): void {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(emitFilters, 300);
}

// セレクト変更時即座に発行 / Emit immediately on select change
function onSelectChange(): void {
  emitFilters();
}

// フィルタークリア / Reset all filters and re-emit
function clearFilters(): void {
  search.value = '';
  department.value = '';
  status.value = '';
  emitFilters();
}
</script>

<template>
  <div class="flex flex-wrap gap-3 items-end mb-4">
    <!-- 検索 / Search input -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('common.search') }}</label>
      <InputText
        v-model="search"
        :placeholder="t('employees.searchPlaceholder')"
        @input="onSearchInput"
        class="w-72"
      />
    </div>

    <!-- 部署 / Department select -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('employees.department') }}</label>
      <Select
        v-model="department"
        :options="departmentOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('employees.allDepartments')"
        @change="onSelectChange"
        class="w-44"
      />
    </div>

    <!-- ステータス / Status select -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('employees.status') }}</label>
      <Select
        v-model="status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('employees.allStatuses')"
        @change="onSelectChange"
        class="w-40"
      />
    </div>

    <!-- クリアボタン / Clear filters button -->
    <Button
      :label="t('employees.clearFilters')"
      icon="pi pi-filter-slash"
      severity="secondary"
      outlined
      @click="clearFilters"
    />
  </div>
</template>
