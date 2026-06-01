<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Skeleton from 'primevue/skeleton';
import { useLearnStore } from '@/stores/learn.store';
import LevelCard from './components/LevelCard.vue';

// レベル選択ページ / JLPT level selection page
const router = useRouter();
const store = useLearnStore();
const { t } = useI18n();

onMounted(() => {
  store.fetchLevelStats();
});

function handleStart(level: string): void {
  router.push({ name: 'LearnVocabList', params: { level } });
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <h1 class="mb-2 text-3xl font-bold">{{ t('learn.level.pageTitle') }}</h1>
    <p class="mb-6 text-surface-500">{{ t('learn.level.pageSubtitle') }}</p>

    <!-- エラー表示 / Error state -->
    <p v-if="store.error" class="text-red-500">{{ store.error }}</p>

    <!-- ローディング / Loading skeletons -->
    <div v-else-if="store.loadingStats" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="n in 5" :key="n" height="180px" class="rounded-xl" />
    </div>

    <!-- レベルカード一覧 / Level cards grid -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <LevelCard
        v-for="stat in store.levelStats"
        :key="stat.level"
        :level="stat.level"
        :stats="stat"
        @start="handleStart"
      />
    </div>
  </div>
</template>
