<script setup lang="ts">
/**
 * ChatPanel — チャット会話コンポーネント
 * Displays messages and provides a send input
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import type { ChatMessage } from '@/types/notebooklm.types';
import ChatMessageBubble from './ChatMessageBubble.vue';

// プロップス / Props
const props = defineProps<{
  messages: ChatMessage[];
  loading: boolean;
}>();

// エミット / Emits
const emit = defineEmits<{
  (e: 'send', content: string): void;
}>();

const { t } = useI18n();

// 入力テキスト / Current textarea value
const inputText = ref('');

/**
 * メッセージを送信する
 * Emit send event and clear input
 */
function handleSend(): void {
  const content = inputText.value.trim();
  if (!content || props.loading) return;
  emit('send', content);
  inputText.value = '';
}

/**
 * Enterキー押下でメッセージ送信、Shift+Enterで改行 
 * Send on Enter, newline on Shift+Enter
 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <Card data-testid="chat-panel">
    <template #content>
      <div class="flex h-[600px] flex-col gap-3">
        <!-- メッセージエリア / Scrollable messages area -->
        <div class="flex-1 overflow-y-auto space-y-3 pr-1">
          <!-- メッセージなし / Empty state -->
          <p v-if="messages.length === 0 && !loading" class="text-center text-surface-400 py-12">
            {{ t('notebooklmChat.noMessages') }}
          </p>

          <!-- メッセージバブル一覧 / Message bubbles -->
          <ChatMessageBubble
            v-for="message in messages"
            :key="message.id"
            :message="message"
          />

          <!-- 応答待ちスピナー / Loading spinner while waiting for response -->
          <div v-if="loading" class="flex justify-start py-2">
            <i class="pi pi-spin pi-spinner text-xl text-primary" />
          </div>
        </div>

        <!-- 入力エリア / Input area at the bottom -->
        <div class="flex gap-2 border-t border-surface-200 pt-3 dark:border-surface-700">
          <Textarea
            v-model="inputText"
            :placeholder="t('notebooklmChat.messagePlaceholder')"
            :disabled="loading"
            rows="2"
            class="flex-1 resize-none"
            data-testid="chat-message-input"
            @keydown="handleKeydown"
          />
          <Button
            :label="t('notebooklmChat.sendMessage')"
            icon="pi pi-send"
            :disabled="loading || !inputText.trim()"
            data-testid="chat-send-btn"
            @click="handleSend"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
