<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import MultiSelect from 'primevue/multiselect';
import { useVocabularies } from '../composables/useVocabularies';
import type { VocabRelationDto, VocabRelationType } from '@/types/vocabularies.types';

const { t } = useI18n();
const { getRelationOptions, loading } = useVocabularies();

// Props
const props = defineProps<{
  modelValue: number[];
  relationType: VocabRelationType;
  label: string;
  excludeIds?: number[];
}>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [ids: number[]];
}>();

// Options for MultiSelect
const options = ref<VocabRelationDto[]>([]);

// Load relation options
async function loadOptions(): Promise<void> {
  try {
    options.value = await getRelationOptions(props.excludeIds);
  } catch (err) {
    console.error('Failed to load relation options:', err);
  }
}

// Reload options when excludeIds change
watch(() => props.excludeIds, () => {
  loadOptions();
}, { deep: true });

onMounted(() => {
  loadOptions();
});

// Handle selection change
function handleChange(selectedIds: number[]): void {
  emit('update:modelValue', selectedIds);
}

// Format display label for each option
function formatOptionLabel(option: VocabRelationDto): string {
  return option.hiragana ? `${option.kanji} (${option.hiragana})` : option.kanji;
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
      {{ label }}
    </label>
    <MultiSelect
      :model-value="modelValue"
      :options="options"
      option-label="kanji"
      option-value="id"
      :loading="loading"
      :placeholder="t('vocab.placeholder.relations')"
      class="w-full"
      display="chip"
      @update:model-value="handleChange"
    >
      <template #option="{ option }">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ option.kanji }}</span>
          <span v-if="option.hiragana" class="text-surface-500 text-sm">({{ option.hiragana }})</span>
          <span v-if="option.level" class="text-xs">
            {{ option.level }}
          </span>
        </div>
      </template>
      <template #chip="{ value }">
        <div class="flex items-center gap-1">
          <span>{{ value.kanji }}</span>
          <span v-if="value.hiragana" class="text-surface-500 text-xs">({{ value.hiragana }})</span>
        </div>
      </template>
    </MultiSelect>
  </div>
</template>
