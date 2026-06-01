<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import type { LearnVocabularyItem, CardConfig } from '@/types/learn.types';

// フラッシュカードコンポーネント / Interactive flash card with flip animation
const props = defineProps<{
  vocab: LearnVocabularyItem;
  config: CardConfig;
  isFlipped: boolean;
}>();

const emit = defineEmits<{
  flip: [];
  toggleFavorite: [vocabularyId: number];
}>();

// 表面に表示するフィールド / Fields visible on front face
const frontFields = computed(() => {
  const f = props.config.frontFields;
  const v = props.vocab;
  return {
    kanji: f.kanji && v.kanji,
    hiragana: f.hiragana ? v.hiragana : null,
    romaji: f.romaji ? v.romaji : null,
    meaning_vi: f.meaning_vi ? v.meaning_vi : null,
  };
});

// 裏面に表示するフィールド / Fields visible on back face
const backFields = computed(() => {
  const b = props.config.backFields;
  const v = props.vocab;
  return {
    kanji: b.kanji && v.kanji,
    hiragana: b.hiragana ? v.hiragana : null,
    romaji: b.romaji ? v.romaji : null,
    meaning_vi: b.meaning_vi ? v.meaning_vi : null,
  };
});

const isFavorite = computed(() => props.vocab.progress?.is_favorite ?? false);
</script>

<template>
  <div
    class="card-scene cursor-pointer select-none"
    style="perspective: 1000px;"
    @click="emit('flip')"
  >
    <div
      class="card-inner relative transition-transform duration-500"
      :class="{ 'rotate-y-180': isFlipped }"
      style="transform-style: preserve-3d; min-height: 220px;"
    >
      <!-- 表面 / Front face -->
      <div
        class="card-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-md dark:border-surface-700 dark:bg-surface-900"
        style="backface-visibility: hidden;"
      >
        <span v-if="frontFields.kanji" class="text-5xl font-bold text-primary">{{ vocab.kanji }}</span>
        <span v-if="frontFields.hiragana" class="text-2xl text-surface-600">{{ vocab.hiragana }}</span>
        <span v-if="frontFields.romaji" class="text-lg italic text-surface-500">{{ vocab.romaji }}</span>
        <span v-if="frontFields.meaning_vi" class="text-xl text-surface-700 dark:text-surface-300">{{ vocab.meaning_vi }}</span>
        <p class="mt-2 text-sm text-surface-400">タップして裏返す / Tap to flip</p>
      </div>

      <!-- 裏面 / Back face -->
      <div
        class="card-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-6 shadow-md dark:border-primary-700 dark:bg-primary-950"
        style="backface-visibility: hidden; transform: rotateY(180deg);"
      >
        <span v-if="backFields.kanji" class="text-5xl font-bold text-primary">{{ vocab.kanji }}</span>
        <span v-if="backFields.hiragana" class="text-2xl text-surface-600">{{ vocab.hiragana }}</span>
        <span v-if="backFields.romaji" class="text-lg italic text-surface-500">{{ vocab.romaji }}</span>
        <span v-if="backFields.meaning_vi" class="text-xl text-surface-700 dark:text-surface-300">{{ vocab.meaning_vi }}</span>
        <p v-if="vocab.note" class="text-sm text-surface-400">{{ vocab.note }}</p>
      </div>
    </div>

    <!-- お気に入りボタン / Favorite toggle (outside flip area) -->
    <div class="mt-2 flex justify-end" @click.stop>
      <Button
        :icon="isFavorite ? 'pi pi-star-fill' : 'pi pi-star'"
        :class="isFavorite ? 'text-yellow-500' : 'text-surface-400'"
        text
        rounded
        aria-label="Toggle favorite"
        @click="emit('toggleFavorite', vocab.id)"
      />
    </div>
  </div>
</template>
