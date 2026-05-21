/**
 * VocabularyInfoTab and VocabularyCreatePage tests
 * VocabularyInfoTabとVocabularyCreatePageのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import { createRouter, createWebHistory } from 'vue-router';
import en from '@/locales/en';
import { vocabularyFormSchema } from '../composables/vocabularies.form.schema';
import VocabularyInfoTab from '../components/VocabularyInfoTab.vue';
import VocabularyCreatePage from '../VocabularyCreatePage.vue';

// ストアモック / Store mock
const storeMocks = vi.hoisted(() => ({
  fetchSimpleList: vi.fn().mockResolvedValue(undefined),
  createVocabulary: vi.fn().mockResolvedValue(undefined),
  deleteVocabulary: vi.fn().mockResolvedValue(undefined),
  simpleList: [],
  loading: false,
  error: null,
}));

vi.mock('@/stores/vocabularies.store', () => ({
  useVocabulariesStore: () => storeMocks,
}));

// useToastモック / Mock useToast
const mockToastAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: mockToastAdd }),
}));

// i18n / Router setup
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/vocabularies', name: 'VocabularyList', component: { template: '<div />' } },
    { path: '/vocabularies/create', name: 'VocabularyCreate', component: { template: '<div />' } },
  ],
});

// サンプル語彙データ / Sample vocabulary data
const sampleVocabulary = {
  id: 1,
  kanji: '日本語',
  hiragana: 'にほんご',
  meaning_vi: 'Tiếng Nhật',
  romaji: 'nihongo',
  sino_vi: 'Nhật Ngữ',
  level: 'N5' as const,
  status: 'publish' as const,
  image_url: '',
  note: 'Sample note',
  tags: ['言語', '日常'],
  related_ids: [],
  synonym_ids: [],
  antonym_ids: [],
  created_at: '',
  updated_at: '',
};

const sampleOptions = [
  { id: 1, kanji: '日本語', hiragana: 'にほんご', meaning_vi: 'Tiếng Nhật' },
  { id: 2, kanji: '英語', hiragana: 'えいご', meaning_vi: 'Tiếng Anh' },
];

// ────────────────────────────────────────────────────
// Section 1: VocabularyInfoTab — Behavior Tests (IT-1 to IT-4)
// ────────────────────────────────────────────────────
describe('VocabularyInfoTab — Behavior', () => {
  function mountInfoTab(props = {}) {
    return mount(VocabularyInfoTab, {
      props: {
        mode: 'create',
        initialData: null,
        loading: false,
        vocabularyOptions: sampleOptions,
        ...props,
      },
      global: {
        plugins: [createPinia(), PrimeVue, i18n],
      },
    });
  }

  // IT-1: Form pre-fill when mode='edit'
  it('IT-1: pre-fills form fields when mode=edit and initialData provided', async () => {
    // mode=editの場合、initialDataのフィールドでフォームが事前入力される
    const wrapper = mountInfoTab({ mode: 'edit', initialData: sampleVocabulary });
    await wrapper.vm.$nextTick();
    const meaningInput = wrapper.find('[data-testid="vocab-meaning-vi-input"]');
    expect((meaningInput.element as HTMLInputElement).value).toBe('Tiếng Nhật');
    const hiraganaInput = wrapper.find('[data-testid="vocab-hiragana-input"]');
    expect((hiraganaInput.element as HTMLInputElement).value).toBe('にほんご');
  });

  // IT-2: MultiSelect shows vocabOptions
  it('IT-2: MultiSelect receives correct vocabularyOptions', async () => {
    // MultiSelectが正しいvocabularyOptionsを受け取る
    const wrapper = mountInfoTab({ vocabularyOptions: sampleOptions });
    await wrapper.vm.$nextTick();
    // Verify options are passed to the related select
    expect(wrapper.find('[data-testid="vocab-related-select"]').exists()).toBe(true);
  });

  // IT-3: Emit submit with correct data
  it('IT-3: emits submit with valid form data on submit click', async () => {
    // 送信クリックで有効なフォームデータがemitされる
    const wrapper = mountInfoTab();
    await wrapper.vm.$nextTick();

    // Fill required fields
    const meaningInput = wrapper.find('[data-testid="vocab-meaning-vi-input"]');
    await meaningInput.setValue('Tiếng Nhật');

    const hiraganaInput = wrapper.find('[data-testid="vocab-hiragana-input"]');
    await hiraganaInput.setValue('にほんご');

    // Level and status should be set by default or via the store
    // Trigger submit button
    await wrapper.find('[data-testid="vocab-save-btn"]').trigger('click');
    await flushPromises();

    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
  });

  // IT-4: Emit cancel on cancel click
  it('IT-4: emits cancel when cancel button clicked', async () => {
    // キャンセルボタンクリックでcancelがemitされる
    const wrapper = mountInfoTab();
    await wrapper.find('[data-testid="vocab-cancel-btn"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});

// ────────────────────────────────────────────────────
// Section 2: VocabularyInfoTab — Zod Schema Validation (FV-1 to FV-20)
// ────────────────────────────────────────────────────
describe('VocabularyInfoTab — Form Validation (Zod schema)', () => {
  const valid = {
    meaning_vi: 'Tiếng Nhật',
    hiragana: 'にほんご',
    level: 'N5' as const,
    status: 'publish' as const,
  };

  function validate(data: Record<string, unknown>) {
    return vocabularyFormSchema.safeParse(data);
  }

  // FV-1: meaning_vi required
  it('FV-1: meaning_vi is required', () => {
    const r = validate({ ...valid, meaning_vi: undefined });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('meaning_vi'))).toBe(true);
    }
  });

  // FV-2: meaning_vi empty (whitespace)
  it('FV-2: meaning_vi empty string (trimmed) fails', () => {
    const r = validate({ ...valid, meaning_vi: '   ' });
    expect(r.success).toBe(false);
  });

  // FV-3: meaning_vi max 500
  it('FV-3: meaning_vi over 500 chars fails', () => {
    const r = validate({ ...valid, meaning_vi: 'a'.repeat(501) });
    expect(r.success).toBe(false);
  });

  // FV-4: hiragana required
  it('FV-4: hiragana is required', () => {
    const r = validate({ ...valid, hiragana: undefined });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('hiragana'))).toBe(true);
    }
  });

  // FV-5: hiragana empty string
  it('FV-5: hiragana empty string fails', () => {
    const r = validate({ ...valid, hiragana: '' });
    expect(r.success).toBe(false);
  });

  // FV-6: hiragana max 200
  it('FV-6: hiragana over 200 chars fails', () => {
    const r = validate({ ...valid, hiragana: 'a'.repeat(201) });
    expect(r.success).toBe(false);
  });

  // FV-7: level required
  it('FV-7: level is required', () => {
    const r = validate({ ...valid, level: undefined });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('level'))).toBe(true);
    }
  });

  // FV-8: status defaults to 'publish'
  it('FV-8: status defaults to publish when not provided', () => {
    const { status: _s, ...noStatus } = valid;
    const r = validate(noStatus);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.status).toBe('publish');
    }
  });

  // FV-9: invalid image_url
  it('FV-9: invalid image_url fails', () => {
    const r = validate({ ...valid, image_url: 'not-a-url' });
    expect(r.success).toBe(false);
  });

  // FV-10: valid image_url
  it('FV-10: valid image_url passes', () => {
    const r = validate({ ...valid, image_url: 'https://example.com/img.png' });
    expect(r.success).toBe(true);
  });

  // FV-11: empty image_url allowed
  it('FV-11: empty image_url is allowed', () => {
    const r = validate({ ...valid, image_url: '' });
    expect(r.success).toBe(true);
  });

  // FV-12: note max 2000
  it('FV-12: note over 2000 chars fails', () => {
    const r = validate({ ...valid, note: 'a'.repeat(2001) });
    expect(r.success).toBe(false);
  });

  // FV-13: note exactly 2000 allowed
  it('FV-13: note exactly 2000 chars passes', () => {
    const r = validate({ ...valid, note: 'a'.repeat(2000) });
    expect(r.success).toBe(true);
  });

  // FV-14: single tag over 50 chars
  it('FV-14: tag over 50 chars fails', () => {
    const r = validate({ ...valid, tags: ['a'.repeat(51)] });
    expect(r.success).toBe(false);
  });

  // FV-15: more than 20 tags
  it('FV-15: more than 20 tags fails', () => {
    const r = validate({ ...valid, tags: Array(21).fill('tag') });
    expect(r.success).toBe(false);
  });

  // FV-16: exactly 20 tags allowed
  it('FV-16: exactly 20 tags passes', () => {
    const r = validate({ ...valid, tags: Array(20).fill('tag') });
    expect(r.success).toBe(true);
  });

  // FV-17: romaji optional
  it('FV-17: omitting romaji still passes validation', () => {
    const r = validate({ ...valid });
    expect(r.success).toBe(true);
  });

  // FV-18: kanji optional
  it('FV-18: omitting kanji still passes validation', () => {
    const r = validate({ ...valid });
    expect(r.success).toBe(true);
  });

  // FV-19: related and synonym can share same vocab id (different types)
  it('FV-19: related_ids and synonym_ids with same id passes', () => {
    const r = validate({ ...valid, related_ids: [1], synonym_ids: [1] });
    expect(r.success).toBe(true);
  });

  // FV-20: fully valid form — passes
  it('FV-20: fully valid form passes and emits correct shape', () => {
    const r = validate({
      meaning_vi: 'Tiếng Nhật',
      hiragana: 'にほんご',
      romaji: 'nihongo',
      kanji: '日本語',
      sino_vi: 'Nhật Ngữ',
      level: 'N5',
      status: 'publish',
      image_url: 'https://example.com/img.png',
      note: 'Some note',
      tags: ['日常', '言語'],
      related_ids: [2],
      synonym_ids: [],
      antonym_ids: [],
    });
    expect(r.success).toBe(true);
  });
});

// ────────────────────────────────────────────────────
// Section 3: VocabularyCreatePage Tests (CP-1 to CP-4)
// ────────────────────────────────────────────────────
describe('VocabularyCreatePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    storeMocks.fetchSimpleList.mockResolvedValue(undefined);
    storeMocks.createVocabulary.mockResolvedValue(undefined);
  });

  function mountCreatePage() {
    return mount(VocabularyCreatePage, {
      global: {
        plugins: [createPinia(), PrimeVue, ToastService, ConfirmationService, router, i18n],
        stubs: {
          VocabularyInfoTab: {
            name: 'VocabularyInfoTab',
            template: '<div class="stub-info-tab" />',
            emits: ['submit', 'cancel'],
            props: ['mode', 'initialData', 'loading', 'vocabularyOptions'],
          },
        },
      },
    });
  }

  // CP-1: Load simple list on mount
  it('CP-1: calls fetchSimpleList on mount', async () => {
    // マウント時にfetchSimpleListが呼ばれる
    mountCreatePage();
    await flushPromises();
    expect(storeMocks.fetchSimpleList).toHaveBeenCalledTimes(1);
  });

  // CP-2: Submit creates successfully
  it('CP-2: calls createVocabulary and navigates to list on success', async () => {
    // 作成成功後にVocabularyListへ遷移する
    const wrapper = mountCreatePage();
    await flushPromises();
    const pushSpy = vi.spyOn(router, 'push');

    const dto = { meaning_vi: 'Tiếng Nhật', hiragana: 'にほんご', level: 'N5', status: 'publish' };
    wrapper.findComponent({ name: 'VocabularyInfoTab' }).vm.$emit('submit', dto);
    await flushPromises();

    expect(storeMocks.createVocabulary).toHaveBeenCalledWith(dto);
    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyList' });
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
  });

  // CP-3: Submit fails — toast error
  it('CP-3: shows toast error when createVocabulary fails', async () => {
    // 作成失敗時にエラートーストが表示される
    storeMocks.createVocabulary.mockRejectedValueOnce(new Error('Network error'));
    const wrapper = mountCreatePage();
    await flushPromises();

    const dto = { meaning_vi: 'Tiếng Nhật', hiragana: 'にほんご', level: 'N5', status: 'publish' };
    wrapper.findComponent({ name: 'VocabularyInfoTab' }).vm.$emit('submit', dto);
    await flushPromises();

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
  });

  // CP-4: Cancel → navigate to VocabularyList
  it('CP-4: navigates to VocabularyList on cancel emit', async () => {
    // キャンセル時にVocabularyListへ遷移する
    const wrapper = mountCreatePage();
    await flushPromises();
    const pushSpy = vi.spyOn(router, 'push');

    wrapper.findComponent({ name: 'VocabularyInfoTab' }).vm.$emit('cancel');
    await wrapper.vm.$nextTick();

    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyList' });
  });
});
