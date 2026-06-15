<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Fluid from 'primevue/fluid';
import type { VocabLevel, VocabularyStatus, CreateVocabularyDto, UpdateVocabularyDto } from '@/types/vocabularies.types';
import VocabRelationSelect from './VocabRelationSelect.vue';

const { t } = useI18n();

// Props
const props = defineProps<{
  formData: CreateVocabularyDto | UpdateVocabularyDto;
  errors?: Record<string, string>;
  isEdit?: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:formData': [data: CreateVocabularyDto | UpdateVocabularyDto];
}>();

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

// Validation patterns
const HIRAGANA_KATAKANA_REGEX = /^[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]*$/;
const ROMAJI_REGEX = /^[a-z\s]*$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// Validate individual fields
function validateKanji(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return t('vocab.validation.kanji_required');
  }
  if (value.trim().length > 255) {
    return t('vocab.validation.kanji_max_length');
  }
  if (/^\d+$/.test(value.trim())) {
    return t('vocab.validation.kanji_numbers_only');
  }
  return null;
}

function validateHiragana(value: string | null | undefined): string | null {
  if (!value) {
    return null; // Optional field
  }
  if (value.length > 255) {
    return t('vocab.validation.hiragana_max_length');
  }
  if (!HIRAGANA_KATAKANA_REGEX.test(value)) {
    return t('vocab.validation.hiragana_invalid_chars');
  }
  return null;
}

function validateRomaji(value: string | null | undefined): string | null {
  if (!value) {
    return null; // Optional field
  }
  if (value.length > 255) {
    return t('vocab.validation.romaji_max_length');
  }
  if (!ROMAJI_REGEX.test(value)) {
    return t('vocab.validation.romaji_invalid_chars');
  }
  return null;
}

function validateMeaningVi(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return t('vocab.validation.meaning_required');
  }
  if (value.trim().length > 1000) {
    return t('vocab.validation.meaning_max_length');
  }
  return null;
}

function validateOnYomi(value: string | null | undefined): string | null {
  if (!value) {
    return null; // Optional field
  }
  if (value.length > 255) {
    return t('vocab.validation.on_yomi_max_length');
  }
  return null;
}

function validateMediaUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null; // Optional field
  }
  if (value && !URL_REGEX.test(value)) {
    return t('vocab.validation.media_url_invalid');
  }
  return null;
}

function validateNote(value: string | null | undefined): string | null {
  if (!value) {
    return null; // Optional field
  }
  if (value.length > 2000) {
    return t('vocab.validation.note_max_length');
  }
  return null;
}

function validateTags(value: string[] | null | undefined): string | null {
  if (!value || value.length === 0) {
    return null; // Optional field
  }
  if (value.length > 10) {
    return t('vocab.validation.tags_max_count');
  }
  const invalidTag = value.find((tag) => tag.length > 50);
  if (invalidTag) {
    return t('vocab.validation.tags_max_length');
  }
  return null;
}

