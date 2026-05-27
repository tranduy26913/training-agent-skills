import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import VocabularyEditPage from '../../VocabularyEditPage.vue';
import { useVocabulariesStore } from '@/stores/vocabularies.store';
import en from '@/locales/en';
import type { VocabularyDetail } from '@/types/vocabularies.types';

// useConfirm / useToast モック / Module-level mocks
const confirmRequireMock = vi.hoisted(() => vi.fn());
const toastAddMock = vi.hoisted(() => vi.fn());

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: confirmRequireMock }),
}));
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAddMock }),
}));

// コンポーザブルモック / Mock API composable
vi.mock('@/pages/vocabularies/composables/useVocabularies', () => ({
  useVocabularies: () => ({
    fetchList: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    fetchById: vi.fn(),
    fetchChangeLogs: vi.fn(),
    fetchReports: vi.fn(),
    updateReportStatus: vi.fn(),
    suggestTags: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
  }),
}));

// サンプル語彙詳細 / Sample vocabulary detail
const sampleVocab: VocabularyDetail = {
  id: 1,
  kanji: '学校',
  meaning_vi: 'Trường học',
  hiragana: 'がっこう',
  romaji: 'gakkou',
  sino_vietnamese: null,
  level: 'N4',
  media_url: null,
  note: null,
  status: 'publish',
  learn_count: 10,
  favorite_count: 5,
  version: 1,
  created_by: 1,
  updated_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tags: [],
  related_words: [],
  synonyms: [],
  antonyms: [],
  created_by_name: 'Admin',
  updated_by_name: null,
};

// ラッパーファクトリー / Mount helper with route param id=1
function mountPage() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/vocabularies', name: 'VocabularyList', component: { template: '<div />' } },
      { path: '/vocabularies/:id/edit', name: 'VocabularyEdit', component: VocabularyEditPage },
    ],
  });
  return {
    wrapper: mount(VocabularyEditPage, {
      global: {
        plugins: [PrimeVue, i18n, router],
        mocks: { $route: { params: { id: '1' } } },
      },
    }),
    router,
  };
}

describe('VocabularyEditPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // テスト1: onMountedでfetchVocabulary, fetchChangeLogs, fetchReportsが呼ばれる
  // onMounted calls fetchVocabulary, fetchChangeLogs, fetchReports
  it('calls fetchVocabulary, fetchChangeLogs, fetchReports on mount', async () => {
    const store = useVocabulariesStore();
    const fetchVocSpy = vi.spyOn(store, 'fetchVocabulary').mockResolvedValue();
    const fetchLogsSpy = vi.spyOn(store, 'fetchChangeLogs').mockResolvedValue();
    const fetchReportsSpy = vi.spyOn(store, 'fetchReports').mockResolvedValue();

    mountPage();
    await flushPromises();

    expect(fetchVocSpy).toHaveBeenCalledWith(1);
    expect(fetchLogsSpy).toHaveBeenCalledWith(1);
    expect(fetchReportsSpy).toHaveBeenCalledWith(1);
  });

  // テスト2: currentVocabularyからmeaning_viが事前入力される
  // Pre-fills meaning_vi from store.currentVocabulary
  it('pre-fills meaning_vi from store.currentVocabulary', async () => {
    const store = useVocabulariesStore();
    vi.spyOn(store, 'fetchVocabulary').mockImplementation(async () => {
      store.currentVocabulary = sampleVocab;
    });
    vi.spyOn(store, 'fetchChangeLogs').mockResolvedValue();
    vi.spyOn(store, 'fetchReports').mockResolvedValue();

    const { wrapper } = mountPage();
    await flushPromises();
    await wrapper.vm.$nextTick();

    const meaningInput = wrapper.find('[data-testid="field-meaning-vi"]');
    expect(meaningInput.element).toBeTruthy();
    // The input should have the pre-filled value
    expect((meaningInput.element as HTMLInputElement).value).toBe('Trường học');
  });

  // テスト3: 有効な編集フォームでstore.updateVocabularyが呼ばれる
  // Valid edit form calls store.updateVocabulary
  it('calls store.updateVocabulary on valid form submit', async () => {
    const store = useVocabulariesStore();
    store.currentVocabulary = sampleVocab;
    const updateSpy = vi.spyOn(store, 'updateVocabulary').mockResolvedValue({} as any);
    vi.spyOn(store, 'fetchVocabulary').mockResolvedValue();
    vi.spyOn(store, 'fetchChangeLogs').mockResolvedValue();
    vi.spyOn(store, 'fetchReports').mockResolvedValue();

    const { wrapper } = mountPage();
    await flushPromises();
    await wrapper.vm.$nextTick();

    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(updateSpy).toHaveBeenCalledWith(1, expect.objectContaining({ meaning_vi: 'Trường học' }));
  });

  // テスト4: 更新成功後にListへナビゲート / Update success navigates to list
  it('navigates to VocabularyList after update success', async () => {
    const store = useVocabulariesStore();
    store.currentVocabulary = sampleVocab;
    vi.spyOn(store, 'updateVocabulary').mockResolvedValue({} as any);
    vi.spyOn(store, 'fetchVocabulary').mockResolvedValue();
    vi.spyOn(store, 'fetchChangeLogs').mockResolvedValue();
    vi.spyOn(store, 'fetchReports').mockResolvedValue();

    const { wrapper, router } = mountPage();
    await flushPromises();
    await wrapper.vm.$nextTick();

    const pushSpy = vi.spyOn(router, 'push');
    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyList' });
  });

  // テスト5: 更新失敗でトーストエラー / Update failure shows toast error
  it('shows toast error when update fails', async () => {
    const store = useVocabulariesStore();
    store.currentVocabulary = sampleVocab;
    vi.spyOn(store, 'updateVocabulary').mockRejectedValue(new Error('API error'));
    vi.spyOn(store, 'fetchVocabulary').mockResolvedValue();
    vi.spyOn(store, 'fetchChangeLogs').mockResolvedValue();
    vi.spyOn(store, 'fetchReports').mockResolvedValue();

    const { wrapper } = mountPage();
    await flushPromises();
    await wrapper.vm.$nextTick();

    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' }),
    );
  });

  // テスト6: onUnmountedでclearCurrentが呼ばれる / onUnmounted calls store.clearCurrent
  it('calls store.clearCurrent on unmount', () => {
    const store = useVocabulariesStore();
    vi.spyOn(store, 'fetchVocabulary').mockResolvedValue();
    vi.spyOn(store, 'fetchChangeLogs').mockResolvedValue();
    vi.spyOn(store, 'fetchReports').mockResolvedValue();
    const clearSpy = vi.spyOn(store, 'clearCurrent');

    const { wrapper } = mountPage();
    wrapper.unmount();

    expect(clearSpy).toHaveBeenCalled();
  });
});
