<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';
import { useDebounceFn } from '@vueuse/core';
import type { VocabLevel, VocabularyStatus } from '@/types/vocabularies.types';

const { t } = useI18n();

// Props are not needed - this is a controlled component
// Parent will listen to events

// Emit definitions
const emit = defineEmits<{
  search: [filters: { kanji?: string; level?: VocabLevel | null; status?: VocabularyStatus | null }]
  reset: []
}>();

// Filter state
const kanji = ref<string>('');
const level = ref<VocabLevel | null | undefined>(null);
const status = ref<VocabularyStatus | null | undefined>(null);

// Level options
const levelOptions = [
  { label: 'N5', value: 'N5' },
  { label: 'N4', value: 'N4' },
  { label: 'N3', value: 'N3' },
  { label: 'N2', value: 'N2' },
  { label: 'N1', value: 'N1' },
];

// Status options
const statusOptions = [
  { label: 'Publish', value: 'Publish' },
  { label: 'Hide', value: 'Hide' },
  { label: 'Delete', value: 'Delete' },
];

// Debounced search handler (300ms)
const debouncedSearch = useDebounceFn(() => {
  emit('search', {
    kanji: kanji.value || undefined,
    level: level.value ?? null,
    status: status.value ?? null,
  });
}, 300);

// Watch for changes and trigger debounced search
watch([kanji, level, status], () => {
  debouncedSearch();
});

// Reset handler
function handleReset(): void {
  kanji.value = '';
  level.value = null;
  status.value = null;
  emit('reset');
}
</script>

<template>
  <div class="flex flex-wrap gap-3 items-end p-4 bg-surface-50 dark:bg-surface-900 rounded-lg">
    <!-- Kanji Filter -->
    <div class="flex flex-col gap-2">
      <label for="kanji-filter" class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('vocab.label.kanji') }}
      </label>
      <InputText
        id="kanji-filter"
        v-model="kanji"
        :placeholder="t('vocab.placeholder.kanji')"
        class="w-48"
      />
    </div>

    <!-- Level Filter -->
    <div class="flex flex-col gap-2">
      <label for="level-filter" class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('vocab.label.level') }}
      </label>
      <Select
        id="level-filter"
        v-model="level"
        :options="levelOptions"
        option-label="label"
        option-value="value"
        :placeholder="t('vocab.placeholder.level')"
        show-clear
        class="w-32"
      />
    </div>

    <!-- Status Filter -->
    <div class="flex flex-col gap-2">
      <label for="status-filter" class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('vocab.label.status') }}
      </label>
      <Select
        id="status-filter"
        v-model="status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        :placeholder="t('vocab.placeholder.status')"
        show-clear
        class="w-32"
      />
    </div>

    <!-- Reset Button -->
    <Button
      :label="t('vocab.btn.reset')"
      icon="pi pi-refresh"
      severity="secondary"
      @click="handleReset"
    />
  </div>
</template>
