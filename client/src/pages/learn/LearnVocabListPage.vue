<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Select from 'primevue/select';
import Skeleton from 'primevue/skeleton';
import { useLearnStore } from '@/stores/learn.store';
import type { JlptLevel, ProgressStatus } from '@/types/learn.types';

// 語彙一覧ページ / Vocabulary list with progress for a JLPT level
const route = useRoute();
const router = useRouter();
const store = useLearnStore();
const { t } = useI18n();

const level = route.params.level as JlptLevel;

// 進捗フィルター / Progress status filter
const progressFilter = ref<'all' | ProgressStatus>('all');
const filterOptions = computed(() => [
  { label: t('learn.vocabList.filterAll'), value: 'all' },
  { label: t('learn.vocabList.filterNew'), value: 'new' },
  { label: t('learn.vocabList.filterLearning'), value: 'learning' },
  { label: t('learn.vocabList.filterKnown'), value: 'known' },
]);

const page = ref(1);

// ページあたり件数 / Items per page
const limit = 50;

// 統計情報 / Level stats
const levelStat = computed(() => store.levelStats.find((s) => s.level === level));

onMounted(() => {
  if (store.levelStats.length === 0) {
    store.fetchLevelStats();
  }
  loadVocabularies();
});

function loadVocabularies(): void {
  store.fetchVocabularies({
    level,
    progress_status: progressFilter.value,
    page: page.value,
    limit,
  });
}

function handleFilterChange(): void {
  page.value = 1;
  loadVocabularies();
}

function handlePageChange(event: { page: number }): void {
  page.value = event.page + 1;
  loadVocabularies();
}

// セッション開始 / Start flashcard session
function startSession(mode: 'all' | 'unknown'): void {
  router.push({
    name: 'LearnSession',
    params: { level },
    query: { mode },
  });
}

// 進捗ステータスの表示設定 / Badge config for progress status
function statusSeverity(status: ProgressStatus | null): 'success' | 'warn' | 'secondary' {
  if (status === 'known') return 'success';
  if (status === 'learning') return 'warn';
  return 'secondary';
}

function statusLabel(status: ProgressStatus | null): string {
  if (status === 'known') return t('learn.vocabList.statusKnown');
  if (status === 'learning') return t('learn.vocabList.statusLearning');
  return t('learn.vocabList.statusNew');
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <!-- ヘッダー / Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">{{ t('learn.vocabList.pageTitle', { level }) }}</h1>
        <p v-if="levelStat" class="text-surface-500">
          {{ levelStat.total }} {{ t('learn.level.words') }} — {{ t('learn.level.known') }} {{ levelStat.known }} / {{ t('learn.level.learning') }} {{ levelStat.learning }} / {{ t('learn.level.newCount') }} {{ levelStat.new_count }}
        </p>
      </div>
      <Button icon="pi pi-arrow-left" text :label="t('learn.vocabList.backToLevel')" @click="router.push({ name: 'LearnLevel' })" />
    </div>

    <!-- フィルター + セッション開始ボタン / Filters and start buttons -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <Select
        v-model="progressFilter"
        :options="filterOptions"
        option-label="label"
        option-value="value"
        @change="handleFilterChange"
      />
      <div class="ml-auto flex gap-2">
        <Button :label="t('learn.vocabList.studyAll')" icon="pi pi-play" outlined @click="startSession('all')" />
        <Button :label="t('learn.vocabList.studyUnknown')" icon="pi pi-play" @click="startSession('unknown')" />
      </div>
    </div>

    <!-- テーブル / Vocabulary table -->
    <Skeleton v-if="store.loading" height="300px" class="rounded-xl" />
    <DataTable
      v-else
      :value="store.vocabularies"
      :paginator="store.pagination.pages > 1"
      :rows="limit"
      :total-records="store.pagination.total"
      lazy
      @page="handlePageChange"
    >
      <Column field="kanji" :header="t('learn.vocabList.colKanji')" />
      <Column field="hiragana" :header="t('learn.vocabList.colHiragana')" />
      <Column field="romaji" :header="t('learn.vocabList.colRomaji')" />
      <Column field="meaning_vi" :header="t('learn.vocabList.colMeaning')" />
      <Column :header="t('learn.vocabList.colProgress')">
        <template #body="{ data }">
          <Tag
            :severity="statusSeverity(data.progress?.status ?? null)"
            :value="statusLabel(data.progress?.status ?? null)"
          />
        </template>
      </Column>
      <Column :header="t('learn.vocabList.colFavorite')">
        <template #body="{ data }">
          <i
            :class="data.progress?.is_favorite ? 'pi pi-star-fill text-yellow-400' : 'pi pi-star text-surface-300'"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
