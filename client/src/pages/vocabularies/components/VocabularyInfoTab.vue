<script setup lang="ts">
import { shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import AutoComplete from 'primevue/autocomplete';
import type { VocabSummary } from '@/types/vocabularies.types';
import { useVocabularies } from '@/pages/vocabularies/composables/useVocabularies';

const { t } = useI18n();
const composable = useVocabularies();

// Props - form field bindings from parent useForm setup / 親フォームのフィールドバインド
const props = defineProps<{
  // vee-validate field bindings
  meaningViValue: string;
  meaningViError: string | undefined;
  hiraganaValue: string;
  romajiValue: string;
  kanjiValue: string;
  sinoViValue: string;
  levelValue: string;
  levelError: string | undefined;
  statusValue: string;
  statusError: string | undefined;
  mediaUrlValue: string;
  mediaUrlError: string | undefined;
  noteValue: string;
  tagsValue: string[];
  relatedWordsValue: VocabSummary[];
  synonymsValue: VocabSummary[];
  antonymsValue: VocabSummary[];
  currentId?: number;
}>();

const emit = defineEmits<{
  'update:meaningViValue': [v: string];
  'update:hiraganaValue': [v: string];
  'update:romajiValue': [v: string];
  'update:kanjiValue': [v: string];
  'update:sinoViValue': [v: string];
  'update:levelValue': [v: string];
  'update:statusValue': [v: string];
  'update:mediaUrlValue': [v: string];
  'update:noteValue': [v: string];
  'update:tagsValue': [v: string[]];
  'update:relatedWordsValue': [v: VocabSummary[]];
  'update:synonymsValue': [v: VocabSummary[]];
  'update:antonymsValue': [v: VocabSummary[]];
}>();


// タグオートコンプリート候補 / Tag autocomplete suggestions
const tagSuggestions = shallowRef<string[]>([]);
let tagDebounce: ReturnType<typeof setTimeout> | null = null;

async function onTagSearch(event: { query: string }): Promise<void> {
  if (tagDebounce) clearTimeout(tagDebounce);
  tagDebounce = setTimeout(async () => {
    tagSuggestions.value = await composable.suggestTags(event.query);
  }, 300);
}

// 関係語MultiSelectの検索候補 / Relationship word search suggestions
const relatedSuggestions = shallowRef<VocabSummary[]>([]);
const synonymSuggestions = shallowRef<VocabSummary[]>([]);
const antonymSuggestions = shallowRef<VocabSummary[]>([]);

// 表示用ラベルフォーマット / Format VocabSummary for display: "kanji (meaning_vi)" or "hiragana (meaning_vi)"
function vocabLabel(v: VocabSummary): string {
  const word = v.kanji || v.hiragana || '';
  return `${word} (${v.meaning_vi})`;
}

async function onRelatedSearch(event: { query: string }): Promise<void> {
  relatedSuggestions.value = await composable.search(event.query, props.currentId);
}
async function onSynonymSearch(event: { query: string }): Promise<void> {
  synonymSuggestions.value = await composable.search(event.query, props.currentId);
}
async function onAntonymSearch(event: { query: string }): Promise<void> {
  antonymSuggestions.value = await composable.search(event.query, props.currentId);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 意味（ベトナム語）/ Vietnamese meaning - required -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.meaningVi') }} <span class="text-red-500">*</span></label>
      <InputText
        :value="meaningViValue"
        :placeholder="t('vocabularies.form.meaningViPlaceholder')"
        :class="{ 'p-invalid': meaningViError }"
        data-testid="field-meaning-vi"
        @input="emit('update:meaningViValue', ($event.target as HTMLInputElement).value)"
      />
      <small v-if="meaningViError" class="text-red-500" data-testid="error-meaning-vi">
        {{ meaningViError }}
      </small>
    </div>

    <!-- ひらがな / Hiragana -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.hiragana') }}</label>
      <InputText
        :value="hiraganaValue"
        :placeholder="t('vocabularies.form.hiraganaPlaceholder')"
        data-testid="field-hiragana"
        @input="emit('update:hiraganaValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- ローマ字 / Romaji -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.romaji') }}</label>
      <InputText
        :value="romajiValue"
        :placeholder="t('vocabularies.form.romajiPlaceholder')"
        data-testid="field-romaji"
        @input="emit('update:romajiValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- 漢字 / Kanji -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.kanji') }}</label>
      <InputText
        :value="kanjiValue"
        :placeholder="t('vocabularies.form.kanjiPlaceholder')"
        data-testid="field-kanji"
        @input="emit('update:kanjiValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- 漢越音 / Sino-Vietnamese -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.sinoVi') }}</label>
      <InputText
        :value="sinoViValue"
        :placeholder="t('vocabularies.form.sinoViPlaceholder')"
        data-testid="field-sino-vi"
        @input="emit('update:sinoViValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- レベル / Level - required -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">{{ t('vocabularies.form.level') }} <span class="text-red-500">*</span></label>
        <select
          :value="levelValue"
          :class="['border border-surface-300 rounded-lg px-3 py-2 text-sm w-full', { 'border-red-500': levelError }]"
          data-testid="field-level"
          @change="emit('update:levelValue', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('vocabularies.form.level') }}</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>
        <small v-if="levelError" class="text-red-500" data-testid="error-level">
          {{ levelError }}
        </small>
      </div>

      <!-- ステータス / Status - required -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">{{ t('vocabularies.form.status') }} <span class="text-red-500">*</span></label>
        <select
          :value="statusValue"
          :class="['border border-surface-300 rounded-lg px-3 py-2 text-sm w-full', { 'border-red-500': statusError }]"
          data-testid="field-status"
          @change="emit('update:statusValue', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('vocabularies.form.status') }}</option>
          <option value="publish">Publish</option>
          <option value="hide">Hide</option>
          <option value="delete">Delete</option>
        </select>
        <small v-if="statusError" class="text-red-500" data-testid="error-status">
          {{ statusError }}
        </small>
      </div>
    </div>

    <!-- 画像URL / Media URL -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.mediaUrl') }}</label>
      <InputText
        :value="mediaUrlValue"
        :placeholder="t('vocabularies.form.mediaUrlPlaceholder')"
        :class="{ 'p-invalid': mediaUrlError }"
        data-testid="field-media-url"
        @input="emit('update:mediaUrlValue', ($event.target as HTMLInputElement).value)"
      />
      <small v-if="mediaUrlError" class="text-red-500" data-testid="error-media-url">
        {{ mediaUrlError }}
      </small>
    </div>

    <!-- タグ / Tags autocomplete -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.tags') }}</label>
      <AutoComplete
        :model-value="tagsValue"
        :suggestions="tagSuggestions"
        :placeholder="t('vocabularies.form.tagPlaceholder')"
        multiple
        force-selection
        data-testid="field-tags"
        @complete="onTagSearch"
        @update:model-value="emit('update:tagsValue', $event)"
      />
    </div>

    <!-- 関連語 / Related words -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.relatedWords') }}</label>
      <AutoComplete
        :model-value="relatedWordsValue"
        :suggestions="relatedSuggestions"
        :option-label="vocabLabel"
        :placeholder="t('vocabularies.form.relatedPlaceholder')"
        multiple
        data-testid="field-related-words"
        @complete="onRelatedSearch"
        @update:model-value="emit('update:relatedWordsValue', $event)"
      />
    </div>

    <!-- 同義語 / Synonyms -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.synonyms') }}</label>
      <AutoComplete
        :model-value="synonymsValue"
        :suggestions="synonymSuggestions"
        :option-label="vocabLabel"
        :placeholder="t('vocabularies.form.synonymPlaceholder')"
        multiple
        data-testid="field-synonyms"
        @complete="onSynonymSearch"
        @update:model-value="emit('update:synonymsValue', $event)"
      />
    </div>

    <!-- 反義語 / Antonyms -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.antonyms') }}</label>
      <AutoComplete
        :model-value="antonymsValue"
        :suggestions="antonymSuggestions"
        :option-label="vocabLabel"
        :placeholder="t('vocabularies.form.antonymPlaceholder')"
        multiple
        data-testid="field-antonyms"
        @complete="onAntonymSearch"
        @update:model-value="emit('update:antonymsValue', $event)"
      />
    </div>

    <!-- メモ / Notes -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium">{{ t('vocabularies.form.note') }}</label>
      <Textarea
        :value="noteValue"
        :placeholder="t('vocabularies.form.notePlaceholder')"
        rows="3"
        data-testid="field-note"
        @input="emit('update:noteValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </div>
</template>
