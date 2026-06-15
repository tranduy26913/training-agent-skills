<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import VocabularyForm from './components/VocabularyForm.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const confirm = useConfirm();
const toast = useToast();

// Determine if we're in edit mode
const isEdit = computed(() => !!route.params.id);
const vocabularyId = computed(() => route.params.id ? Number(route.params.id) : undefined);

// Track if form has been modified
const hasUnsavedChanges = ref(false);

// Handle successful submission
function handleSubmit(): void {
  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: isEdit.value ? t('vocab.updatedSuccess') : t('vocab.createdSuccess'),
    life: 3000,
  });
  router.push({ name: 'VocabularyList' });
}

// Handle cancel with confirmation if there are unsaved changes
function handleCancel(): void {
  if (hasUnsavedChanges.value) {
    confirm.require({
      message: t('vocab.unsavedChangesConfirm'),
      header: t('vocab.unsavedChangesHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      acceptLabel: t('common.yes'),
      rejectLabel: t('common.no'),
      accept: () => {
        router.back();
      },
    });
  } else {
    router.back();
  }
}

// Go back
function goBack(): void {
  if (hasUnsavedChanges.value) {
    confirm.require({
      message: t('vocab.unsavedChangesConfirm'),
      header: t('vocab.unsavedChangesHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      acceptLabel: t('common.yes'),
      rejectLabel: t('common.no'),
      accept: () => {
        router.back();
      },
    });
  } else {
    router.back();
  }
}

// Set page title
onMounted(() => {
  document.title = isEdit.value 
    ? `${t('vocab.editVocabulary')} | App` 
    : `${t('vocab.createVocabulary')} | App`;
});
</script>

<template>
  <div>
    <!-- Header with Back Button -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-3">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          rounded
          @click="goBack"
        />
        <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100">
          {{ isEdit ? t('vocab.editVocabulary') : t('vocab.createVocabulary') }}
        </h2>
      </div>
    </div>

    <!-- Form Component -->
    <VocabularyForm
      :vocabulary-id="vocabularyId"
      :is-edit="isEdit"
      @submit="handleSubmit"
      @cancel="handleCancel"
      @update:has-changes="(value) => (hasUnsavedChanges.value = value)"
    />

    <ConfirmDialog />
  </div>
</template>
