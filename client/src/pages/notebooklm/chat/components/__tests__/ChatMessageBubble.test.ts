/**
 * Unit tests for ChatMessageBubble component
 * ChatMessageBubbleコンポーネントのユニットテスト
 */
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/locales/en';
import ChatMessageBubble from '../ChatMessageBubble.vue';
import type { ChatMessage } from '@/types/notebooklm.types';

// PrimeVueコンポーネントのモック / Mock PrimeVue Accordion components
vi.mock('primevue/accordion', () => ({
  default: { template: '<div data-testid="accordion"><slot /></div>' },
}));
vi.mock('primevue/accordionpanel', () => ({
  default: { template: '<div data-testid="accordion-panel"><slot /></div>' },
}));
vi.mock('primevue/accordionheader', () => ({
  default: { template: '<div data-testid="accordion-header"><slot /></div>' },
}));
vi.mock('primevue/accordioncontent', () => ({
  default: { template: '<div data-testid="accordion-content"><slot /></div>' },
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

// ---------- Fixtures ----------

const USER_MESSAGE: ChatMessage = {
  id: 1,
  sessionId: 10,
  role: 'user',
  content: 'What is this document about?',
  sources: null,
  jobId: null,
  createdAt: '2026-05-11T08:00:00.000Z',
};

const ASSISTANT_MESSAGE: ChatMessage = {
  id: 2,
  sessionId: 10,
  role: 'assistant',
  content: 'This document discusses AI.',
  sources: [
    { document_id: 7, filename: 'ai.pdf', snippet: 'Artificial intelligence is...' },
    { document_id: 8, filename: 'ml.pdf', snippet: 'Machine learning enables...' },
  ],
  jobId: 200,
  createdAt: '2026-05-11T08:01:00.000Z',
};

const ASSISTANT_NO_SOURCES: ChatMessage = {
  id: 3,
  sessionId: 10,
  role: 'assistant',
  content: 'I could not find relevant sources.',
  sources: null,
  jobId: null,
  createdAt: '2026-05-11T08:02:00.000Z',
};

function mountBubble(message: ChatMessage) {
  return mount(ChatMessageBubble, {
    props: { message },
    global: { plugins: [i18n] },
  });
}

describe('ChatMessageBubble', () => {
  // ユーザーメッセージのスタイル / User message styling
  describe('user message', () => {
    it('renders message content', () => {
      const wrapper = mountBubble(USER_MESSAGE);
      expect(wrapper.text()).toContain('What is this document about?');
    });

    it('aligns to the right (justify-end)', () => {
      const wrapper = mountBubble(USER_MESSAGE);
      expect(wrapper.find('div').classes()).toContain('justify-end');
    });

    it('does not render source viewer when sources are null', () => {
      const wrapper = mountBubble(USER_MESSAGE);
      expect(wrapper.find('[data-testid="accordion"]').exists()).toBe(false);
    });
  });

  // アシスタントメッセージのスタイル / Assistant message styling
  describe('assistant message', () => {
    it('renders message content', () => {
      const wrapper = mountBubble(ASSISTANT_MESSAGE);
      expect(wrapper.text()).toContain('This document discusses AI.');
    });

    it('aligns to the left (justify-start)', () => {
      const wrapper = mountBubble(ASSISTANT_MESSAGE);
      expect(wrapper.find('div').classes()).toContain('justify-start');
    });

    it('renders source viewer when sources are present', () => {
      const wrapper = mountBubble(ASSISTANT_MESSAGE);
      expect(wrapper.find('[data-testid="accordion"]').exists()).toBe(true);
    });

    it('does not render source viewer when sources are null', () => {
      const wrapper = mountBubble(ASSISTANT_NO_SOURCES);
      expect(wrapper.find('[data-testid="accordion"]').exists()).toBe(false);
    });

    it('does not render source viewer when sources array is empty', () => {
      const emptySourcesMessage: ChatMessage = { ...ASSISTANT_MESSAGE, sources: [] };
      const wrapper = mountBubble(emptySourcesMessage);
      expect(wrapper.find('[data-testid="accordion"]').exists()).toBe(false);
    });
  });

  // コンテンツ表示 / Content rendering
  it('preserves whitespace in message content', () => {
    const multilineMessage: ChatMessage = { ...USER_MESSAGE, content: 'Line 1\nLine 2' };
    const wrapper = mountBubble(multilineMessage);
    const p = wrapper.find('p');
    expect(p.classes()).toContain('whitespace-pre-wrap');
    expect(p.text()).toContain('Line 1');
  });
});
