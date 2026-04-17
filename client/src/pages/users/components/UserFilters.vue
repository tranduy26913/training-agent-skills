<script setup lang="ts">
import { shallowRef } from 'vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import type { UserFilters } from '../composables/useUsers';

// Emits / イベント定義
const emit = defineEmits<{
  filterChange: [filters: UserFilters];
}>();

// フィルター状態 / Filter state
const search = shallowRef('');
const role = shallowRef('');
const status = shallowRef('');
const dateRange = shallowRef<Date[] | null>(null);

// デバウンスタイマー / Debounce timer for search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// ロールオプション / Role options
const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
  { label: 'Moderator', value: 'moderator' },
];

// ステータスオプション / Status options
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

// フィルター発行 / Emit current filter values
function emitFilters(): void {
  const filters: UserFilters = {};
  if (search.value) filters.search = search.value;
  if (role.value) filters.role = role.value;
  if (status.value) filters.status = status.value;
  if (dateRange.value && dateRange.value[0]) {
    filters.startDate = dateRange.value[0].toISOString().split('T')[0];
  }
  if (dateRange.value && dateRange.value[1]) {
    filters.endDate = dateRange.value[1].toISOString().split('T')[0];
  }
  emit('filterChange', filters);
}

// 検索デバウンス / Debounced search handler
function onSearchInput(): void {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emitFilters();
  }, 300);
}

// セレクト変更時即座に発行 / Emit immediately on select change
function onSelectChange(): void {
  emitFilters();
}

// 日付変更時即座に発行 / Emit immediately on date change
function onDateChange(): void {
  emitFilters();
}
</script>

<template>
  <div class="flex flex-wrap gap-3 items-end mb-4">
    <!-- 検索 / Search input -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">Search</label>
      <InputText
        v-model="search"
        placeholder="Search by name or email..."
        @input="onSearchInput"
        class="w-64"
      />
    </div>

    <!-- ロール / Role select -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">Role</label>
      <Select
        v-model="role"
        :options="roleOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="All Roles"
        @change="onSelectChange"
        class="w-40"
      />
    </div>

    <!-- ステータス / Status select -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">Status</label>
      <Select
        v-model="status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="All Statuses"
        @change="onSelectChange"
        class="w-44"
      />
    </div>

    <!-- 日付範囲 / Date range picker -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">Date Range</label>
      <DatePicker
        v-model="dateRange"
        selectionMode="range"
        placeholder="Select date range"
        dateFormat="dd/mm/yy"
        @date-select="onDateChange"
        class="w-56"
      />
    </div>
  </div>
</template>
