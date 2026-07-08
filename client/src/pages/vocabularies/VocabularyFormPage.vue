<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useVocabulariesStore } from '@stores/vocabularies.store';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Skeleton from 'primevue/skeleton';
import Textarea from 'primevue/textarea';
import type {
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyLevel,
  VocabularyStatus,
} from '@apptypes/vocabularies.types';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useVocabulariesStore();

const vocabularyId = computed(() => (route.params.id ? Number(route.params.id) : null));
const isEdit = computed(() => vocabularyId.value !== null);
const tagsText = ref('');

const form = reactive<{
  kanji: string;
  hiragana: string;
  romaji: string;
  meaningVi: string;
  onYomi: string;
  level: VocabularyLevel;
  mediaUrl: string;
  note: string;
  status: VocabularyStatus;
}>({
  kanji: '',
  hiragana: '',
  romaji: '',
  meaningVi: '',
  onYomi: '',
  level: 'N5',
  mediaUrl: '',
  note: '',
  status: 'draft',
});

const levelOptions = [
  { label: 'N5', value: 'N5' },
  { label: 'N4', value: 'N4' },
  { label: 'N3', value: 'N3' },
  { label: 'N2', value: 'N2' },
  { label: 'N1', value: 'N1' },
  { label: 'Other', value: 'Other' },
];

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

const tags = computed(() =>
  tagsText.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
);

onMounted(async () => {
  if (vocabularyId.value === null) return;

  await store.fetchVocabulary(vocabularyId.value);
  if (!store.currentVocabulary) {
    router.push({ name: 'VocabularyList' });
    return;
  }

  form.kanji = store.currentVocabulary.kanji;
  form.hiragana = store.currentVocabulary.hiragana ?? '';
  form.romaji = store.currentVocabulary.romaji ?? '';
  form.meaningVi = store.currentVocabulary.meaningVi;
  form.onYomi = store.currentVocabulary.onYomi ?? '';
  form.level = store.currentVocabulary.level;
  form.mediaUrl = store.currentVocabulary.mediaUrl ?? '';
  form.note = store.currentVocabulary.note ?? '';
  form.status = store.currentVocabulary.status;
  tagsText.value = store.currentVocabulary.tags.join(', ');
});

onUnmounted(() => {
  store.clearCurrentVocabulary();
});

function validateForm(): string | null {
  if (!form.kanji.trim()) return 'Kanji/Kana is required';
  if (/^\d+$/.test(form.kanji.trim())) return 'Kanji/Kana cannot contain only numbers';
  if (!form.meaningVi.trim()) return 'Vietnamese meaning is required';
  if (form.hiragana.trim() && !/^[\u3040-\u30ff\u3400-\u9fff\sー々〆〤]+$/u.test(form.hiragana.trim())) {
    return 'Hiragana/Kana must contain Japanese characters';
  }
  if (form.romaji.trim() && !/^[a-zA-Z\s'-]+$/.test(form.romaji.trim())) {
    return 'Romaji can only contain latin characters';
  }
  if (form.mediaUrl.trim()) {
    try {
      new URL(form.mediaUrl.trim());
    } catch {
      return 'Media URL must be valid';
    }
  }
  if (tags.value.length > 10) return 'Maximum 10 tags allowed';
  if (tags.value.some((tag) => tag.length > 50)) return 'Each tag must be at most 50 characters';
  return null;
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function buildPayload(): CreateVocabularyDto {
  return {
    kanji: form.kanji.trim(),
    hiragana: nullable(form.hiragana),
    romaji: nullable(form.romaji),
    meaningVi: form.meaningVi.trim(),
    onYomi: nullable(form.onYomi),
    level: form.level,
    mediaUrl: nullable(form.mediaUrl),
    note: nullable(form.note),
    tags: tags.value,
    status: form.status,
  };
}

async function handleSave(): Promise<void> {
  const error = validateForm();
  if (error) {
    toast.add({ severity: 'warn', summary: 'Validation', detail: error, life: 3000 });
    return;
  }

  try {
    if (isEdit.value && vocabularyId.value !== null) {
      await store.updateVocabulary(vocabularyId.value, buildPayload() as UpdateVocabularyDto);
    } else {
      await store.createVocabulary(buildPayload());
    }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Vocabulary saved', life: 3000 });
    router.push({ name: 'VocabularyList' });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'Save failed', life: 3000 });
  }
}

function handleCancel(): void {
  router.push({ name: 'VocabularyList' });
}
</script>

<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <Button label="Back" icon="pi pi-arrow-left" class="p-button-text mb-3" @click="handleCancel" />
        <h1 class="page-title">{{ isEdit ? 'Sua tu vung' : 'Tao tu vung' }}</h1>
        <p class="page-subtitle">Thong tin tu vung tieng Nhat cho nguoi hoc</p>
      </div>
      <Button label="Save" icon="pi pi-save" severity="success" @click="handleSave" />
    </div>

    <div v-if="store.loading && isEdit" class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div class="surface-card p-5">
        <Skeleton height="2rem" class="mb-4" />
        <Skeleton height="12rem" />
      </div>
      <div class="surface-card p-5">
        <Skeleton height="16rem" />
      </div>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section class="surface-card p-5">
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-2 block text-sm font-semibold">Kanji/Kana</label>
            <InputText v-model="form.kanji" class="w-full" placeholder="Example: 学校" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">Hiragana/Kana</label>
            <InputText v-model="form.hiragana" class="w-full" placeholder="Example: がっこう" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">Romaji</label>
            <InputText v-model="form.romaji" class="w-full" placeholder="Example: gakkou" />
          </div>

          <div class="sm:col-span-2">
            <label class="mb-2 block text-sm font-semibold">Nghia tieng Viet</label>
            <Textarea v-model="form.meaningVi" class="w-full" rows="4" placeholder="Example: truong hoc" />
            <p class="mt-1 text-xs text-surface-500">{{ form.meaningVi.length }}/1000</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">On-yomi</label>
            <InputText v-model="form.onYomi" class="w-full" placeholder="Example: GAKU" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">Media URL</label>
            <InputText v-model="form.mediaUrl" class="w-full" placeholder="https://..." />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">Level</label>
            <Select v-model="form.level" :options="levelOptions" option-label="label" option-value="value" class="w-full" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">Status</label>
            <Select v-model="form.status" :options="statusOptions" option-label="label" option-value="value" class="w-full" />
          </div>
        </div>
      </section>

      <aside class="space-y-6">
        <section class="surface-card p-5">
          <label class="mb-2 block text-sm font-semibold">Tags</label>
          <InputText v-model="tagsText" class="w-full" placeholder="noun, school, n5" />
          <p class="mt-2 text-xs text-surface-500">Separate tags with commas. Max 10 tags.</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <Tag v-for="tag in tags" :key="tag" :value="tag" severity="secondary" />
          </div>
        </section>

        <section class="surface-card p-5">
          <label class="mb-2 block text-sm font-semibold">Note</label>
          <Textarea v-model="form.note" class="w-full" rows="8" placeholder="Ghi chu cach dung, vi du, ngu canh..." />
          <p class="mt-1 text-xs text-surface-500">{{ form.note.length }}/2000</p>
        </section>
      </aside>
    </div>
  </div>
</template>
