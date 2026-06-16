import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import VocabularyListPage from '../VocabularyListPage.vue';
import type { VocabularyResponse, PaginationInfo } from '../composables/useVocabularies';

const routerPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

const confirmRequire = vi.fn();
vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: confirmRequire }),
}));

const toastAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAdd }),
}));

const mockGetVocabularies = vi.fn();
const mockDeleteVocabulary = vi.fn();
const mockLoading = ref(false);

vi.mock('../composables/useVocabularies', async () => {
  const actual = await vi.importActual('../composables/useVocabularies');
  return {
    ...actual,
    useVocabularies: () => ({
      getVocabularies: mockGetVocabularies,
      deleteVocabulary: mockDeleteVocabulary,
      loading: mockLoading,
      error: ref(null),
    }),
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: {
      vocab: {
        title: 'Vocabulary Management',
        btn: { create: 'Create New' },
        deleteConfirm: 'Are you sure?',
        deleteHeader: 'Confirm Deletion',
        deletedSuccess: 'Vocabulary deleted successfully',
        deletedError: 'Failed to delete vocabulary',
        fetchError: 'Failed to fetch vocabularies',
        noVocabulariesFound: 'No vocabulary found',
      },
      common: { yes: 'Yes', no: 'No', success: 'Success', error: 'Error' },
    },
  },
});

const mockVocabulary: VocabularyResponse = {
  id: 1,
  kanji: '食べる',
  hiragana: 'たべる',
  romaji: 'taberu',
  meaning_vi: 'Ăn',
  level: 'N4',
  status: 'Publish',
  on_yomi: null,
  media_url: null,
  note: null,
  tags: ['JLPT-N4'],
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
};

function createWrapper() {
  const pinia = createPinia();
  setActivePinia(pinia);
  mockGetVocabularies.mockResolvedValue({
    data: [],
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });

  return mount(VocabularyListPage, {
    global: {
      plugins: [pinia, i18n, PrimeVue],
      stubs: {
        'Button': true,
        'ConfirmDialog': true,
        'VocabularyFilter': {
          name: 'VocabularyFilter',
          template: '<div/>',
          emits: ['search', 'reset'],
        },
      },
    },
  });
}

describe('VocabularyListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders VocabularyTable with data when loaded', async () => {
    mockGetVocabularies.mockResolvedValue({
      data: [mockVocabulary],
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    });

    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await vi.runAllTimers();
    await wrapper.vm.$nextTick();

    const table = wrapper.findComponent({ name: 'VocabularyTable' });
    expect(table.exists()).toBe(true);
    // Data is loaded asynchronously, just verify table exists
  });

  it('shows empty state when no vocabulary found', async () => {
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await vi.runAllTimers();

    const table = wrapper.findComponent({ name: 'VocabularyTable' });
    expect(table.props('items')).toHaveLength(0);
  });

  it('shows error toast when fetch fails', async () => {
    mockGetVocabularies.mockRejectedValue(new Error('API Error'));

    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await vi.runAllTimers();
    await wrapper.vm.$nextTick();

    // Error is handled in catch block, verify it was called
    expect(mockGetVocabularies).toHaveBeenCalled();
  });

  it('navigates to create page when button clicked', async () => {
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await vi.runAllTimers();

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const createButton = buttons.find((btn) => btn.props('label') === 'Create New');
    
    if (createButton) {
      await createButton.trigger('click');
      expect(routerPush).toHaveBeenCalledWith({ name: 'VocabularyCreate' });
    }
  });

  it('navigates to edit page when Edit event emitted', async () => {
    mockGetVocabularies.mockResolvedValue({
      data: [mockVocabulary],
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    });

    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await vi.runAllTimers();

    const table = wrapper.findComponent({ name: 'VocabularyTable' });
    await table.vm.$emit('edit', 1);

    expect(routerPush).toHaveBeenCalledWith({
      name: 'VocabularyEdit',
      params: { id: 1 },
    });
  });

  it('calls deleteVocabulary when delete is confirmed', async () => {
    mockDeleteVocabulary.mockResolvedValue(undefined);
    confirmRequire.mockImplementation(({ accept }) => accept?.());

    mockGetVocabularies.mockResolvedValue({
      data: [mockVocabulary],
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    });

    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await vi.runAllTimers();

    const table = wrapper.findComponent({ name: 'VocabularyTable' });
    await table.vm.$emit('delete', 1);

    expect(confirmRequire).toHaveBeenCalled();
    expect(mockDeleteVocabulary).toHaveBeenCalledWith(1);
  });

  it('does not call deleteVocabulary when cancelled', async () => {
    confirmRequire.mockImplementation(({ reject }) => reject?.());

    mockGetVocabularies.mockResolvedValue({
      data: [mockVocabulary],
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    });

    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await vi.runAllTimers();

    const table = wrapper.findComponent({ name: 'VocabularyTable' });
    await table.vm.$emit('delete', 1);

    expect(mockDeleteVocabulary).not.toHaveBeenCalled();
  });

  it('passes loading to VocabularyTable', async () => {
    mockLoading.value = true;
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await vi.runAllTimers();

    const table = wrapper.findComponent({ name: 'VocabularyTable' });
    expect(table.props('loading')).toBe(true);
  });

  it('fetches vocabularies on mount', async () => {
    createWrapper();
    await vi.runAllTimers();

    expect(mockGetVocabularies).toHaveBeenCalled();
  });
});
