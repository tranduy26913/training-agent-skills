<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import InputChips from 'primevue/inputchips';
import Button from 'primevue/button';
import { vocabularyFormSchema } from '../composables/vocabularies.form.schema';
import type { Vocabulary, VocabularySimple, CreateVocabularyDto } from '../composables/useVocabularies';

const { t } = useI18n();

// Props / プロパティ定義
const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit';
    initialData?: Vocabulary | null;
    loading?: boolean;
    vocabularyOptions: VocabularySimple[];
  }>(),
  {
    mode: 'create',
    initialData: null,
    loading: false,
  },
);

// Emits / イベント定義
const emit = defineEmits<{
  submit: [data: CreateVocabularyDto];
  cancel: [];
}>();

// フォーム状態 / Reactive form state
const form = reactive({
  meaning_vi: '',
  hiragana: '',
  romaji: '',
  kanji: '',
  sino_vi: '',
  level: 'N5' as string,
  status: 'publish' as string,
  image_url: '',
  note: '',
  tags: [] as string[],
  related_ids: [] as number[],
  synonym_ids: [] as number[],
  antonym_ids: [] as number[],
});

// バリデーションエラー / Validation errors
const errors = reactive<Record<string, string>>({});

// レベルオプション / Level options
const levelOptions = [
  { label: 'N5', value: 'N5' },
  { label: 'N4', value: 'N4' },
  { label: 'N3', value: 'N3' },
  { label: 'N2', value: 'N2' },
  { label: 'N1', value: 'N1' },
];

// ステータスオプション / Status options
const statusOptions = [
  { label: 'Publish', value: 'publish' },
  { label: 'Hide', value: 'hide' },
  { label: 'Deleted', value: 'deleted' },
];

// 初期データで事前入力 / Pre-fill with initialData in edit mode
function applyInitialData() {
  if (props.mode === 'edit' && props.initialData) {
    const d = props.initialData as Vocabulary & {
      romaji?: string;
      sino_vi?: string;
      image_url?: string;
      note?: string;
      tags?: string[];
      related_ids?: number[];
      synonym_ids?: number[];
      antonym_ids?: number[];
    };
    form.meaning_vi = d.meaning_vi ?? '';
    form.hiragana = d.hiragana ?? '';
    form.romaji = d.romaji ?? '';
    form.kanji = d.kanji ?? '';
    form.sino_vi = d.sino_vi ?? '';
    form.level = d.level ?? '';
    form.status = d.status ?? 'publish';
    form.image_url = d.image_url ?? '';
    form.note = d.note ?? '';
    form.tags = d.tags ? [...d.tags] : [];
    form.related_ids = d.related_ids ? [...d.related_ids] : [];
    form.synonym_ids = d.synonym_ids ? [...d.synonym_ids] : [];
    form.antonym_ids = d.antonym_ids ? [...d.antonym_ids] : [];
  }
}

applyInitialData();
watch(() => props.initialData, applyInitialData, { deep: true });

// エラークリア / Clear field error
function clearError(field: string) {
  delete errors[field];
}

