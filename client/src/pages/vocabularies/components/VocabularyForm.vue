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
        id: detail.id,
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
      };

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
  
  if (!formData.value.kanji?.trim()) {
    formErrors.value.kanji = t('vocab.validation.kanji_required');
  }
  
  if (!formData.value.meaning_vi?.trim()) {
    formErrors.value.meaning_vi = t('vocab.validation.meaning_required');
  }
  
  return Object.keys(formErrors.value).length === 0;
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
      <TabPanel :header="t('vocab.tab.info')">
        <TabInfo
          :form-data="formData"
          :errors="formErrors"
          :is-edit="isEdit"
          @update:form-data="(data) => (formData = data)"
        />
      </TabPanel>

      <!-- Tab 2: Audit -->
      <TabPanel :header="t('vocab.tab.audit')" v-if="isEdit && vocabulary">
        <TabAudit
          :vocabulary="vocabulary"
          :is-admin="isAdmin"
          @resolve-report="handleResolveReport"
        />
      </TabPanel>

      <!-- Tab 3: Analytics -->
      <TabPanel :header="t('vocab.tab.analytics')" v-if="isEdit">
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
