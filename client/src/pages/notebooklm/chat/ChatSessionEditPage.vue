<script setup lang="ts">
/**
 * ChatSessionEditPage — チャットセッション詳細ページ
 * View and interact with a single chat session
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTitle } from '@vueuse/core';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useNotebooklmChatStore } from '@/stores/notebooklm-chat.store';
import ChatPanel from './components/ChatPanel.vue';
import ChatSessionForm from './components/ChatSessionForm.vue';
import type { ChatLlmProvider } from '@/types/notebooklm.types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const chatStore = useNotebooklmChatStore();

// ルートパラメータからsessionIdとworkspaceIdを取得 / Derive IDs from route params
const workspaceId = computed(() => Number(route.params.workspaceId));
const sessionId = computed(() => Number(route.params.sessionId));

// セッション設定の編集表示フラグ / Toggle for the session settings form
const showSettings = ref(false);
const submittingSettings = ref(false);

// ページタイトルをセッション名に合わせて動的更新 / Dynamic page title from session title
const pageTitle = useTitle();
watch(
  () => chatStore.currentSession?.title,
  (title) => {
    pageTitle.value = title ? `${title} | App` : 'Chat Session | App';
  },
);

onMounted(async () => {
  if (!Number.isFinite(sessionId.value)) return;
  await Promise.all([
    chatStore.fetchCurrentSession(sessionId.value),
    chatStore.fetchMessages(sessionId.value),
  ]);
});

/**
 * メッセージを送信する
 * Handle sending a chat message
 */
async function handleSend(content: string): Promise<void> {
  await chatStore.sendMessage(sessionId.value, {
    content,
    llmProvider: chatStore.currentSession?.llmProvider,
  });
}

/**
 * セッション設定(タイトル/プロバイダー)を更新する
 * Update session title and provider
 */
async function handleSettingsSubmit(formData: { title: string; llmProvider: ChatLlmProvider }): Promise<void> {
  submittingSettings.value = true;
  try {
    await chatStore.updateSession(sessionId.value, {
      title: formData.title,
      llmProvider: formData.llmProvider,
    });
    showSettings.value = false;
  } finally {
    submittingSettings.value = false;
  }
}

/** セッション一覧ページへ戻る / Back to session list */
function handleBack(): void {
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
            @click="handleBack"
          />
          <h2 class="text-2xl font-semibold">{{ chatStore.currentSession?.title ?? 'Chat' }}</h2>
          <span
            v-if="chatStore.currentSession"
            class="ml-2 text-xs font-mono bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded"
            data-testid="session-provider-badge"
          >
            {{ chatStore.currentSession.llmProvider }}
          </span>
          <Button
            type="button"
            :label="t('common.settings')"
            icon="pi pi-cog"
            severity="secondary"
            text
            data-testid="chat-settings-btn"
            @click="showSettings = !showSettings"
          />
        </div>
      </template>
    </Card>

    <!-- セッション設定フォーム / Session settings form (title + provider) -->
    <Card v-if="showSettings && chatStore.currentSession">
      <template #content>
        <ChatSessionForm
          mode="edit"
          :initial-data="chatStore.currentSession"
          :loading="submittingSettings"
          @submit="handleSettingsSubmit"
          @cancel="showSettings = false"
        />
      </template>
    </Card>

    <ChatPanel
      :messages="chatStore.messages"
      :loading="chatStore.loadingMessages"
      @send="handleSend"
    />
  </div>
</template>
