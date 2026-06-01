<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

const level = route.params.level as JlptLevel;

// 進捗フィルター / Progress status filter
const progressFilter = ref<'all' | ProgressStatus>('all');
const filterOptions = [
  { label: 'すべて / All', value: 'all' },
  { label: '未学習 / New', value: 'new' },
  { label: '学習中 / Learning', value: 'learning' },
  { label: '習得済 / Known', value: 'known' },
];

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
  if (status === 'known') return '習得済';
  if (status === 'learning') return '学習中';
  return '未学習';
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <!-- ヘッダー / Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">{{ level }} 語彙一覧</h1>
        <p v-if="levelStat" class="text-surface-500">
          {{ levelStat.total }} 語 — 習得 {{ levelStat.known }} / 学習中 {{ levelStat.learning }} / 未学習 {{ levelStat.new_count }}
        </p>
      </div>
      <Button icon="pi pi-arrow-left" text label="レベル選択へ" @click="router.push({ name: 'LearnLevel' })" />
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
        <Button label="すべて学習 / Study All" icon="pi pi-play" outlined @click="startSession('all')" />
        <Button label="未習得を学習 / Study Unknown" icon="pi pi-play" @click="startSession('unknown')" />
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
      <Column field="kanji" header="漢字" />
      <Column field="hiragana" header="ひらがな" />
      <Column field="romaji" header="Romaji" />
      <Column field="meaning_vi" header="Nghĩa" />
      <Column header="進捗 / Progress">
        <template #body="{ data }">
          <Tag
            :severity="statusSeverity(data.progress?.status ?? null)"
            :value="statusLabel(data.progress?.status ?? null)"
          />
        </template>
      </Column>
      <Column header="お気に入り">
        <template #body="{ data }">
          <i
            :class="data.progress?.is_favorite ? 'pi pi-star-fill text-yellow-400' : 'pi pi-star text-surface-300'"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