// フォーム送信 / Submit form with Zod validation
function handleSubmit() {
  // Clear all errors
  Object.keys(errors).forEach((k) => delete errors[k]);

  const result = vocabularyFormSchema.safeParse({ ...form });

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
    return;
  }

  emit('submit', result.data as CreateVocabularyDto);
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Nghĩa TV / MeaningVi -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.meaningVi') }} <span class="text-red-500">*</span></label>
      <InputText
        v-model="form.meaning_vi"
        :placeholder="t('vocab.meaningViPlaceholder')"
        class="w-full"
        data-testid="vocab-meaning-vi-input"
        @input="clearError('meaning_vi')"
      />
      <small v-if="errors.meaning_vi" class="p-error block mt-1" data-testid="vocab-meaning-vi-error">
        {{ errors.meaning_vi }}
      </small>
    </div>

    <!-- Hiragana -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.hiragana') }} <span class="text-red-500">*</span></label>
      <InputText
        v-model="form.hiragana"
        :placeholder="t('vocab.hiraganaPlaceholder')"
        class="w-full"
        data-testid="vocab-hiragana-input"
        @input="clearError('hiragana')"
      />
      <small v-if="errors.hiragana" class="p-error block mt-1" data-testid="vocab-hiragana-error">
        {{ errors.hiragana }}
      </small>
    </div>

    <!-- Romaji -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.romaji') }}</label>
      <InputText
        v-model="form.romaji"
        :placeholder="t('vocab.romajiPlaceholder')"
        class="w-full"
        data-testid="vocab-romaji-input"
      />
    </div>

    <!-- Kanji -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.kanji') }}</label>
      <InputText
        v-model="form.kanji"
        :placeholder="t('vocab.kanjiPlaceholder')"
        class="w-full"
        data-testid="vocab-kanji-input"
      />
    </div>

    <!-- Sino-Vietnamese -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.sinoVi') }}</label>
      <InputText
        v-model="form.sino_vi"
        :placeholder="t('vocab.sinoViPlaceholder')"
        class="w-full"
        data-testid="vocab-sino-vi-input"
      />
    </div>

    <!-- Level + Status row -->
    <div class="grid grid-cols-2 gap-4">
      <div class="field">
        <label class="block text-sm font-medium mb-1">{{ t('vocab.level') }} <span class="text-red-500">*</span></label>
        <Select
          v-model="form.level"
          :options="levelOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('vocab.level')"
          class="w-full"
          data-testid="vocab-level-select-form"
          @change="clearError('level')"
        />
        <small v-if="errors.level" class="p-error block mt-1" data-testid="vocab-level-error">
          {{ errors.level }}
        </small>
      </div>

      <div class="field">
        <label class="block text-sm font-medium mb-1">{{ t('vocab.status') }} <span class="text-red-500">*</span></label>
        <Select
          v-model="form.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          data-testid="vocab-status-select-form"
          @change="clearError('status')"
        />
      </div>
    </div>

    <!-- Image URL -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.imageUrl') }}</label>
      <InputText
        v-model="form.image_url"
        :placeholder="t('vocab.imageUrlPlaceholder')"
        class="w-full"
        data-testid="vocab-image-url-input"
        @input="clearError('image_url')"
      />
      <small v-if="errors.image_url" class="p-error block mt-1" data-testid="vocab-image-url-error">
        {{ errors.image_url }}
      </small>
    </div>

    <!-- Note -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.note') }}</label>
      <Textarea
        v-model="form.note"
        :placeholder="t('vocab.notePlaceholder')"
        class="w-full"
        :rows="4"
        data-testid="vocab-note-input"
        @input="clearError('note')"
      />
      <small v-if="errors.note" class="p-error block mt-1" data-testid="vocab-note-error">
        {{ errors.note }}
      </small>
    </div>

    <!-- Tags -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.tags') }}</label>
      <InputChips
        v-model="form.tags"
        :placeholder="t('vocab.tagsPlaceholder')"
        class="w-full"
        data-testid="vocab-tags-input"
        @change="clearError('tags')"
      />
      <small v-if="errors.tags" class="p-error block mt-1" data-testid="vocab-tags-error">
        {{ errors.tags }}
      </small>
    </div>

    <!-- Related Words -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.related') }}</label>
      <MultiSelect
        v-model="form.related_ids"
        :options="vocabularyOptions"
        option-label="hiragana"
        option-value="id"
        :placeholder="t('vocab.relatedPlaceholder')"
        class="w-full"
        data-testid="vocab-related-select"
        display="chip"
        filter
      />
    </div>

    <!-- Synonyms -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.synonyms') }}</label>
      <MultiSelect
        v-model="form.synonym_ids"
        :options="vocabularyOptions"
        option-label="hiragana"
        option-value="id"
        :placeholder="t('vocab.synonymPlaceholder')"
        class="w-full"
        data-testid="vocab-synonym-select"
        display="chip"
        filter
      />
    </div>

    <!-- Antonyms -->
    <div class="field">
      <label class="block text-sm font-medium mb-1">{{ t('vocab.antonyms') }}</label>
      <MultiSelect
        v-model="form.antonym_ids"
        :options="vocabularyOptions"
        option-label="hiragana"
        option-value="id"
        :placeholder="t('vocab.antonymPlaceholder')"
        class="w-full"
        data-testid="vocab-antonym-select"
        display="chip"
        filter
      />
    </div>

    <!-- Action buttons -->
    <div class="flex justify-end gap-3 pt-4 border-t border-surface-200">
      <Button
        type="button"
        :label="t('common.cancel')"
        severity="secondary"
        outlined
        data-testid="vocab-cancel-btn"
        @click="emit('cancel')"
      />
      <Button
        type="button"
        :label="t('common.save')"
        :loading="loading"
        data-testid="vocab-save-btn"
        @click="handleSubmit"
      />
    </div>
  </form>
</template>
