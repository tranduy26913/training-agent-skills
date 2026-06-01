// LearnLevelPage コンポーネントテスト / LearnLevelPage and LevelCard unit tests
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import LearnLevelPage from '../LearnLevelPage.vue';
import LevelCard from '../components/LevelCard.vue';
import { useLearnStore } from '@/stores/learn.store';
import en from '@/locales/en';
import type { LevelStatsDto } from '@/types/learn.types';

// =========================================================
// サービスモック / Mock the learn service so store doesn't hit network
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

// =========================================================
// Fixtures
// =========================================================
const LEVEL_STATS: LevelStatsDto[] = ['N5', 'N4', 'N3', 'N2', 'N1'].map((level, i) => ({
  level,
  total: 100 + i * 10,
  known: 20 + i,
  learning: 10,
  new_count: 70 - i,
}));

// =========================================================
// Helper: mount the page with required plugins
// =========================================================
function createWrapper() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/learn', name: 'LearnLevel', component: LearnLevelPage },
      { path: '/learn/:level/list', name: 'LearnVocabList', component: { template: '<div />' } },
    ],
  });

  return {
    wrapper: mount(LearnLevelPage, {
      global: { plugins: [PrimeVue, i18n, router] },
    }),
    router,
  };
}

// =========================================================
// Tests
// =========================================================
describe('LearnLevelPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // Spec case 1: Shows 5 skeletons when loadingStats=true
  it('shows skeleton cards while loading', () => {
    const store = useLearnStore();
    store.loadingStats = true;
    const { wrapper } = createWrapper();
    // Should render skeleton elements (not LevelCards)
    expect(wrapper.findAllComponents({ name: 'Skeleton' })).toHaveLength(5);
  });

  // Spec case 2: Shows 5 LevelCards after data is loaded
  it('renders one LevelCard per level stat', () => {
    const store = useLearnStore();
    store.loadingStats = false;
    store.levelStats = LEVEL_STATS;

    const { wrapper } = createWrapper();
    const cards = wrapper.findAllComponents(LevelCard);
    expect(cards).toHaveLength(5);
  });

  // Spec case 2: Each LevelCard receives correct props
  it('passes correct level and stats props to each LevelCard', () => {
    const store = useLearnStore();
    store.loadingStats = false;
    store.levelStats = LEVEL_STATS;

    const { wrapper } = createWrapper();
    const cards = wrapper.findAllComponents(LevelCard);
    expect(cards[0].props('level')).toBe('N5');
    expect(cards[0].props('stats')).toMatchObject({ total: 100, known: 20 });
  });

  // Spec case 3: Navigate to LearnVocabList when Start button clicked
  it('navigates to LearnVocabList when a LevelCard emits start', async () => {
    const store = useLearnStore();
    store.loadingStats = false;
    store.levelStats = [LEVEL_STATS[0]];

    const { wrapper, router } = createWrapper();
    const pushSpy = vi.spyOn(router, 'push');

    await wrapper.findAllComponents(LevelCard)[0].vm.$emit('start', 'N5');
    expect(pushSpy).toHaveBeenCalledWith({ name: 'LearnVocabList', params: { level: 'N5' } });
  });

  // Spec case 4: ProgressBar shows correct percentage
  it('shows correct progress percentage in LevelCard (known=45, total=120 → 38%)', () => {
    const store = useLearnStore();
    store.loadingStats = false;
    store.levelStats = [{ level: 'N5', total: 120, known: 45, learning: 20, new_count: 55 }];

    const { wrapper } = createWrapper();
    const card = wrapper.findAllComponents(LevelCard)[0];
    // Math.round(45/120 * 100) = Math.round(37.5) = 38 in JavaScript
    const progressBar = card.findComponent({ name: 'ProgressBar' });
    expect(progressBar.props('value')).toBe(38);
  });

  // Error state
  it('shows error message when store.error is set', () => {
    const store = useLearnStore();
    store.error = 'Failed to load';
    const { wrapper } = createWrapper();
    expect(wrapper.text()).toContain('Failed to load');
  });

  // Calls fetchLevelStats on mount
  it('calls fetchLevelStats when mounted', async () => {
    serviceMocks.getLevelStats.mockResolvedValue(LEVEL_STATS);
    const { wrapper } = createWrapper();
    await flushPromises();
    expect(serviceMocks.getLevelStats).toHaveBeenCalled();
  });
});
