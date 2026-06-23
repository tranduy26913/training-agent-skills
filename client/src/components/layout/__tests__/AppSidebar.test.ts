import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import AppSidebar from '../AppSidebar.vue';
import { useAuthStore } from '@/stores/auth.store';
import en from '@/locales/en';

describe('AppSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('renders Vocabularies menu item', () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      status: 'active',
    };

    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en },
    });

    const wrapper = mount(AppSidebar, {
      global: {
        plugins: [i18n],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>',
          },
        },
      },
    });

    const vocabLink = wrapper.find('a[href="/vocabularies"]');
    expect(vocabLink.exists()).toBe(true);
    expect(wrapper.text()).toContain('Vocabularies');
  });
});
