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
          :exclude-ids="isEdit ? [formData.id as number] : undefined"
          @update:model-value="(v) => updateField('related_ids', v)"
        />

        <VocabRelationSelect
          :model-value="formData.synonym_ids || []"
          relation-type="synonym"
          :label="t('vocab.label.synonyms')"
          :exclude-ids="isEdit ? [formData.id as number] : undefined"
          @update:model-value="(v) => updateField('synonym_ids', v)"
        />

        <VocabRelationSelect
          :model-value="formData.antonym_ids || []"
          relation-type="antonym"
          :label="t('vocab.label.antonyms')"
          :exclude-ids="isEdit ? [formData.id as number] : undefined"
          @update:model-value="(v) => updateField('antonym_ids', v)"
        />
      </div>
    </Fluid>
  </div>
</template>
