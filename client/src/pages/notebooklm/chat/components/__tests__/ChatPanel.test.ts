/**
 * Unit tests for ChatPanel component
 * ChatPanelコンポーネントのユニットテスト
 */
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/locales/en';
import ChatPanel from '../ChatPanel.vue';
import type { ChatMessage } from '@/types/notebooklm.types';

// PrimeVueコンポーネントのモック / Mock PrimeVue components
vi.mock('primevue/card', () => ({
  default: { template: '<div class="p-card"><slot name="content" /></div>' },
}));
vi.mock('primevue/button', () => ({
  default: {
    template: '<button :disabled="$attrs.disabled" @click="$emit(\'click\')">{{ $attrs.label }}</button>',
  },
}));
vi.mock('primevue/textarea', () => ({
  default: {
    template: '<textarea :value="modelValue" :disabled="$attrs.disabled" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)"></textarea>',
    props: ['modelValue'],
    emits: ['update:modelValue', 'keydown'],
  },
}));

// ChatMessageBubbleのモック / Mock the child bubble component
vi.mock('../ChatMessageBubble.vue', () => ({
  default: {
    template: '<div class="message-bubble">{{ message.content }}</div>',
    props: ['message'],
  },
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

// ---------- Fixtures ----------

const USER_MESSAGE: ChatMessage = {
  id: 1,
  sessionId: 10,
  role: 'user',
  content: 'Hello there!',
  sources: null,
  jobId: null,
  createdAt: '2026-05-11T08:00:00.000Z',
};

const ASSISTANT_MESSAGE: ChatMessage = {
  id: 2,
  sessionId: 10,
  role: 'assistant',
  content: 'Hi, how can I help?',
  sources: null,
  jobId: null,
  createdAt: '2026-05-11T08:01:00.000Z',
};

function mountPanel(messages: ChatMessage[] = [], loading = false) {
  return mount(ChatPanel, {
    props: { messages, loading },
    global: { plugins: [i18n] },
  });
}

describe('ChatPanel', () => {
  // 空状態 / Empty state
  describe('empty state', () => {
    it('shows empty message when messages array is empty and not loading', () => {
      const wrapper = mountPanel([], false);
      expect(wrapper.text()).toContain(en.notebooklmChat.noMessages);
    });

    it('does not show empty message when there are messages', () => {
      const wrapper = mountPanel([USER_MESSAGE]);
      expect(wrapper.text()).not.toContain(en.notebooklmChat.noMessages);
    });
  });

  // メッセージレンダリング / Message rendering
  describe('message rendering', () => {
    it('renders all messages', () => {
      const wrapper = mountPanel([USER_MESSAGE, ASSISTANT_MESSAGE]);
      const bubbles = wrapper.findAll('.message-bubble');
      expect(bubbles).toHaveLength(2);
    });

    it('renders message content via child bubble components', () => {
      const wrapper = mountPanel([USER_MESSAGE]);
      expect(wrapper.text()).toContain('Hello there!');
    });

    // ユーザーメッセージが右側に表示されることの確認（楽観的更新のシナリオ）
    // Ensures user messages are rendered — the optimistic-update scenario
    it('renders user message immediately when added to messages prop', () => {
      const wrapper = mountPanel([USER_MESSAGE]);
      const bubbles = wrapper.findAll('.message-bubble');
      expect(bubbles).toHaveLength(1);
      expect(bubbles[0].text()).toContain('Hello there!');
    });

    it('renders both user and assistant messages when present', () => {
      const wrapper = mountPanel([USER_MESSAGE, ASSISTANT_MESSAGE]);
      const texts = wrapper.findAll('.message-bubble').map((b) => b.text());
      expect(texts).toContain('Hello there!');
      expect(texts).toContain('Hi, how can I help?');
    });

    it('passes each message object to the bubble component as a prop', () => {
      const wrapper = mountPanel([USER_MESSAGE, ASSISTANT_MESSAGE]);
      // Both messages must produce one bubble each
      const bubbles = wrapper.findAll('.message-bubble');
      expect(bubbles).toHaveLength(2);
      expect(bubbles[0].text()).toBe('Hello there!');
      expect(bubbles[1].text()).toBe('Hi, how can I help?');
    });
  });

  // ローディング状態 / Loading state
  describe('loading state', () => {
    it('shows spinner when loading', () => {
      const wrapper = mountPanel([], true);
      expect(wrapper.find('.pi-spinner').exists()).toBe(true);
    });

    it('hides spinner when not loading', () => {
      const wrapper = mountPanel([], false);
      expect(wrapper.find('.pi-spinner').exists()).toBe(false);
    });

    it('does not show empty message when loading (even with no messages)', () => {
      const wrapper = mountPanel([], true);
      expect(wrapper.text()).not.toContain(en.notebooklmChat.noMessages);
    });

    it('disables textarea and button when loading', () => {
      const wrapper = mountPanel([], true);
      expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
      expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    });
  });

  // メッセージ送信 / Message sending
  describe('send message', () => {
    it('emits send event with trimmed content when send button clicked', async () => {
      const wrapper = mountPanel();
      const textarea = wrapper.find('textarea');
      await textarea.setValue('  Hello world  ');
      await wrapper.find('button').trigger('click');

      expect(wrapper.emitted('send')?.[0]).toEqual(['Hello world']);
    });

    it('clears input after sending', async () => {
      const wrapper = mountPanel();
      const textarea = wrapper.find('textarea');
      await textarea.setValue('My question');
      await wrapper.find('button').trigger('click');

      expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('');
    });

    it('does not emit send when input is empty', async () => {
      const wrapper = mountPanel();
      await wrapper.find('textarea').setValue('   ');
      await wrapper.find('button').trigger('click');

      expect(wrapper.emitted('send')).toBeUndefined();
    });

    it('does not emit send when loading', async () => {
      const wrapper = mountPanel([], true);
      await wrapper.find('textarea').setValue('Some question');
      await wrapper.find('button').trigger('click');

      expect(wrapper.emitted('send')).toBeUndefined();
    });

    it('emits send on Enter key (without Shift)', async () => {
      const wrapper = mountPanel();
      await wrapper.find('textarea').setValue('Press enter test');

      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false, bubbles: true });
      wrapper.find('textarea').element.dispatchEvent(event);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('send')?.[0]).toEqual(['Press enter test']);
    });

    it('does not emit send on Shift+Enter', async () => {
      const wrapper = mountPanel();
      await wrapper.find('textarea').setValue('Shift enter test');

      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true });
      wrapper.find('textarea').element.dispatchEvent(event);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('send')).toBeUndefined();
    });
  });
});
