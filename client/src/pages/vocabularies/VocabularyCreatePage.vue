<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import ConfirmDialog from 'primevue/confirmdialog';
import VocabularyAnalyticsTab from './components/VocabularyAnalyticsTab.vue';
import { useVocabulariesStore } from '@/stores/vocabularies.store';
import type { CreateVocabularyDto } from '@/types/vocabularies.types';

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const store = useVocabulariesStore();

// Raw Zod schema for synchronous validation in onSubmit
function buildZodSchema() {
  return z.object({
    meaning_vi: z
      .string({ required_error: t('vocabularies.form.meaningViRequired') })
      .min(1, t('vocabularies.form.meaningViRequired'))
      .max(500, t('vocabularies.form.meaningViMax')),
    level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1'], {
      required_error: t('vocabularies.form.levelRequired'),
      invalid_type_error: t('vocabularies.form.levelRequired'),
    }),
    status: z.enum(['publish', 'hide', 'delete'], {
      required_error: t('vocabularies.form.statusRequired'),
      invalid_type_error: t('vocabularies.form.statusRequired'),
    }),
  });
}

const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      meaning_vi: z
        .string({ required_error: t('vocabularies.form.meaningViRequired') })
        .min(1, t('vocabularies.form.meaningViRequired'))
        .max(500, t('vocabularies.form.meaningViMax')),
      hiragana: z.string().max(200).optional().default(''),
      romaji: z.string().max(200).optional().default(''),
      kanji: z.string().max(200).optional().default(''),
      sino_vietnamese: z.string().max(200).optional().default(''),
      level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1'], {
        required_error: t('vocabularies.form.levelRequired'),
        invalid_type_error: t('vocabularies.form.levelRequired'),
      }),
      status: z.enum(['publish', 'hide', 'delete'], {
        required_error: t('vocabularies.form.statusRequired'),
        invalid_type_error: t('vocabularies.form.statusRequired'),
      }),
      media_url: z.string().optional().default(''),
      note: z.string().max(5000).optional().default(''),
      tags: z.array(z.string()).default([]),
      related_ids: z.array(z.number().positive()).default([]),
      synonym_ids: z.array(z.number().positive()).default([]),
      antonym_ids: z.array(z.number().positive()).default([]),
    }),
  ),
);

const { defineField, setFieldError, errors, meta } = useForm({
  validationSchema,
  initialValues: {
    meaning_vi: '',
    hiragana: '',
    romaji: '',
    kanji: '',
    sino_vietnamese: '',
    level: undefined as any,
    status: undefined as any,
    media_url: '',
    note: '',
    tags: [] as string[],
    related_ids: [] as number[],
    synonym_ids: [] as number[],
    antonym_ids: [] as number[],
  },
});

const [meaning_vi] = defineField('meaning_vi');
const [hiragana] = defineField('hiragana');
const [romaji] = defineField('romaji');
const [kanji] = defineField('kanji');
const [sino_vietnamese] = defineField('sino_vietnamese');
const [level] = defineField('level');
const [status] = defineField('status');
const [note] = defineField('note');

const isDirty = computed(() => meta.value.dirty);

async function onSubmit(): Promise<void> {
  const parseResult = buildZodSchema().safeParse({
    meaning_vi: meaning_vi.value,
    level: level.value,
    status: status.value,
  });

  if (!parseResult.success) {
    parseResult.error.issues.forEach((issue) => {
      if (issue.path[0]) setFieldError(String(issue.path[0]), issue.message);
    });
    return;
  }

  const dto: CreateVocabularyDto = {
    meaning_vi: meaning_vi.value!,
    hiragana: hiragana.value ?? '',
    romaji: romaji.value ?? '',
    kanji: kanji.value ?? '',
    sino_vietnamese: sino_vietnamese.value ?? '',
    level: level.value!,
    status: status.value!,
    media_url: '',
    note: note.value ?? '',
    tags: [],
    related_ids: [],
    synonym_ids: [],
    antonym_ids: [],
  };

  try {
    await store.createVocabulary(dto);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('vocabularies.createdSuccess'), life: 3000 });
    router.push({ name: 'VocabularyList' });
  } catch (err: any) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: err?.message || t('vocabularies.createdError'), life: 3000 });
  }
}

