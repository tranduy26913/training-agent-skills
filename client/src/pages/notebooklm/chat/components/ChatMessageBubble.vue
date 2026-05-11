<script setup lang="ts">
/**
 * ChatMessageBubble — 単一チャットメッセージバブル
 * Renders a single chat message with role-based styling
 */
import { computed } from 'vue';
import type { ChatMessage } from '@/types/notebooklm.types';
import RetrievalSourceViewer from './RetrievalSourceViewer.vue';

// プロップス / Props
const props = defineProps<{
  message: ChatMessage;
}>();

// ユーザーメッセージかどうか（リアクティブ）/ Reactive role check
const isUser = computed(() => props.message.role === 'user');
</script>

<template>
  <div
    :class="[
      'flex',
      isUser ? 'justify-end' : 'justify-start',
    ]"
  >
    <div
      :class="[
        'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
        isUser
          ? 'bg-primary'
          : 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-100',
      ]"
    >
      <!-- メッセージ本文 / Message content -->
      <p class="whitespace-pre-wrap">{{ message.content }}</p>

      <!-- アシスタントのソース表示 / Retrieval sources for assistant messages -->
      <RetrievalSourceViewer
        v-if="!isUser && message.sources && message.sources.length > 0"
        :sources="message.sources"
        class="mt-2"
      />
    </div>
  </div>
</template>
