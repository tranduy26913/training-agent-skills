import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import VocabularyCreatePage from '../../VocabularyCreatePage.vue';
import { useVocabulariesStore } from '@/stores/vocabularies.store';
import en from '@/locales/en';

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

// ラッパーファクトリー / Mount helper
function mountPage() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/vocabularies', name: 'VocabularyList', component: { template: '<div />' } },
      { path: '/vocabularies/create', name: 'VocabularyCreate', component: VocabularyCreatePage },
    ],
  });
  return { wrapper: mount(VocabularyCreatePage, { global: { plugins: [PrimeVue, i18n, router] } }), router };
}

describe('VocabularyCreatePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // テスト1: 3つのタブが表示される / Three tabs are visible
  it('renders three tab labels', () => {
    const { wrapper } = mountPage();

    const tabs = wrapper.findAll('[data-testid^="vocab-tab-"]');
    expect(tabs).toHaveLength(3);
  });

  // テスト2: 空submitでmeaning_viエラー / Empty submit shows meaning_vi required error
  it('shows meaning_vi required error on empty submit', async () => {
    const { wrapper } = mountPage();

    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="error-meaning-vi"]').exists()).toBe(true);
  });

  // テスト3: 空submitでlevelエラー / Empty submit shows level required error
  it('shows level required error on empty submit', async () => {
    const { wrapper } = mountPage();

    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="error-level"]').exists()).toBe(true);
  });

  // テスト4: 空submitでstatusエラー / Empty submit shows status required error
  it('shows status required error on empty submit', async () => {
    const { wrapper } = mountPage();

    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="error-status"]').exists()).toBe(true);
  });

  // テスト5: 有効なフォームでstore.createVocabularyが呼ばれる / Valid form calls store.createVocabulary
  it('calls store.createVocabulary on valid form submit', async () => {
    const store = useVocabulariesStore();
    const createSpy = vi.spyOn(store, 'createVocabulary').mockResolvedValue({} as any);

    const { wrapper } = mountPage();

    // 必須フィールドを入力 / Fill required fields
    const meaningInput = wrapper.find('[data-testid="field-meaning-vi"]');
    await meaningInput.setValue('Trường học');

    const levelSelect = wrapper.find('[data-testid="field-level"]');
    await levelSelect.setValue('N4');

    const statusSelect = wrapper.find('[data-testid="field-status"]');
    await statusSelect.setValue('publish');

    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ meaning_vi: 'Trường học', level: 'N4', status: 'publish' }),
    );
  });

  // テスト6: 作成成功後にListへナビゲート / Create success navigates to list
  it('navigates to VocabularyList after create success', async () => {
    const store = useVocabulariesStore();
    vi.spyOn(store, 'createVocabulary').mockResolvedValue({} as any);

    const { wrapper, router } = mountPage();
    const pushSpy = vi.spyOn(router, 'push');

    await wrapper.find('[data-testid="field-meaning-vi"]').setValue('テスト');
    await wrapper.find('[data-testid="field-level"]').setValue('N5');
    await wrapper.find('[data-testid="field-status"]').setValue('publish');
    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyList' });
  });

  // テスト7: 作成失敗でトーストエラー / Create failure shows toast error
  it('shows toast error when create fails', async () => {
    const store = useVocabulariesStore();
    vi.spyOn(store, 'createVocabulary').mockRejectedValue(new Error('API error'));

    const { wrapper } = mountPage();

    await wrapper.find('[data-testid="field-meaning-vi"]').setValue('テスト');
    await wrapper.find('[data-testid="field-level"]').setValue('N5');
    await wrapper.find('[data-testid="field-status"]').setValue('publish');
    await wrapper.find('[data-testid="vocab-submit-btn"]').trigger('click');
    await flushPromises();

    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' }),
    );
  });

  // テスト8: フォームがきれいな状態でキャンセルするとリストへ直接遷移 / Clean form cancel navigates without confirm
  it('navigates to list on cancel without confirm when form is clean', async () => {
    const { wrapper, router } = mountPage();
    const pushSpy = vi.spyOn(router, 'push');

    await wrapper.find('[data-testid="vocab-cancel-btn"]').trigger('click');

    expect(confirmRequireMock).not.toHaveBeenCalled();
    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyList' });
  });

  // テスト9: フォームがdirtyな状態でキャンセルするとConfirmDialogが開く / Dirty form cancel opens confirm
  it('opens confirm dialog on cancel when form is dirty', async () => {
    const { wrapper } = mountPage();

    await wrapper.find('[data-testid="field-meaning-vi"]').setValue('something');
    await wrapper.find('[data-testid="vocab-cancel-btn"]').trigger('click');

    expect(confirmRequireMock).toHaveBeenCalled();
  });
});
