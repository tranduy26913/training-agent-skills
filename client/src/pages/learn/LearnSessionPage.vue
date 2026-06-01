<script setup lang="ts">
import { shallowRef, onMounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import Skeleton from 'primevue/skeleton';
import { useLearnStore } from '@/stores/learn.store';
import { useLearnSession } from './composables/useLearnSession';
import FlashCard from './components/FlashCard.vue';
import SessionProgress from './components/SessionProgress.vue';
import SessionSummary from './components/SessionSummary.vue';
import CardConfigPanel from './components/CardConfigPanel.vue';
import type { JlptLevel } from '@/types/learn.types';

// フラッシュカードセッションページ / Flashcard study session page
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const store = useLearnStore();

const level = route.params.level as JlptLevel;
const mode = (route.query.mode as 'all' | 'unknown') ?? 'unknown';

// セッションをshallowRefで管理 — nullは語彙ロード前の状態 / Hold session as reactive ref
// Using shallowRef ensures template reactively tracks session object reassignment
const session = shallowRef<ReturnType<typeof useLearnSession> | null>(null);

onMounted(async () => {
  const progressStatus = mode === 'unknown' ? 'new' : 'all';
  await store.fetchVocabularies({ level, progress_status: progressStatus, page: 1, limit: 200 });
  if (store.vocabularies.length > 0) {
    // 語彙ロード後にセッションを初期化 / Initialize session after vocabularies are ready
    session.value = useLearnSession(store.vocabularies);
  }
});

// セッション中の離脱確認 / Route leave guard — confirm before leaving mid-session
onBeforeRouteLeave((_to, _from, next) => {
  const s = session.value;
  if (s && s.currentIndex.value > 0 && !s.isSessionComplete.value) {
    confirm.require({
      message: 'セッションを中断しますか？ / Quit the session?',
      header: '確認 / Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '終了する / Quit',
      rejectLabel: 'キャンセル / Cancel',
      accept: () => next(),
      reject: () => next(false),
    });
  } else {
    next();
  }
});

// カードをめくる / Flip the current card
function handleFlip(): void {
  session.value?.flip();
}

// 「知っている」ボタン / Mark current card as known
async function handleKnown(): Promise<void> {
  const s = session.value;
  if (!s) return;
  s.markKnown();
  if (s.isSessionComplete.value) {
    await saveProgress();
  }
}

// 「要復習」ボタン / Mark current card for review
async function handleUnknown(): Promise<void> {
  const s = session.value;
  if (!s) return;
  s.markUnknown();
  if (s.isSessionComplete.value) {
    await saveProgress();
  }
}

// セッション完了時に進捗保存 / Save progress to backend when session ends
async function saveProgress(): Promise<void> {
  const s = session.value;
  if (s && s.progressUpdates.value.length > 0) {
    await store.batchUpdateProgress(s.progressUpdates.value);
    toast.add({ severity: 'success', summary: '保存完了', detail: '進捗を保存しました', life: 3000 });
  }
}

// お気に入りトグル / Toggle favorite during session
async function handleToggleFavorite(vocabularyId: number): Promise<void> {
  const result = await store.toggleFavorite(vocabularyId);
  if (result !== null) {
    session.value?.recordFavorite(vocabularyId, result.is_favorite);
  }
}

// リトライ / Retry the session with same cards
function handleRetry(): void {
  session.value?.resetSession();
}

// 一覧へ戻る / Return to vocab list
function handleBackToList(): void {
  router.push({ name: 'LearnVocabList', params: { level } });
}
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-8">
    <ConfirmDialog />

    <!-- ヘッダー / Header -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold">{{ level }} フラッシュカード</h1>
      <Button
        icon="pi pi-cog"
        text
        rounded
        aria-label="Card settings"
        @click="session && (session.configVisible.value = true)"
      />
    </div>

    <!-- ローディング / Loading state -->
    <div v-if="store.loading">
      <Skeleton height="220px" class="rounded-2xl" />
    </div>

    <!-- 語彙がない場合 / Empty state -->
    <div v-else-if="store.vocabularies.length === 0" class="py-12 text-center text-surface-500">
      <p>このレベルの学習済み以外の語彙がありません。</p>
      <Button label="一覧へ戻る" class="mt-4" @click="handleBackToList" />
    </div>

    <!-- セッション完了 / Session complete: show summary -->
    <SessionSummary
      v-else-if="session?.isSessionComplete.value"
      :results="session!.sessionResults.value"
      @retry="handleRetry"
      @back-to-list="handleBackToList"
    />

    <!-- セッション進行中 / Active session -->
    <template v-else-if="session">
      <!-- 進捗バー / Progress bar -->
      <SessionProgress
        :current="session.progress.value"
        :total="session.totalCards.value"
        class="mb-6"
      />

      <!-- フラッシュカード / FlashCard -->
      <FlashCard
        v-if="session.currentCard.value"
        :vocab="session.currentCard.value"
        :config="session.config.value"
        :is-flipped="session.isFlipped.value"
        @flip="handleFlip"
        @toggle-favorite="handleToggleFavorite"
      />

      <!-- アクションボタン / Known / Unknown buttons (enabled only after flip) -->
      <div class="mt-6 flex justify-center gap-4">
        <Button
          label="要復習 / Review"
          icon="pi pi-times"
          severity="danger"
          outlined
          :disabled="!session.isFlipped.value"
          @click="handleUnknown"
        />
        <Button
          label="知っている / Known"
          icon="pi pi-check"
          severity="success"
          :disabled="!session.isFlipped.value"
          @click="handleKnown"
        />
      </div>
    </template>

    <!-- カード設定パネル / Card config drawer -->
    <CardConfigPanel
      v-if="session"
      v-model:visible="session.configVisible.value"
      v-model:config="session.config.value"
    />
  </div>
</template>
