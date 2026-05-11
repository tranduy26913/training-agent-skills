<script setup lang="ts">
/**
 * ChatSessionCreatePage — チャットセッション作成ページ
 * Create a new chat session for a workspace
 */
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useNotebooklmChatStore } from '@/stores/notebooklm-chat.store';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const chatStore = useNotebooklmChatStore();

// ルートパラメータからworkspaceIdを取得 / Derive workspaceId from route params
const workspaceId = computed(() => Number(route.params.workspaceId));

// フォームフィールド / Form fields
const title = ref('');
const submitting = ref(false);

/**
 * セッションを作成してセッション詳細ページへ遷移する
 * Submit form: create session then navigate to it
 */
async function handleSubmit(): Promise<void> {
  submitting.value = true;
  try {
    const session = await chatStore.createSession(workspaceId.value, {
      title: title.value.trim() || undefined,
    });
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('notebooklmChat.createdSuccess'),
      life: 3000,
    });
    router.push({
      name: 'NotebooklmChatSessionEdit',
      params: { workspaceId: workspaceId.value, sessionId: session.id },
    });
  } finally {
    submitting.value = false;
  }
}

/** キャンセルしてセッション一覧へ戻る / Cancel and return to list */
function handleCancel(): void {
  router.push({ name: 'NotebooklmChatSessionList', params: { workspaceId: workspaceId.value } });
}
</script>

<template>
  <div class="space-y-4">
    <Card>
      <template #content>
        <div class="flex items-center gap-3">
          <Button
            type="button"
            :label="t('common.back')"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            data-testid="chat-back-btn"
            @click="handleCancel"
          />
          <h2 class="text-2xl font-semibold">{{ t('notebooklmChat.newSession') }}</h2>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- タイトル入力 / Optional title input -->
          <div class="space-y-1">
            <label class="text-sm font-medium">{{ t('notebooklmChat.sessionTitle') }}</label>
            <InputText
              v-model="title"
              :placeholder="t('notebooklmChat.titlePlaceholder')"
              data-testid="session-title-input"
              fluid
            />
          </div>

          <div class="flex gap-2">
            <Button
              type="submit"
              :label="t('notebooklmChat.createSession')"
              icon="pi pi-check"
              :loading="submitting"
              data-testid="session-create-btn"
            />
            <Button
              type="button"
              :label="t('common.cancel')"
              severity="secondary"
              @click="handleCancel"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
