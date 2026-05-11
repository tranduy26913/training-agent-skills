<script setup lang="ts">
/**
 * ChatSessionForm — チャットセッション作成/編集フォームコンポーネント
 * Reusable form for creating or editing a chat session with LLM provider selection.
 * [CR-NBLM-LLM-001] Provider dropdown added for per-session LLM routing.
 */
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import type { ChatSession, ChatLlmProvider } from '@/types/notebooklm.types';

// ---------------------- Props / Emits ----------------------

interface Props {
  /** フォームのモード: create = 新規作成, edit = 既存編集 / Form mode */
  mode: 'create' | 'edit';
  /** 編集モード時の初期データ / Initial data for edit mode */
  initialData?: ChatSession;
  /** 送信中フラグ / Submission loading flag */
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  loading: false,
});

const emit = defineEmits<{
  /** フォーム送信 / Form submitted with title and llmProvider */
  submit: [formData: { title: string; llmProvider: ChatLlmProvider }];
  /** キャンセル / Cancel clicked */
  cancel: [];
}>();

// ---------------------- i18n ----------------------

const { t } = useI18n();

// ---------------------- Form state ----------------------

/** セッションタイトル / Session title input value */
const title = ref(props.initialData?.title ?? '');

/** 選択されたLLMプロバイダー / Selected LLM provider */
const llmProvider = ref<ChatLlmProvider>(props.initialData?.llmProvider ?? 'ollama');

// 編集モードでinitialDataが変わったときに同期する / Sync form when initialData changes
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      title.value = newData.title;
      llmProvider.value = newData.llmProvider;
    }
  },
);

// ---------------------- Provider options ----------------------

/** プロバイダー選択肢 / Provider dropdown options */
const providerOptions = [
  { label: t('notebooklmChat.llmProviderOllama'), value: 'ollama' as const },
  { label: t('notebooklmChat.llmProviderMock'), value: 'mock' as const },
  { label: t('notebooklmChat.llmProviderGemini'), value: 'gemini' as const },
];

// ---------------------- Submit / Cancel ----------------------

/**
 * フォームを送信する / Submit the form
 */
function handleSubmit(): void {
  emit('submit', {
    title: title.value.trim(),
    llmProvider: llmProvider.value,
  });
}

/**
 * キャンセルする / Handle cancel
 */
function handleCancel(): void {
  emit('cancel');
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- タイトル入力 / Title input -->
    <div class="space-y-1">
      <label class="text-sm font-medium">{{ t('notebooklmChat.sessionTitle') }}</label>
      <InputText
        v-model="title"
        :placeholder="t('notebooklmChat.titlePlaceholder')"
        data-testid="session-title-input"
        fluid
      />
    </div>

    <!-- LLMプロバイダー選択 / LLM provider select -->
    <div class="space-y-1">
      <label class="text-sm font-medium">{{ t('notebooklmChat.llmProvider') }}</label>
      <Select
        v-model="llmProvider"
        :options="providerOptions"
        option-label="label"
        option-value="value"
        :placeholder="t('notebooklmChat.llmProvider')"
        data-testid="session-provider-select"
        fluid
      />
    </div>

    <!-- ボタン / Action buttons -->
    <div class="flex gap-2">
      <Button
        type="submit"
        :label="mode === 'create' ? t('notebooklmChat.createSession') : t('common.save')"
        icon="pi pi-check"
        :loading="loading"
        data-testid="session-submit-btn"
      />
      <Button
        type="button"
        :label="t('common.cancel')"
        icon="pi pi-times"
        severity="secondary"
        outlined
        data-testid="session-cancel-btn"
        @click="handleCancel"
      />
    </div>
  </form>
</template>
