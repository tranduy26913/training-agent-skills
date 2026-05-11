<script setup lang="ts">
/**
 * ChatSessionEditPage — チャットセッション詳細ページ
 * View and interact with a single chat session
 */
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useNotebooklmChatStore } from '@/stores/notebooklm-chat.store';
import ChatPanel from './components/ChatPanel.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const chatStore = useNotebooklmChatStore();

// ルートパラメータからsessionIdとworkspaceIdを取得 / Derive IDs from route params
const workspaceId = computed(() => Number(route.params.workspaceId));
const sessionId = computed(() => Number(route.params.sessionId));

onMounted(async () => {
  if (!Number.isFinite(sessionId.value)) return;
  await chatStore.fetchMessages(sessionId.value);
});

/**
 * メッセージを送信する
 * Handle sending a chat message
 */
async function handleSend(content: string): Promise<void> {
  await chatStore.sendMessage(sessionId.value, { content });
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
        </div>
      </template>
    </Card>

    <ChatPanel
      :messages="chatStore.messages"
      :loading="chatStore.loadingMessages"
      @send="handleSend"
    />
  </div>
</template>
