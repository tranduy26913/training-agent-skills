import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import JobMonitorFilters from '../JobMonitorFilters.vue';

describe('JobMonitorFilters', () => {
  it('emits filter change after debounced search input', async () => {
    vi.useFakeTimers();
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: { common: { search: 'Search' } } },
    });

    const wrapper = mount(JobMonitorFilters, {
      global: {
        plugins: [PrimeVue, i18n],
      },
    });

    const input = wrapper.find('[data-testid="job-filter-search"]');
    await input.setValue('9001');

    vi.advanceTimersByTime(360);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('filterChange');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toMatchObject({ search: '9001', page: 1, limit: 25 });

    vi.useRealTimers();
  });

  it('clears filters and emits reset state', async () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: { common: { search: 'Search' } } },
    });

    const wrapper = mount(JobMonitorFilters, {
      global: {
        plugins: [PrimeVue, i18n],
      },
    });

    await wrapper.find('[data-testid="job-filter-clear"]').trigger('click');
    const last = (wrapper.emitted('filterChange')?.slice(-1)[0] as Record<string, unknown>[])[0];

    expect(last.search).toBeUndefined();
    expect(last.page).toBe(1);
    expect(last.limit).toBe(25);
  });
});
