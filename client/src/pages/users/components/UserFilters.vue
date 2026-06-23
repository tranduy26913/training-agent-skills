<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import type { UserFilters } from '../composables/useUsers';

const { t } = useI18n();

// Emits
const emit = defineEmits<{
  'filter-change': [filters: UserFilters];
}>();

// Filter state
const search = shallowRef('');
const role = shallowRef('');
const status = shallowRef('');
const dateRange = shallowRef<Date[] | null>(null);

// Debounce timer for search.
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Role options (computed for reactivity).
const roleOptions = computed(() => [
  { label: t('users.allRoles'), value: '' },
  { label: t('users.roles.admin'), value: 'admin' },
  { label: t('users.roles.user'), value: 'user' },
  { label: t('users.roles.moderator'), value: 'moderator' },
]);

// Status options (computed for reactivity).
const statusOptions = computed(() => [
  { label: t('users.allStatuses'), value: '' },
  { label: t('users.statuses.active'), value: 'active' },
  { label: t('users.statuses.inactive'), value: 'inactive' },
  { label: t('users.statuses.suspended'), value: 'suspended' },
]);

// Emit current filter values.
function emitFilters(): void {
  const filters: UserFilters = {};
  filters.search = search.value;
  filters.role = role.value;
  filters.status = status.value;
  if (dateRange.value && dateRange.value[0]) {
    filters.startDate = dateRange.value[0].toISOString().split('T')[0];
  }
  if (dateRange.value && dateRange.value[1]) {
    filters.endDate = dateRange.value[1].toISOString().split('T')[0];
  }
  emit('filter-change', filters);
}

// Debounced search handler.
function onSearchInput(): void {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emitFilters();
  }, 300);
}

// Emit immediately on select change.
function onSelectChange(): void {
  emitFilters();
}

// Emit immediately on date change.
function onDateChange(): void {
  emitFilters();
}

// Reset all filters and re-emit.
function clearFilters(): void {
  search.value = '';
  role.value = '';
  status.value = '';
  dateRange.value = null;
  emitFilters();
}
</script>

<template>
  <div class="flex flex-wrap gap-3 items-end mb-4">
    <!-- Search input -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('common.search') }}</label>
      <InputText
        v-model="search"
        :placeholder="t('users.searchPlaceholder')"
        @input="onSearchInput"
        class="w-64"
      />
    </div>

    <!-- Role select -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('users.role') }}</label>
      <Select
        v-model="role"
        :options="roleOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('users.allRoles')"
        @change="onSelectChange"
        class="w-40"
      />
    </div>

    <!-- Status select -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('users.status') }}</label>
      <Select
        v-model="status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('users.allStatuses')"
        @change="onSelectChange"
        class="w-44"
      />
    </div>

    <!-- Date range picker -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('users.dateRange') }}</label>
      <DatePicker
        v-model="dateRange"
        selectionMode="range"
        :placeholder="t('users.datePlaceholder')"
        dateFormat="dd/mm/yy"
        @date-select="onDateChange"
        class="w-56"
      />
    </div>

    <!-- Clear all filters button -->
    <div class="flex flex-col justify-end">
      <Button
        :label="t('users.clearFilters')"
        icon="pi pi-filter-slash"
        severity="secondary"
        outlined
        @click="clearFilters"
      />
    </div>
  </div>
</template>