<script setup lang="ts">
/**
 * ChatSessionListPage — チャットセッション一覧ページ
 * Lists all chat sessions for a workspace
 */
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useNotebooklmChatStore } from '@/stores/notebooklm-chat.store';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const chatStore = useNotebooklmChatStore();

// ルートパラメータからworkspaceIdを取得 / Derive workspaceId from route params
const workspaceId = computed(() => Number(route.params.workspaceId));

onMounted(async () => {
  if (!Number.isFinite(workspaceId.value)) return;
  await chatStore.fetchSessions(workspaceId.value);
});

/** セッション詳細ページへ遷移する / Navigate to session edit page */
function handleOpen(sessionId: number): void {
  router.push({
    name: 'NotebooklmChatSessionEdit',
    params: { workspaceId: workspaceId.value, sessionId },
  });
}

/** セッション作成ページへ遷移する / Navigate to session create page */
function handleNew(): void {
  router.push({
    name: 'NotebooklmChatSessionCreate',
    params: { workspaceId: workspaceId.value },
  });
}

/** ワークスペース編集ページへ戻る / Back to workspace edit page */
function handleBack(): void {
  router.push({ name: 'NotebooklmWorkspaceEdit', params: { id: workspaceId.value } });
}
</script>

<template>
  <div class="space-y-4">
    <Card>
      <template #content>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div>
              <h2 class="text-2xl font-semibold">{{ t('notebooklmChat.title') }}</h2>
            </div>
          </div>
          <Button
            type="button"
            :label="t('notebooklmChat.newSession')"
            icon="pi pi-plus"
            class="w-full sm:w-auto"
            @click="handleNew"
          />
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <!-- ローディング中 / Loading indicator -->
        <div v-if="chatStore.loading" class="flex justify-center py-8">
          <i class="pi pi-spin pi-spinner text-3xl text-primary" />
        </div>

        <!-- セッションなし / Empty state -->
        <div
          v-else-if="chatStore.sessions.length === 0"
          class="py-8 text-center text-surface-500"
        >
          {{ t('notebooklmChat.noSessions') }}
        </div>

        <!-- セッション一覧 / Session list -->
        <div v-else class="divide-y divide-surface-200 dark:divide-surface-700">
          <div
            v-for="session in chatStore.sessions"
            :key="session.id"
            class="flex items-center justify-between py-3"
          >
            <div>
              <p class="font-medium">{{ session.title }}</p>
              <p class="text-xs text-surface-400">{{ session.createdAt }}</p>
            </div>
            <Button
              :label="t('notebooklmChat.openSession')"
              severity="secondary"
              size="small"
              @click="handleOpen(session.id)"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
