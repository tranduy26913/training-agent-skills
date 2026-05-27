<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import type { VocabularyFilters } from '@/types/vocabularies.types';

const { t } = useI18n();

// イベント定義 / Emit events
const emit = defineEmits<{
  filterChange: [filters: VocabularyFilters & { page: number }];
}>();

// フィルター状態 / Filter local state
const search = shallowRef('');
const level = shallowRef('');
const status = shallowRef('');

// デバウンスタイマー / Search debounce timer (400ms per spec)
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// レベルオプション / JLPT level options
const levelOptions = computed(() => [
  { label: t('vocabularies.filterLevel'), value: '' },
  { label: 'N5', value: 'N5' },
  { label: 'N4', value: 'N4' },
  { label: 'N3', value: 'N3' },
  { label: 'N2', value: 'N2' },
  { label: 'N1', value: 'N1' },
]);

// ステータスオプション / Status options
const statusOptions = computed(() => [
  { label: t('vocabularies.filterStatus'), value: '' },
  { label: 'Publish', value: 'publish' },
  { label: 'Hide', value: 'hide' },
  { label: 'Delete', value: 'delete' },
]);

// フィルター発行 / Emit current filter values with page reset
function emitFilters(): void {
  const filters: VocabularyFilters & { page: number } = { page: 1 };
  if (search.value) filters.search = search.value;
  if (level.value) filters.level = level.value as any;
  if (status.value) filters.status = status.value as any;
  emit('filterChange', filters);
}

// 検索デバウンス / Debounced search input handler
function onSearchInput(): void {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => emitFilters(), 400);
}

// セレクト変更即時発行 / Emit immediately on select change
function onSelectChange(): void {
  emitFilters();
}

// フィルタークリア / Reset all filters
function clearFilters(): void {
  search.value = '';
  level.value = '';
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
        :placeholder="t('vocabularies.searchPlaceholder')"
        data-testid="vocab-filter-search"
        class="w-64"
        @input="onSearchInput"
      />
    </div>

    <!-- レベルフィルター / Level filter -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('vocabularies.form.level') }}</label>
      <Select
        v-model="level"
        :options="levelOptions"
        option-label="label"
        option-value="value"
        data-testid="vocab-filter-level"
        class="w-36"
        @change="onSelectChange"
      />
    </div>

    <!-- ステータスフィルター / Status filter -->
    <div class="flex flex-col gap-1">
      <label class="text-sm text-surface-600 dark:text-surface-400">{{ t('vocabularies.form.status') }}</label>
      <Select
        v-model="status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        data-testid="vocab-filter-status"
        class="w-36"
        @change="onSelectChange"
      />
    </div>

    <!-- フィルタークリア / Clear filters button -->
    <Button
      :label="t('users.clearFilters')"
      severity="secondary"
      outlined
      data-testid="vocab-filter-clear"
      @click="clearFilters"
    />
  </div>
</template>
