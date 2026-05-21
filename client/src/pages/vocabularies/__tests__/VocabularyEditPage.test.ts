/**
 * VocabularyEditPage tests
 * VocabularyEditPageのテスト
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
import VocabularyEditPage from '../VocabularyEditPage.vue';
import VocabularyInfoTab from '../components/VocabularyInfoTab.vue';

// ストアモック / Store mock
const storeMocks = vi.hoisted(() => ({
  fetchVocabulary: vi.fn().mockResolvedValue(undefined),
  fetchAuditLogs: vi.fn().mockResolvedValue(undefined),
  fetchSimpleList: vi.fn().mockResolvedValue(undefined),
  updateVocabulary: vi.fn().mockResolvedValue(undefined),
  resolveReport: vi.fn().mockResolvedValue(undefined),
  rejectReport: vi.fn().mockResolvedValue(undefined),
  clearCurrentVocabulary: vi.fn(),
  currentVocabulary: null as null | { id: number },
  auditLogs: [],
  simpleList: [],
  loading: false,
  loadingVocabulary: false,
  error: null,
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
    { path: '/vocabularies/:id/edit', name: 'VocabularyEdit', component: { template: '<div />' } },
  ],
});

function mountEditPage(routeId = '5') {
  router.currentRoute.value.params['id'] = routeId;
  return mount(VocabularyEditPage, {
    global: {
      plugins: [createPinia(), PrimeVue, ToastService, ConfirmationService, router, i18n],
      stubs: {
        VocabularyInfoTab: {
          name: 'VocabularyInfoTab',
          template: '<div class="stub-info-tab" />',
          emits: ['submit', 'cancel'],
          props: ['mode', 'initialData', 'loading', 'vocabularyOptions'],
        },
        VocabularyAuditTab: {
          name: 'VocabularyAuditTab',
          template: '<div class="stub-audit-tab" />',
          emits: ['resolveReport', 'rejectReport'],
          props: ['vocabulary', 'auditLogs', 'reports', 'loadingLogs', 'loadingReports'],
        },
        VocabularyAnalyticsTab: {
          name: 'VocabularyAnalyticsTab',
          template: '<div class="stub-analytics-tab" />',
          props: ['analytics', 'loading'],
        },
      },
      mocks: {
        $route: { params: { id: routeId } },
      },
    },
  });
}

describe('VocabularyEditPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    storeMocks.fetchVocabulary.mockResolvedValue(undefined);
    storeMocks.fetchAuditLogs.mockResolvedValue(undefined);
    storeMocks.fetchSimpleList.mockResolvedValue(undefined);
    storeMocks.updateVocabulary.mockResolvedValue(undefined);
    storeMocks.currentVocabulary = null;
    storeMocks.auditLogs = [];
  });

  // EP-1: Load vocabulary, auditLogs, simpleList on mount
  it('EP-1: calls fetchVocabulary, fetchAuditLogs, fetchSimpleList on mount', async () => {
    // マウント時にfetchVocabulary/fetchAuditLogs/fetchSimpleListが呼ばれる
    mountEditPage('5');
    await flushPromises();
    expect(storeMocks.fetchVocabulary).toHaveBeenCalledWith(5);
    expect(storeMocks.fetchAuditLogs).toHaveBeenCalledWith(5);
    expect(storeMocks.fetchSimpleList).toHaveBeenCalledTimes(1);
  });

  // EP-2: clearCurrentVocabulary called on unmount
  it('EP-2: calls clearCurrentVocabulary on unmount', async () => {
    // アンマウント時にclearCurrentVocabularyが呼ばれる
    const wrapper = mountEditPage('5');
    await flushPromises();
    wrapper.unmount();
    expect(storeMocks.clearCurrentVocabulary).toHaveBeenCalledTimes(1);
  });

  // EP-3: Submit update successfully — stay on page
  it('EP-3: calls updateVocabulary and shows success toast (no navigate)', async () => {
    // 更新成功後はページを離れない（toast success表示）
    const wrapper = mountEditPage('5');
    await flushPromises();
    const pushSpy = vi.spyOn(router, 'push');

    const dto = { meaning_vi: 'Updated', hiragana: 'てすと', level: 'N4', status: 'publish' };
    wrapper.findComponent(VocabularyInfoTab).vm.$emit('submit', dto);
    await flushPromises();

    expect(storeMocks.updateVocabulary).toHaveBeenCalledWith(5, dto);
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    expect(pushSpy).not.toHaveBeenCalled();
  });

  // EP-4: Resolve report opens ConfirmDialog
  it('EP-4: calls confirm.require on resolveReport emit from AuditTab', async () => {
    // AuditTabのresolveReportイベントでconfirm.requireが呼ばれる
    const wrapper = mountEditPage('5');
    await flushPromises();

    wrapper.findComponent({ name: 'VocabularyAuditTab' }).vm.$emit('resolveReport', 10);
    await wrapper.vm.$nextTick();

    expect(mockConfirmRequire).toHaveBeenCalledTimes(1);
  });

  // EP-5: Calls resolveReport when confirm accepted
  it('EP-5: calls store.resolveReport when confirm accepted', async () => {
    // confirm承認時にstore.resolveReportが呼ばれる
    mockConfirmRequire.mockImplementationOnce(({ accept }: any) => accept());

    const wrapper = mountEditPage('5');
    await flushPromises();

    wrapper.findComponent({ name: 'VocabularyAuditTab' }).vm.$emit('resolveReport', 10);
    await flushPromises();

    expect(storeMocks.resolveReport).toHaveBeenCalledWith(10);
  });

  // EP-6: Reject report calls rejectReport
  it('EP-6: calls store.rejectReport on rejectReport emit', async () => {
    // rejectReport emitでstore.rejectReportが呼ばれる
    mockConfirmRequire.mockImplementationOnce(({ accept }: any) => accept());

    const wrapper = mountEditPage('5');
    await flushPromises();

    wrapper.findComponent({ name: 'VocabularyAuditTab' }).vm.$emit('rejectReport', 11);
    await flushPromises();

    expect(storeMocks.rejectReport).toHaveBeenCalledWith(11);
  });
});
