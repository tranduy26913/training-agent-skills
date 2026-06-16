<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import { useVocabularies } from '../composables/useVocabularies';
import TabInfo from './TabInfo.vue';
import TabAudit from './TabAudit.vue';
import TabAnalytics from './TabAnalytics.vue';
import type { VocabularyDetail, CreateVocabularyDto, UpdateVocabularyDto, AnalyticsData } from '@/types/vocabularies.types';

const { t } = useI18n();
const { getVocabulary, createVocabulary, updateVocabulary, getAnalytics, resolveReport, loading, error } = useVocabularies();

// Props
const props = defineProps<{
  vocabularyId?: number;
  isEdit?: boolean;
}>();

// Emits
const emit = defineEmits<{
  submit: [];
  cancel: [];
  'update:hasChanges': [boolean];
}>();

// Form data
const formData = ref<CreateVocabularyDto | UpdateVocabularyDto>({
  kanji: '',
  hiragana: null,
  romaji: null,
  meaning_vi: '',
  on_yomi: null,
  level: null,
  media_url: null,
  note: null,
  tags: [],
  status: 'Publish',
  related_ids: [],
  synonym_ids: [],
  antonym_ids: [],
});

// Track if form has changes
let initialData: CreateVocabularyDto | UpdateVocabularyDto | null = null;

watch(formData, () => {
  if (initialData) {
    const hasChanges = JSON.stringify(formData.value) !== JSON.stringify(initialData);
    emit('update:hasChanges', hasChanges);
  }
}, { deep: true });

// Form errors
const formErrors = ref<Record<string, string>>({});

// Vocabulary detail (for edit mode)
const vocabulary = ref<VocabularyDetail | null>(null);

// Analytics data
const analytics = ref<AnalyticsData | null>(null);

// Active tab index
const activeTabIndex = ref(0);

// Load vocabulary data in edit mode
watch(() => props.vocabularyId, async (id) => {
  if (id && props.isEdit) {
    try {
      const detail = await getVocabulary(id);
      vocabulary.value = detail;
      
      // Populate form data
      formData.value = {
        kanji: detail.kanji,
        hiragana: detail.hiragana,
        romaji: detail.romaji,
        meaning_vi: detail.meaning_vi,
        on_yomi: detail.on_yomi,
        level: detail.level,
        media_url: detail.media_url,
        note: detail.note,
        tags: detail.tags,
        status: detail.status,
        related_ids: detail.related_vocab.map((v) => v.id),
        synonym_ids: detail.synonym_vocab.map((v) => v.id),
        antonym_ids: detail.antonym_vocab.map((v) => v.id),
      } as UpdateVocabularyDto;

      // Save initial data for change tracking
      initialData = JSON.parse(JSON.stringify(formData.value));

      // Load analytics
      analytics.value = await getAnalytics(id);
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
    }
  }
}, { immediate: true });

// Validate form
function validateForm(): boolean {
  formErrors.value = {};
  
  const kanjiError = validateField('kanji', formData.value.kanji);
  if (kanjiError) formErrors.value.kanji = kanjiError;
  
  const hiraganaError = validateField('hiragana', formData.value.hiragana);
  if (hiraganaError) formErrors.value.hiragana = hiraganaError;
  
  const romajiError = validateField('romaji', formData.value.romaji);
  if (romajiError) formErrors.value.romaji = romajiError;
  
  const meaningError = validateField('meaning_vi', formData.value.meaning_vi);
  if (meaningError) formErrors.value.meaning_vi = meaningError;
  
  const onYomiError = validateField('on_yomi', formData.value.on_yomi);
  if (onYomiError) formErrors.value.on_yomi = onYomiError;
  
  const mediaUrlError = validateField('media_url', formData.value.media_url);
  if (mediaUrlError) formErrors.value.media_url = mediaUrlError;
  
  const noteError = validateField('note', formData.value.note);
  if (noteError) formErrors.value.note = noteError;
  
  const tagsError = validateField('tags', formData.value.tags);
  if (tagsError) formErrors.value.tags = tagsError;
  
  return Object.keys(formErrors.value).length === 0;
}

