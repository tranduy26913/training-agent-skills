<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useVocabulariesStore } from '@stores/vocabularies.store';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Skeleton from 'primevue/skeleton';
import Tag from 'primevue/tag';
import type { Vocabulary, VocabularyLevel, VocabularyStatus } from '@apptypes/vocabularies.types';

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const store = useVocabulariesStore();

const filters = reactive<{
  search: string;
  level: VocabularyLevel | '';
  status: VocabularyStatus | '';
}>({
  search: '',
  level: '',
  status: '',
});

const levelOptions = [
  { label: 'All levels', value: '' },
  { label: 'N5', value: 'N5' },
  { label: 'N4', value: 'N4' },
  { label: 'N3', value: 'N3' },
  { label: 'N2', value: 'N2' },
  { label: 'N1', value: 'N1' },
  { label: 'Other', value: 'Other' },
];

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

const statusSeverityMap: Record<VocabularyStatus, 'secondary' | 'success' | 'warn'> = {
  draft: 'secondary',
  published: 'success',
  archived: 'warn',
};

onMounted(async () => {
  await fetchVocabularies();
});

async function fetchVocabularies(): Promise<void> {
  await store.fetchVocabularies({
    search: filters.search.trim() || undefined,
    level: filters.level,
    status: filters.status,
  });
}

function resetFilters(): void {
  filters.search = '';
  filters.level = '';
  filters.status = '';
  void fetchVocabularies();
}

function goCreate(): void {
  router.push({ name: 'VocabularyCreate' });
}

function goEdit(id: number): void {
  router.push({ name: 'VocabularyEdit', params: { id } });
}

function deleteVocabulary(vocabulary: Vocabulary): void {
  confirm.require({
    message: `Delete vocabulary "${vocabulary.kanji}"?`,
    header: 'Delete vocabulary',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await store.deleteVocabulary(vocabulary.id);
        await fetchVocabularies();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Vocabulary deleted', life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'Delete failed', life: 3000 });
      }
    },
  });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('vi-VN');
}
</script>

<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quan ly tu vung</h1>
        <p class="page-subtitle">Tao va quan ly tu vung hoc tieng Nhat</p>
      </div>
      <Button label="Tao tu vung" icon="pi pi-plus" @click="goCreate" />
    </div>

    <section class="surface-card p-4 sm:p-5">
      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto_auto]">
        <InputText
          v-model="filters.search"
          placeholder="Tim theo kanji, hiragana, romaji, nghia..."
          class="w-full"
          @keyup.enter="fetchVocabularies"
        />
        <Select v-model="filters.level" :options="levelOptions" option-label="label" option-value="value" class="w-full" />
        <Select v-model="filters.status" :options="statusOptions" option-label="label" option-value="value" class="w-full" />
        <Button label="Search" icon="pi pi-search" @click="fetchVocabularies" />
        <Button label="Reset" icon="pi pi-refresh" severity="secondary" outlined @click="resetFilters" />
      </div>
    </section>

    <div v-if="store.loading" class="surface-card p-4 sm:p-5">
      <div v-for="i in 6" :key="i" class="border-b border-surface-100 py-4 last:border-b-0 dark:border-surface-800">
        <Skeleton class="mb-2" height="1.25rem" width="35%" />
        <Skeleton height="0.875rem" width="70%" />
      </div>
    </div>

    <div
      v-else-if="store.vocabularies.length === 0"
      class="surface-card flex flex-col items-center justify-center px-6 py-20 text-surface-400"
    >
      <i class="pi pi-book text-6xl mb-4"></i>
      <p class="text-lg mb-4">Chua co tu vung nao</p>
      <Button label="Tao tu vung" icon="pi pi-plus" @click="goCreate" />
    </div>

    <section v-else class="surface-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-[980px] w-full text-left text-sm">
          <thead class="bg-surface-50 text-xs uppercase text-surface-500 dark:bg-surface-800 dark:text-surface-400">
            <tr>
              <th class="px-4 py-3">Kanji/Kana</th>
              <th class="px-4 py-3">Hiragana</th>
              <th class="px-4 py-3">Romaji</th>
              <th class="px-4 py-3">Nghia</th>
              <th class="px-4 py-3">Level</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Updated</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <tr
              v-for="vocabulary in store.vocabularies"
              :key="vocabulary.id"
              class="cursor-pointer transition hover:bg-surface-50 dark:hover:bg-surface-800/60"
              @click="goEdit(vocabulary.id)"
            >
              <td class="px-4 py-4">
                <div class="font-semibold text-surface-900 dark:text-surface-100">{{ vocabulary.kanji }}</div>
                <div class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="tag in vocabulary.tags.slice(0, 3)"
                    :key="tag"
                    class="rounded bg-surface-100 px-2 py-0.5 text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300"
                  >
                    {{ tag }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 text-surface-600 dark:text-surface-300">{{ vocabulary.hiragana || '-' }}</td>
              <td class="px-4 py-4 text-surface-600 dark:text-surface-300">{{ vocabulary.romaji || '-' }}</td>
              <td class="max-w-[280px] px-4 py-4">
                <p class="line-clamp-2 text-surface-700 dark:text-surface-200">{{ vocabulary.meaningVi }}</p>
              </td>
              <td class="px-4 py-4">
                <Tag :value="vocabulary.level" severity="info" />
              </td>
              <td class="px-4 py-4">
                <Tag :value="vocabulary.status" :severity="statusSeverityMap[vocabulary.status]" />
              </td>
              <td class="px-4 py-4 text-surface-500">{{ formatDate(vocabulary.updatedAt) }}</td>
              <td class="px-4 py-4" @click.stop>
                <div class="flex justify-end gap-2">
                  <Button icon="pi pi-pencil" rounded text aria-label="Edit" @click="goEdit(vocabulary.id)" />
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    aria-label="Delete"
                    @click="deleteVocabulary(vocabulary)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ConfirmDialog />
  </div>
</template>
