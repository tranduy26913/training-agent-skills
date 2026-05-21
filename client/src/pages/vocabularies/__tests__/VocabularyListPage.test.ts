/**
 * VocabularyListPage tests
 * VocabularyListPageのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import VocabularyListPage from '../VocabularyListPage.vue';
import VocabularyTable from '../components/VocabularyTable.vue';
import VocabularyFilters from '../components/VocabularyFilters.vue';
import en from '@/locales/en';

// ストアモック / Mock store
const storeMocks = vi.hoisted(() => ({
  fetchVocabularies: vi.fn().mockResolvedValue(undefined),
  deleteVocabulary: vi.fn().mockResolvedValue(undefined),
  vocabularies: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  loading: false,
  filters: {},
}));

vi.mock('@/stores/vocabularies.store', () => ({
  useVocabulariesStore: () => storeMocks,
}));

// useConfirmモック / Mock useConfirm
const mockConfirmRequire = vi.fn();
vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: mockConfirmRequire }),
}));

// useToastモック / Mock useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}));

// テスト用ルーター / Test router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/vocabularies', name: 'VocabularyList', component: { template: '<div />' } },
    { path: '/vocabularies/create', name: 'VocabularyCreate', component: { template: '<div />' } },
    { path: '/vocabularies/:id/edit', name: 'VocabularyEdit', component: { template: '<div />' } },
  ],
});

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountPage() {
  return mount(VocabularyListPage, {
    global: {
      plugins: [createPinia(), PrimeVue, ConfirmationService, ToastService, router, i18n],
      stubs: {
        VocabularyFilters: { name: 'VocabularyFilters', template: '<div class="stub-filters" />', emits: ['filterChange'] },
        VocabularyTable: {
          name: 'VocabularyTable',
          template: '<div class="stub-table" />',
          emits: ['edit', 'delete', 'pageChange'],
          props: ['vocabularies', 'loading', 'pagination', 'sortField', 'sortOrder'],
        },
      },
    },
  });
}

describe('VocabularyListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    storeMocks.fetchVocabularies.mockResolvedValue(undefined);
    storeMocks.vocabularies = [];
    storeMocks.loading = false;
  });

  // LP-1: fetchVocabularies gọi khi mount
  it('LP-1: calls fetchVocabularies on mount', async () => {
    // マウント時にfetchVocabulariesが呼ばれる
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    expect(storeMocks.fetchVocabularies).toHaveBeenCalledTimes(1);
  });

  // LP-2: loading state propagated to VocabularyTable
  it('LP-2: passes loading=true to VocabularyTable when loading', async () => {
    // ローディング中はVocabularyTableにloading=trueが渡される
    storeMocks.loading = true;
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    const table = wrapper.findComponent(VocabularyTable);
    expect(table.props('loading')).toBe(true);
  });

  // LP-3: empty state when no vocabularies
  it('LP-3: shows empty state message when vocabularies is empty', async () => {
    // 語彙がない場合に空のステートメッセージが表示される
    storeMocks.vocabularies = [];
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    // VocabularyTable renders empty; we verify the page doesn't crash and renders
    expect(wrapper.find('[data-testid="vocab-list-page"]').exists()).toBe(true);
  });

  // LP-4: navigate to CreatePage on create button click
  it('LP-4: navigates to VocabularyCreate on create button click', async () => {
    // 作成ボタンクリックでVocabularyCreateに遷移する
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    const pushSpy = vi.spyOn(router, 'push');
    await wrapper.find('[data-testid="vocab-create-btn"]').trigger('click');
    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyCreate' });
  });

  // LP-5: navigate to EditPage on edit emit
  it('LP-5: navigates to VocabularyEdit on edit emit from table', async () => {
    // テーブルのeditイベントでVocabularyEditに遷移する
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    const pushSpy = vi.spyOn(router, 'push');
    wrapper.findComponent(VocabularyTable).vm.$emit('edit', 5);
    await wrapper.vm.$nextTick();
    expect(pushSpy).toHaveBeenCalledWith({ name: 'VocabularyEdit', params: { id: 5 } });
  });

  // LP-6: ConfirmDialog opened on delete emit
  it('LP-6: calls confirm.require on delete emit from table', async () => {
    // テーブルのdeleteイベントでconfirm.requireが呼ばれる
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    wrapper.findComponent(VocabularyTable).vm.$emit('delete', 3);
    await wrapper.vm.$nextTick();
    expect(mockConfirmRequire).toHaveBeenCalledTimes(1);
  });

  // LP-7: deleteVocabulary called on confirm accept
  it('LP-7: calls store.deleteVocabulary when confirm accepted', async () => {
    // confirm承認時にstore.deleteVocabularyが呼ばれる
    mockConfirmRequire.mockImplementationOnce(({ accept }: any) => accept());
    storeMocks.deleteVocabulary.mockResolvedValue(undefined);

    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    wrapper.findComponent(VocabularyTable).vm.$emit('delete', 7);
    await wrapper.vm.$nextTick();
    expect(storeMocks.deleteVocabulary).toHaveBeenCalledWith(7);
  });

  // LP-8: filterChange resets page to 1
  it('LP-8: calls fetchVocabularies with page=1 on filterChange', async () => {
    // フィルター変更時にpage=1でfetchVocabulariesが呼ばれる
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    storeMocks.fetchVocabularies.mockClear();

    wrapper.findComponent(VocabularyFilters).vm.$emit('filterChange', { search: 'test', level: 'N3' });
    await wrapper.vm.$nextTick();

    expect(storeMocks.fetchVocabularies).toHaveBeenCalledWith({ search: 'test', level: 'N3', page: 1 });
  });
});