function handleCancel(): void {
  if (isDirty.value) {
    confirm.require({
      message: t('vocabularies.form.cancelDirtyConfirm'),
      header: t('vocabularies.form.cancelDirtyHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: t('vocabularies.form.discardChanges'),
      rejectLabel: t('common.cancel'),
      accept: () => router.push({ name: 'VocabularyList' }),
    });
  } else {
    router.push({ name: 'VocabularyList' });
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold">{{ t('vocabularies.createTitle') }}</h2>
      <div class="flex gap-2">
        <Button :label="t('common.cancel')" severity="secondary" outlined data-testid="vocab-cancel-btn" @click="handleCancel" />
        <Button :label="t('common.save')" icon="pi pi-check" data-testid="vocab-submit-btn" :loading="store.loading" @click="onSubmit" />
      </div>
    </div>

    <TabView>
      <TabPanel :header="t('vocabularies.form.tabInfo')">
        <div data-testid="vocab-tab-0" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">{{ t('vocabularies.form.meaningVi') }} <span class="text-red-500">*</span></label>
            <InputText v-model="meaning_vi" :placeholder="t('vocabularies.form.meaningViPlaceholder')" :class="{ 'p-invalid': errors.meaning_vi }" data-testid="field-meaning-vi" />
            <small v-if="errors.meaning_vi" class="text-red-500" data-testid="error-meaning-vi">{{ errors.meaning_vi }}</small>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">{{ t('vocabularies.form.hiragana') }}</label>
            <InputText v-model="hiragana" :placeholder="t('vocabularies.form.hiraganaPlaceholder')" data-testid="field-hiragana" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">{{ t('vocabularies.form.romaji') }}</label>
            <InputText v-model="romaji" :placeholder="t('vocabularies.form.romajiPlaceholder')" data-testid="field-romaji" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">{{ t('vocabularies.form.kanji') }}</label>
            <InputText v-model="kanji" :placeholder="t('vocabularies.form.kanjiPlaceholder')" data-testid="field-kanji" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">{{ t('vocabularies.form.sinoVi') }}</label>
            <InputText v-model="sino_vietnamese" :placeholder="t('vocabularies.form.sinoViPlaceholder')" data-testid="field-sino-vi" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">{{ t('vocabularies.form.level') }} <span class="text-red-500">*</span></label>
              <select :value="level" :class="['border rounded-lg px-3 py-2 text-sm w-full', { 'border-red-500': errors.level }]" data-testid="field-level" @change="level = ($event.target as HTMLSelectElement).value as any">
                <option value="">{{ t('vocabularies.form.level') }}</option>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
              <small v-if="errors.level" class="text-red-500" data-testid="error-level">{{ errors.level }}</small>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">{{ t('vocabularies.form.status') }} <span class="text-red-500">*</span></label>
              <select :value="status" :class="['border rounded-lg px-3 py-2 text-sm w-full', { 'border-red-500': errors.status }]" data-testid="field-status" @change="status = ($event.target as HTMLSelectElement).value as any">
                <option value="">{{ t('vocabularies.form.status') }}</option>
                <option value="publish">Publish</option>
                <option value="hide">Hide</option>
                <option value="delete">Delete</option>
              </select>
              <small v-if="errors.status" class="text-red-500" data-testid="error-status">{{ errors.status }}</small>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">{{ t('vocabularies.form.note') }}</label>
            <textarea v-model="note" :placeholder="t('vocabularies.form.notePlaceholder')" rows="3" class="border rounded-lg px-3 py-2 text-sm w-full" data-testid="field-note" />
          </div>
        </div>
      </TabPanel>

      <TabPanel :header="t('vocabularies.form.tabAudit')">
        <div data-testid="vocab-tab-1">
          <p class="text-surface-400 text-sm">-</p>
        </div>
      </TabPanel>

      <TabPanel :header="t('vocabularies.form.tabAnalytics')">
        <div data-testid="vocab-tab-2">
          <VocabularyAnalyticsTab :learn-count="0" :favorite-count="0" />
        </div>
      </TabPanel>
    </TabView>

    <ConfirmDialog />
  </div>
</template>
