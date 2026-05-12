<script setup lang="ts">
/**
 * ChatPanel — チャット会話コンポーネント
 * Displays messages and provides a send input
 */
import { ref, watch, nextTick } from 'vue';
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

// メッセージ一覧の末尾要素への参照 / Ref to the scroll container bottom anchor
const messagesBottomRef = ref<HTMLElement | null>(null);

/**
 * メッセージエリアを最下部までスクロールする
 * Scroll the messages container to the latest message
 */
async function scrollToBottom(): Promise<void> {
  await nextTick();
  messagesBottomRef.value?.scrollIntoView({ behavior: 'smooth' });
}

// メッセージが増えたとき自動スクロール / Auto-scroll when messages change or loading ends
watch(() => [props.messages.length, props.loading], scrollToBottom, { immediate: true });

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
      <div class="flex h-[calc(100vh-250px)] flex-col gap-0">
        <!-- メッセージエリア / Scrollable messages area -->
        <div class="min-h-0 flex-1 overflow-y-auto space-y-3 px-2 py-3 bg-surface-50 dark:bg-surface-900 rounded-lg mb-3">
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
          <div v-if="loading" class="flex justify-start py-3 pl-2">
            <div class="flex items-center gap-2 rounded-2xl border border-surface-200 bg-white px-4 py-2 text-sm dark:border-surface-700 dark:bg-surface-800">
              <i class="pi pi-spin pi-spinner text-2xl text-primary" />
              <span class="text-surface-500 text-xs">{{ t('notebooklmChat.thinking') }}</span>
            </div>
          </div>

          <!-- スクロール用アンカー / Scroll anchor at bottom -->
          <div ref="messagesBottomRef" />
        </div>

        <!-- 入力エリア (ChatGPTライク) / ChatGPT-style input area -->
        <div class="flex items-center gap-2 rounded-2xl border border-surface-300 bg-white px-3 py-2 shadow-md dark:border-surface-600 dark:bg-surface-800 focus-within:border-primary transition-all">
          <Textarea
            v-model="inputText"
            :placeholder="t('notebooklmChat.messagePlaceholder')"
            :disabled="loading"
            rows="1"
            auto-resize
            class="flex-1 resize-none border-none bg-transparent text-sm outline-none focus:outline-none focus:ring-0 !overflow-hidden"
            data-testid="chat-message-input"
            @keydown="handleKeydown"
          />
          <!-- 送信ボタン（丸型、アイコンのみ）/ Round send button with icon only -->
          <Button
            icon="pi pi-send"
            :disabled="loading || !inputText.trim()"
            rounded
            class="shrink-0"
            data-testid="chat-send-btn"
            @click="handleSend"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
