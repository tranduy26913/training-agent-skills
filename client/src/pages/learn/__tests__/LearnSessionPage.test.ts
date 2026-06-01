// LearnSessionPage コンポーネントテスト / Tests for the flashcard session page
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import LearnSessionPage from '../LearnSessionPage.vue';
import FlashCard from '../components/FlashCard.vue';
import SessionSummary from '../components/SessionSummary.vue';
import { useLearnStore } from '@/stores/learn.store';
import en from '@/locales/en';
import type { LearnVocabularyItem } from '@/types/learn.types';

// =========================================================
// サービスモック / Mock the learn service
// =========================================================
const serviceMocks = vi.hoisted(() => ({
  getLevelStats: vi.fn(),
  getVocabularies: vi.fn(),
  batchUpdateProgress: vi.fn(),
  toggleFavorite: vi.fn(),
}));

vi.mock('@/services/learn.service', () => ({
  learnService: serviceMocks,
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: vi.fn() }),
}));

// =========================================================
// Fixtures
// =========================================================
function makeVocab(id: number): LearnVocabularyItem {
  return {
    id,
    kanji: `漢字${id}`,
    hiragana: `ひらがな${id}`,
    romaji: `romaji${id}`,
    meaning_vi: `nghĩa ${id}`,
    level: 'N5',
    tags: [],
    media_url: null,
    note: null,
    progress: { status: 'new', review_count: 0, last_reviewed: null, is_favorite: false },
  };
}

const TWO_CARDS = [makeVocab(1), makeVocab(2)];

// =========================================================
// Helper: mount the page with required plugins and route params
// =========================================================
function createWrapper(storeState: Partial<ReturnType<typeof useLearnStore>> = {}) {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/learn/:level/session', name: 'LearnSession', component: LearnSessionPage },
      { path: '/learn/:level/list', name: 'LearnVocabList', component: { template: '<div />' } },
    ],
  });

  // Navigate to a specific level session route so params are set
  router.push({ name: 'LearnSession', params: { level: 'N5' }, query: { mode: 'unknown' } });

  const store = useLearnStore();
  Object.assign(store, storeState);

  return {
    wrapper: mount(LearnSessionPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    }),
    store,
    router,
  };
}

// =========================================================
// Tests
// =========================================================
describe('LearnSessionPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // Spec case 1: Redirect to list when no vocabularies
  it('shows empty state and back button when no vocabularies after load', async () => {
    serviceMocks.getVocabularies.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 200, total: 0, pages: 0 },
    });

    const { wrapper } = createWrapper({ loading: false, vocabularies: [] });
    await flushPromises();

    expect(wrapper.text()).toContain(en.learn.session.noVocabs);
  });

  // Spec case 2: Known/Unknown buttons disabled before flip
  it('shows disabled Known/Unknown buttons before card is flipped', async () => {
    serviceMocks.getVocabularies.mockResolvedValue({
      data: TWO_CARDS,
      pagination: { page: 1, limit: 200, total: 2, pages: 1 },
    });

    const { wrapper } = createWrapper({ loading: false, vocabularies: TWO_CARDS });
    await flushPromises();

    const buttons = wrapper.findAll('button');
    // Mark Known and Mark Unknown buttons are both disabled before flip
    const markKnownBtn = buttons.find((b) => b.text() === en.learn.session.markKnown);
    const markUnknownBtn = buttons.find((b) => b.text() === en.learn.session.markUnknown);

    expect(markKnownBtn?.attributes('disabled')).toBeDefined();
    expect(markUnknownBtn?.attributes('disabled')).toBeDefined();
  });

  // Spec case 3: Buttons enabled after flip
  it('enables Known/Unknown buttons after card is flipped', async () => {
    serviceMocks.getVocabularies.mockResolvedValue({
      data: TWO_CARDS,
      pagination: { page: 1, limit: 200, total: 2, pages: 1 },
    });

    const { wrapper } = createWrapper({ loading: false, vocabularies: TWO_CARDS });
    await flushPromises();

    // Click the FlashCard to flip
    await wrapper.findComponent(FlashCard).trigger('click');

    const buttons = wrapper.findAll('button');
    const markKnownBtn = buttons.find((b) => b.text() === en.learn.session.markKnown);
    expect(markKnownBtn?.attributes('disabled')).toBeUndefined();
  });

  // Spec case 8: SessionSummary shown when session is complete (all cards answered)
  it('shows SessionSummary after all cards are answered', async () => {
    serviceMocks.getVocabularies.mockResolvedValue({
      data: [makeVocab(1)],
      pagination: { page: 1, limit: 200, total: 1, pages: 1 },
    });
    serviceMocks.batchUpdateProgress.mockResolvedValue(1);

    const { wrapper } = createWrapper({ loading: false, vocabularies: [makeVocab(1)] });
    await flushPromises();

    // Flip then mark known (only 1 card)
    await wrapper.findComponent(FlashCard).trigger('click');
    const knownBtn = wrapper.findAll('button').find((b) => b.text() === en.learn.session.markKnown);
    await knownBtn?.trigger('click');
    await flushPromises();

    expect(wrapper.findComponent(SessionSummary).exists()).toBe(true);
  });

  // Spec case 9: batchUpdateProgress called after session completes
  it('calls batchUpdateProgress when session finishes', async () => {
    serviceMocks.getVocabularies.mockResolvedValue({
      data: [makeVocab(1)],
      pagination: { page: 1, limit: 200, total: 1, pages: 1 },
    });
    serviceMocks.batchUpdateProgress.mockResolvedValue(1);

    const { wrapper } = createWrapper({ loading: false, vocabularies: [makeVocab(1)] });
    await flushPromises();

    await wrapper.findComponent(FlashCard).trigger('click');
    const knownBtn = wrapper.findAll('button').find((b) => b.text() === en.learn.session.markKnown);
    await knownBtn?.trigger('click');
    await flushPromises();

    expect(serviceMocks.batchUpdateProgress).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ vocabulary_id: 1, status: 'known' }),
      ]),
    );
  });

  // Spec case 10: Retry resets session state
  it('resets session when retry is emitted from SessionSummary', async () => {
    serviceMocks.getVocabularies.mockResolvedValue({
      data: [makeVocab(1)],
      pagination: { page: 1, limit: 200, total: 1, pages: 1 },
    });
    serviceMocks.batchUpdateProgress.mockResolvedValue(1);

    const { wrapper } = createWrapper({ loading: false, vocabularies: [makeVocab(1)] });
    await flushPromises();

    // Complete session
    await wrapper.findComponent(FlashCard).trigger('click');
    const knownBtn = wrapper.findAll('button').find((b) => b.text() === en.learn.session.markKnown);
    await knownBtn?.trigger('click');
    await flushPromises();

    // SessionSummary should be visible
    const summary = wrapper.findComponent(SessionSummary);
    expect(summary.exists()).toBe(true);

    // Emit retry
    await summary.vm.$emit('retry');
    await flushPromises();

    // FlashCard should be back (session reset)
    expect(wrapper.findComponent(FlashCard).exists()).toBe(true);
    expect(wrapper.findComponent(SessionSummary).exists()).toBe(false);
  });
});