// Validate individual field
function validateField(field: string, value: any): string | null {
  switch (field) {
    case 'kanji':
      if (!value?.trim()) return t('vocab.validation.kanji_required');
      if (value.trim().length > 255) return t('vocab.validation.kanji_max_length');
      if (/^\d+$/.test(value.trim())) return t('vocab.validation.kanji_numbers_only');
      return null;
    case 'hiragana':
      if (!value) return null;
      if (value.length > 255) return t('vocab.validation.hiragana_max_length');
      if (!/^[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]*$/.test(value)) return t('vocab.validation.hiragana_invalid_chars');
      return null;
    case 'romaji':
      if (!value) return null;
      if (value.length > 255) return t('vocab.validation.romaji_max_length');
      if (!/^[a-z\s]*$/.test(value)) return t('vocab.validation.romaji_invalid_chars');
      return null;
    case 'meaning_vi':
      if (!value?.trim()) return t('vocab.validation.meaning_required');
      if (value.trim().length > 1000) return t('vocab.validation.meaning_max_length');
      return null;
    case 'on_yomi':
      if (!value) return null;
      if (value.length > 255) return t('vocab.validation.on_yomi_max_length');
      return null;
    case 'media_url':
      if (!value) return null;
      if (value && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value)) return t('vocab.validation.media_url_invalid');
      return null;
    case 'note':
      if (!value) return null;
      if (value.length > 2000) return t('vocab.validation.note_max_length');
      return null;
    case 'tags':
      if (!value || value.length === 0) return null;
      if (value.length > 10) return t('vocab.validation.tags_max_count');
      if (value.some((tag: string) => tag.length > 50)) return t('vocab.validation.tags_max_length');
      return null;
    default:
      return null;
  }
}

// Handle form submission
async function handleSubmit(): Promise<void> {
  if (!validateForm()) {
    activeTabIndex.value = 0; // Switch to info tab to show errors
    return;
  }

  try {
    if (props.isEdit && props.vocabularyId) {
      await updateVocabulary(props.vocabularyId, formData.value as UpdateVocabularyDto);
    } else {
      await createVocabulary(formData.value as CreateVocabularyDto);
    }
    emit('submit');
  } catch (err) {
    console.error('Failed to save vocabulary:', err);
  }
}

// Handle cancel
function handleCancel(): void {
  emit('cancel');
}

// Handle report resolution
async function handleResolveReport(vocabId: number, reportId: number, status: 'resolved' | 'dismissed'): Promise<void> {
  try {
    await resolveReport(vocabId, reportId, status);
    // Reload vocabulary to get updated reports
    if (props.vocabularyId) {
      vocabulary.value = await getVocabulary(props.vocabularyId);
    }
  } catch (err) {
    console.error('Failed to resolve report:', err);
  }
}

// Check if user is admin (for report resolution)
const isAdmin = computed(() => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  try {
    const parsed = JSON.parse(user);
    return parsed.role === 'admin';
  } catch {
    return false;
  }
});
</script>

<template>
  <div class="space-y-4">
    <TabView v-model:active-index="activeTabIndex">
      <!-- Tab 1: Thông tin -->
      <TabPanel value="info" :header="t('vocab.tab.info')">
        <TabInfo
          :form-data="formData"
          :errors="formErrors"
          :is-edit="isEdit"
          @update:form-data="(data) => (formData = data)"
        />
      </TabPanel>

      <!-- Tab 2: Audit -->
      <TabPanel value="audit" :header="t('vocab.tab.audit')" v-if="isEdit && vocabulary">
        <TabAudit
          :vocabulary="vocabulary"
          :is-admin="isAdmin"
          @resolve-report="handleResolveReport"
        />
      </TabPanel>

      <!-- Tab 3: Analytics -->
      <TabPanel value="analytics" :header="t('vocab.tab.analytics')" v-if="isEdit">
        <TabAnalytics :analytics="analytics" />
      </TabPanel>
    </TabView>

    <!-- Form Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
      <Button
        :label="t('vocab.btn.cancel')"
        severity="secondary"
        @click="handleCancel"
      />
      <Button
        :label="t('vocab.btn.save')"
        :loading="loading"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>