// Update form field
function updateField<K extends keyof CreateVocabularyDto>(field: K, value: CreateVocabularyDto[K]): void {
  emit('update:formData', { ...props.formData, [field]: value });
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Kanji (Required) -->
    <Fluid>
      <div class="flex flex-col gap-2">
        <label for="kanji" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.kanji') }} <span class="text-red-500">*</span>
        </label>
        <InputText
          id="kanji"
          :model-value="formData.kanji"
          :invalid="!!errors?.kanji"
          :placeholder="t('vocab.placeholder.kanji')"
          @update:model-value="(v) => updateField('kanji', v)"
        />
        <small v-if="errors?.kanji" class="text-red-500">{{ errors.kanji }}</small>
      </div>
    </Fluid>

    <!-- Hiragana -->
    <Fluid>
      <div class="flex flex-col gap-2">
        <label for="hiragana" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.hiragana') }}
        </label>
        <InputText
          id="hiragana"
          :model-value="formData.hiragana"
          :placeholder="t('vocab.placeholder.hiragana')"
          @update:model-value="(v) => updateField('hiragana', v)"
        />
      </div>
    </Fluid>

    <!-- Romaji -->
    <Fluid>
      <div class="flex flex-col gap-2">
        <label for="romaji" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.romaji') }}
        </label>
        <InputText
          id="romaji"
          :model-value="formData.romaji"
          :placeholder="t('vocab.placeholder.romaji')"
          @update:model-value="(v) => updateField('romaji', v)"
        />
      </div>
    </Fluid>

    <!-- Meaning Vi (Required) -->
    <Fluid>
      <div class="flex flex-col gap-2">
        <label for="meaning_vi" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.meaning_vi') }} <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="meaning_vi"
          :model-value="formData.meaning_vi"
          :invalid="!!errors?.meaning_vi"
          :placeholder="t('vocab.placeholder.meaning')"
          rows="3"
          class="w-full"
          @update:model-value="(v) => updateField('meaning_vi', v)"
        />
        <small v-if="errors?.meaning_vi" class="text-red-500">{{ errors.meaning_vi }}</small>
      </div>
    </Fluid>

    <!-- On'yomi -->
    <Fluid>
      <div class="flex flex-col gap-2">
        <label for="on_yomi" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.on_yomi') }}
        </label>
        <InputText
          id="on_yomi"
          :model-value="formData.on_yomi"
          :placeholder="t('vocab.placeholder.on_yomi')"
          @update:model-value="(v) => updateField('on_yomi', v)"
        />
      </div>
    </Fluid>

    <!-- Level -->
    <Fluid>
      <div class="flex flex-col gap-2">
        <label for="level" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.level') }}
        </label>
        <Select
          id="level"
          :model-value="formData.level"
          :options="levelOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('vocab.placeholder.level')"
          show-clear
          class="w-full"
          @update:model-value="(v) => updateField('level', v)"
        />
      </div>
    </Fluid>

    <!-- Media URL -->
    <Fluid>
      <div class="flex flex-col gap-2">
        <label for="media_url" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.media_url') }}
        </label>
        <InputText
          id="media_url"
          :model-value="formData.media_url"
          :placeholder="t('vocab.placeholder.media_url')"
          @update:model-value="(v) => updateField('media_url', v)"
        />
      </div>
    </Fluid>

    <!-- Note -->
    <Fluid class="md:col-span-2">
      <div class="flex flex-col gap-2">
        <label for="note" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.note') }}
        </label>
        <Textarea
          id="note"
          :model-value="formData.note"
          :placeholder="t('vocab.placeholder.note')"
          rows="3"
          class="w-full"
          @update:model-value="(v) => updateField('note', v)"
        />
      </div>
    </Fluid>

    <!-- Tags -->
    <Fluid class="md:col-span-2">
      <div class="flex flex-col gap-2">
        <label for="tags" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.tags') }}
        </label>
        <InputText
          id="tags"
          :model-value="formData.tags?.join(', ')"
          :placeholder="t('vocab.placeholder.tags')"
          @update:model-value="(v) => updateField('tags', v.split(',').map((t) => t.trim()).filter(Boolean))"
        />
        <small class="text-surface-500">{{ t('vocab.helper.tags') }}</small>
      </div>
    </Fluid>

    <!-- Status -->
    <Fluid>
      <div class="flex flex-col gap-2">
        <label for="status" class="text-sm font-medium text-surface-700 dark:text-surface-300">
          {{ t('vocab.label.status') }}
        </label>
        <Select
          id="status"
          :model-value="formData.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('vocab.placeholder.status')"
          class="w-full"
          @update:model-value="(v) => updateField('status', v)"
        />
      </div>
    </Fluid>

    <!-- Relations -->
    <Fluid class="md:col-span-2">
      <div class="flex flex-col gap-4 mt-4">
        <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100">
          {{ t('vocab.label.relations_section') }}
        </h3>
        
        <VocabRelationSelect
          :model-value="formData.related_ids || []"
          relation-type="related"
          :label="t('vocab.label.related')"
          :exclude-ids="isEdit && formData.id ? [formData.id] : undefined"
          @update:model-value="(v) => updateField('related_ids', v)"
        />

        <VocabRelationSelect
          :model-value="formData.synonym_ids || []"
          relation-type="synonym"
          :label="t('vocab.label.synonyms')"
          :exclude-ids="isEdit && formData.id ? [formData.id] : undefined"
          @update:model-value="(v) => updateField('synonym_ids', v)"
        />

        <VocabRelationSelect
          :model-value="formData.antonym_ids || []"
          relation-type="antonym"
          :label="t('vocab.label.antonyms')"
          :exclude-ids="isEdit && formData.id ? [formData.id] : undefined"
          @update:model-value="(v) => updateField('antonym_ids', v)"
        />
      </div>
    </Fluid>
  </div>
</template>
