import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import VocabularyListPage from '../../VocabularyListPage.vue';
import { useVocabulariesStore } from '@/stores/vocabularies.store';
import en from '@/locales/en';
import type { VocabularyRow } from '@/types/vocabularies.types';

// useConfirm / useToast モチE�／ Hoist mocks so they are available before module resolution
const confirmRequireMock = vi.hoisted(() => vi.fn());
const toastAddMock = vi.hoisted(() => vi.fn());

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: confirmRequireMock }),
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAddMock }),
}));

// モチE��サービス / Mock the API composable so store does not call real network
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

const vocab1: VocabularyRow = {
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
  tags: ['giáo dục'],
};

const vocab2: VocabularyRow = {
  id: 2,
  kanji: '先生',
  meaning_vi: 'Giáo viên',
  hiragana: 'せんせい',
  romaji: 'sensei',
  sino_vietnamese: null,
  level: 'N5',
  media_url: null,
  note: null,
  status: 'publish',
  learn_count: 20,
  favorite_count: 8,
  version: 1,
  created_by: 1,
  updated_by: null,
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  tags: [],
};

function createWrapper(storeOverrides: Record<string, unknown> = {}) {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/vocabularies', name: 'VocabularyList', component: VocabularyListPage },
      { path: '/vocabularies/create', name: 'VocabularyCreate', component: { template: '<div />' } },
      { path: '/vocabularies/:id/edit', name: 'VocabularyEdit', component: { template: '<div />' } },
    ],
  });

  const store = useVocabulariesStore();
  Object.assign(store, storeOverrides);

  return { wrapper: mount(VocabularyListPage, {
    global: {
      plugins: [PrimeVue, i18n, router],
    },
  }), store, router };
}

describe('VocabularyListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // チE��チE: ローチE��ング時にスケルトンが表示されめE/ Loading skeleton visible
  it('shows skeleton when loading', () => {
    const store = useVocabulariesStore();
    store.loading = true;

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });

    const wrapper = mount(VocabularyListPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    });

    expect(wrapper.find('[data-testid="vocab-skeleton"]').exists()).toBe(true);
  });

  // チE��チE: チE�Eタなし空状慁E/ Empty state when no items and no filter
  it('shows empty state when no data', () => {
    const store = useVocabulariesStore();
    store.loading = false;
    store.items = [];
    store.filters = {};

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });

    const wrapper = mount(VocabularyListPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    });

    expect(wrapper.find('[data-testid="vocab-empty"]').exists()).toBe(true);
  });

  // チE��チE: フィルター有りの空状慁E/ Empty-filter state when search active but no results
  it('shows empty-filter state when search active and no data', () => {
    const store = useVocabulariesStore();
    store.loading = false;
    store.items = [];
    store.filters = { search: 'xyz' };

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });

    const wrapper = mount(VocabularyListPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    });

    expect(wrapper.find('[data-testid="vocab-empty-filter"]').exists()).toBe(true);
  });

  // チE��チE: 語彙行が表示されめE/ Vocabulary rows are visible
  it('renders vocabulary rows', () => {
    const store = useVocabulariesStore();
    store.loading = false;
    store.items = [vocab1, vocab2];

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });

    const wrapper = mount(VocabularyListPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    });

    expect(wrapper.findAll('[data-testid="vocab-edit-btn"]')).toHaveLength(2);
  });

  // チE��チE: 新規作�Eボタンでルート�E移 / Create button navigates to VocabularyCreate
  it('navigates to VocabularyCreate on create button click', async () => {
    const store = useVocabulariesStore();
    store.loading = false;
    store.items = [];
    store.filters = {};

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/vocabularies/create', name: 'VocabularyCreate', component: { template: '<div />' } },
      ],
    });
    const pushSpy = vi.spyOn(router, 'push');

    const wrapper = mount(VocabularyListPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    });

    await wrapper.find('[data-testid="vocab-create-btn"]').trigger('click');

    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyCreate' });
  });

  // チE��チE: 編雁E�Eタンで語彙編雁E��ートへ遷移 / Edit button navigates to VocabularyEdit
  it('navigates to VocabularyEdit on edit button click', async () => {
    const store = useVocabulariesStore();
    store.loading = false;
    store.items = [vocab1];

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/vocabularies/:id/edit', name: 'VocabularyEdit', component: { template: '<div />' } },
      ],
    });
    const pushSpy = vi.spyOn(router, 'push');

    const wrapper = mount(VocabularyListPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    });

    await wrapper.find('[data-testid="vocab-edit-btn"]').trigger('click');

    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyEdit', params: { id: 1 } });
  });

  // チE��チE: 削除ボタンで確認ダイアログが表示されめE/ Delete button opens ConfirmDialog
  it('opens confirm dialog on delete button click', async () => {
    const store = useVocabulariesStore();
    store.loading = false;
    store.items = [vocab1];

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });

    const confirmRequireSpy = vi.fn();
    const wrapper = mount(VocabularyListPage, {
      global: {
        plugins: [PrimeVue, i18n, router],
      },
    });

    await wrapper.find('[data-testid="vocab-delete-btn"]').trigger('click');

    expect(confirmRequireMock).toHaveBeenCalled();
  });

  // calls store.deleteVocabulary when delete is confirmed
  it('calls store.deleteVocabulary when delete is confirmed', async () => {
    const store = useVocabulariesStore();
    store.loading = false;
    store.items = [vocab1];
    const deleteSpy = vi.spyOn(store, 'deleteVocabulary').mockResolvedValue();

    // confirmRequireMock を accept コールバックキャプチャ用に設定
    // Override confirmRequireMock to capture accept callback
    let capturedAccept: (() => void) | undefined;
    confirmRequireMock.mockImplementation((opts: { accept?: () => void }) => {
      capturedAccept = opts.accept;
    });

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });

    const wrapper = mount(VocabularyListPage, {
      global: {
        plugins: [PrimeVue, i18n, router],
      },
    });

    await wrapper.find('[data-testid="vocab-delete-btn"]').trigger('click');
    capturedAccept?.();
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  // チE��チE: フィルター変更でpage=1でフェチE�� / Filter change triggers fetchVocabularies with page=1
  it('calls fetchVocabularies with page 1 on filter change', async () => {
    vi.useFakeTimers();

    const store = useVocabulariesStore();
    store.loading = false;
    store.items = [];
    store.filters = {};
    const fetchSpy = vi.spyOn(store, 'fetchVocabularies').mockResolvedValue();

    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });

    const wrapper = mount(VocabularyListPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    });

    const searchInput = wrapper.find('[data-testid="vocab-filter-search"]');
    await searchInput.setValue('学校');

    vi.advanceTimersByTime(450);
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ search: '学校', page: 1 }));

    vi.useRealTimers();
  });
});

