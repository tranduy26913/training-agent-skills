// useLearnSession コンポーザブル / Manages the lifecycle of a flashcard session
import { ref, computed, readonly } from 'vue';
import type { LearnVocabularyItem, CardConfig, SessionResults, ProgressUpdateItem } from '@/types/learn.types';

/** デフォルトカード設定 / Default card configuration */
export function createDefaultCardConfig(): CardConfig {
  return {
    flipDirection: 'kanji_to_meaning',
    frontFields: { kanji: true, hiragana: true, romaji: false, meaning_vi: false },
    backFields:  { kanji: false, hiragana: false, romaji: false, meaning_vi: true },
  };
}

/**
 * useLearnSession — セッション状態管理 / Session state management composable
 * @param cards   Array of vocabulary items to study in this session
 */
export function useLearnSession(cards: LearnVocabularyItem[]) {
  // --- 状態 / State ---
  const currentIndex  = ref(0);
  const isFlipped     = ref(false);
  const isSessionComplete = ref(false);
  const config        = ref<CardConfig>(createDefaultCardConfig());
  const configVisible = ref(false);

  // セッション中の進捗追跡 / Track per-card known/unknown decisions during session
  const decisions     = ref<Map<number, 'known' | 'unknown'>>(new Map());

  // セッション中に新たにお気に入りした語彙ID / Vocab IDs newly favorited this session
  const newFavoriteIds = ref<Set<number>>(new Set());

  // --- 算出プロパティ / Computed ---
  const currentCard = computed<LearnVocabularyItem | null>(() => cards[currentIndex.value] ?? null);
  const totalCards  = computed(() => cards.length);
  const progress    = computed(() => currentIndex.value + 1);

  const sessionResults = computed<SessionResults>(() => {
    let knownCount = 0;
    let unknownCount = 0;
    decisions.value.forEach((decision) => {
      if (decision === 'known') knownCount++;
      else unknownCount++;
    });
    return {
      knownCount,
      unknownCount,
      newFavoriteCount: newFavoriteIds.value.size,
    };
  });

  // バッチ更新用ペイロード / Build payload for batchUpdateProgress API call
  const progressUpdates = computed<ProgressUpdateItem[]>(() => {
    const updates: ProgressUpdateItem[] = [];
    decisions.value.forEach((decision, vocabularyId) => {
      updates.push({
        vocabulary_id: vocabularyId,
        status: decision === 'known' ? 'known' : 'learning',
      });
    });
    return updates;
  });

  // --- アクション / Actions ---

  /** カードをめくる / Flip the current card */
  function flip(): void {
    isFlipped.value = !isFlipped.value;
  }

  /** 「知っている」マーク / Mark current card as known and advance */
  function markKnown(): void {
    if (!currentCard.value) return;
    decisions.value.set(currentCard.value.id, 'known');
    advance();
  }

  /** 「要復習」マーク / Mark current card for review and advance */
  function markUnknown(): void {
    if (!currentCard.value) return;
    decisions.value.set(currentCard.value.id, 'unknown');
    advance();
  }

  /** 次のカードへ / Advance to next card or complete session */
  function advance(): void {
    isFlipped.value = false;
    if (currentIndex.value < cards.length - 1) {
      currentIndex.value++;
    } else {
      isSessionComplete.value = true;
    }
  }

  /** お気に入りを記録 / Record a new favorite during session */
  function recordFavorite(vocabularyId: number, isFavorite: boolean): void {
    if (isFavorite) {
      newFavoriteIds.value.add(vocabularyId);
    } else {
      newFavoriteIds.value.delete(vocabularyId);
    }
  }

  /** セッションをリセット / Reset session to start */
  function resetSession(): void {
    currentIndex.value = 0;
    isFlipped.value = false;
    isSessionComplete.value = false;
    decisions.value.clear();
    newFavoriteIds.value.clear();
  }

  return {
    // State (readonly)
    currentIndex:    readonly(currentIndex),
    isFlipped:       readonly(isFlipped),
    isSessionComplete: readonly(isSessionComplete),
    config,
    configVisible,
    // Computed
    currentCard,
    totalCards,
    progress,
    sessionResults,
    progressUpdates,
    // Actions
    flip,
    markKnown,
    markUnknown,
    resetSession,
    recordFavorite,
  };
}
