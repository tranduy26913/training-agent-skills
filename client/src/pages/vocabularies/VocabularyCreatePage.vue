<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useVocabulariesStore } from '@/stores/vocabularies.store';
import VocabularyInfoTab from './components/VocabularyInfoTab.vue';
import type { CreateVocabularyDto } from './composables/useVocabularies';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const vocabStore = useVocabulariesStore();

// シンプルリスト読み込み / Load simple list for MultiSelect on mount
onMounted(() => {
  vocabStore.fetchSimpleList();
});

// フォーム送信ハンドラ / Handle form submit
async function handleSubmit(dto: CreateVocabularyDto): Promise<void> {
  try {
    await vocabStore.createVocabulary(dto);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('vocab.createdSuccess'),
      life: 3000,
    });
    router.push({ name: 'VocabularyList' });
  } catch {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('vocab.deletedError'),
      life: 3000,
    });
  }
}

// キャンセルハンドラ / Cancel and navigate back to list
function handleCancel(): void {
  router.push({ name: 'VocabularyList' });
}
</script>

<template>
  <div data-testid="vocab-create-page">
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100">
        {{ t('vocab.createTitle') }}
      </h2>
    </div>

    <div class="card bg-surface-0 dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
      <VocabularyInfoTab
        mode="create"
        :loading="vocabStore.loading"
        :vocabulary-options="vocabStore.simpleList"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
