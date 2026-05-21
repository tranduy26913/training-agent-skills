<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import { useDebounce } from '@vueuse/core';
import type { VocabularyFilters } from '../composables/useVocabularies';

const { t } = useI18n();

// Emits / イベント定義
const emit = defineEmits<{
  filterChange: [filters: VocabularyFilters];
}>();

// フィルター状態 / Filter state
const search = shallowRef('');
const level = shallowRef('');
const status = shallowRef('');
const tag = shallowRef('');

// デバウンス付き検索 / Debounced search (300ms)
const debouncedSearch = useDebounce(search, 300);

// レベルオプション / Level options
const levelOptions = computed(() => [
  { label: t('vocab.allLevels'), value: '' },
  { label: 'N5', value: 'N5' },
  { label: 'N4', value: 'N4' },
  { label: 'N3', value: 'N3' },
  { label: 'N2', value: 'N2' },
  { label: 'N1', value: 'N1' },
]);

// ステータスオプション / Status options
const statusOptions = computed(() => [
  { label: t('vocab.allStatuses'), value: '' },
  { label: 'Publish', value: 'publish' },
  { label: 'Hide', value: 'hide' },
  { label: 'Deleted', value: 'deleted' },
]);

// フィルター発行 / Emit current filter values
function emitFilters(): void {
  emit('filterChange', {
    search: search.value || undefined,
    level: level.value || undefined,
    status: status.value || undefined,
    tag: tag.value || undefined,
  });
}

// 検索はdebouncedSearchが変化したときに発行 / Emit on debounced search change
import { watch } from 'vue';
watch(debouncedSearch, () => emitFilters());

// セレクト変更時即座に発行 / Emit immediately on select change
function onSelectChange(): void {
  emitFilters();
}

// タグEnterキー / Tag Enter key handler
function onTagKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    emitFilters();
  }
}

// フィルタークリア / Clear all filters
function clearFilters(): void {
  search.value = '';
  level.value = '';
  status.value = '';
  tag.value = '';
  emitFilters();
}
</script>

<template>
  <div class="flex flex-wrap gap-3 mb-4 items-end">
    <div class="flex-1 min-w-[200px]">
      <InputText
        v-model="search"
        :placeholder="t('vocab.searchPlaceholder')"
        class="w-full"
        data-testid="vocab-search-input"
      />
    </div>

    <div class="min-w-[150px]">
      <Select
        v-model="level"
        :options="levelOptions"
        option-label="label"
        option-value="value"
        :placeholder="t('vocab.allLevels')"
        class="w-full"
        data-testid="vocab-level-select"
        @change="onSelectChange"
      />
    </div>

    <div class="min-w-[150px]">
      <Select
        v-model="status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        :placeholder="t('vocab.allStatuses')"
        class="w-full"
        data-testid="vocab-status-select"
        @change="onSelectChange"
      />
    </div>

    <div class="min-w-[150px]">
      <InputText
        v-model="tag"
        :placeholder="t('vocab.tagPlaceholder')"
        class="w-full"
        data-testid="vocab-tag-input"
        @keydown="onTagKeydown"
      />
    </div>

    <Button
      :label="t('common.search')"
      icon="pi pi-times"
      severity="secondary"
      outlined
      data-testid="vocab-clear-btn"
      @click="clearFilters"
    />
  </div>
</template>
