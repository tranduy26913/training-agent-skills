import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import TabInfo from '../TabInfo.vue';
import type { CreateVocabularyDto } from '@/types/vocabularies.types';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: {
      vocab: {
        label: {
          kanji: 'Kanji',
          hiragana: 'Hiragana',
          romaji: 'Romaji',
          meaning_vi: 'Meaning (Vietnamese)',
          on_yomi: 'On\'yomi',
          level: 'Level',
          media_url: 'Media URL',
          note: 'Note',
          tags: 'Tags',
          status: 'Status',
          relations_section: 'Relations',
          related: 'Related Words',
          synonyms: 'Synonyms',
          antonyms: 'Antonyms',
        },
        placeholder: {
          kanji: 'Enter Kanji',
          hiragana: 'Enter Hiragana',
          romaji: 'Enter Romaji',
          meaning: 'Enter meaning',
          on_yomi: 'Enter On\'yomi',
          level: 'Select level',
          media_url: 'Enter media URL',
          note: 'Enter note',
          tags: 'Enter tags (comma-separated)',
        },
        helper: {
          tags: 'Comma-separated tags',
        },
      },
    },
  },
});

const defaultFormData: CreateVocabularyDto = {
  kanji: '',
  hiragana: null,
  romaji: null,
  meaning_vi: '',
  on_yomi: null,
  level: null,
  media_url: null,
  note: null,
  tags: [],
  status: 'Publish',
  related_ids: [],
  synonym_ids: [],
  antonym_ids: [],
};

function createWrapper(formData: CreateVocabularyDto = defaultFormData, errors: Record<string, string> = {}, isEdit = false) {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(TabInfo, {
    global: {
      plugins: [pinia, i18n, PrimeVue],
      stubs: {
        'VocabRelationSelect': {
          name: 'VocabRelationSelect',
          template: '<div class="vocab-relation-select"><slot/></div>',
          props: ['modelValue', 'relationType', 'label', 'excludeIds'],
          emits: ['update:modelValue'],
        },
      },
    },
    props: {
      formData,
      errors,
      isEdit,
    },
  });
}

describe('TabInfo', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // FE-UT-030: Relation MultiSelect renders
  it('renders all form fields', () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain('Kanji');
    expect(wrapper.text()).toContain('Hiragana');
    expect(wrapper.text()).toContain('Romaji');
    expect(wrapper.text()).toContain('Meaning (Vietnamese)');
    expect(wrapper.text()).toContain('On\'yomi');
    expect(wrapper.text()).toContain('Level');
    expect(wrapper.text()).toContain('Media URL');
    expect(wrapper.text()).toContain('Note');
    expect(wrapper.text()).toContain('Tags');
    expect(wrapper.text()).toContain('Status');

    const relationSelects = wrapper.findAllComponents({ name: 'VocabRelationSelect' });
    expect(relationSelects).toHaveLength(3);
  });

  // FE-UT-032: Kanji field required - displays error when provided
  it('displays kanji error when provided', () => {
    const wrapper = createWrapper(defaultFormData, { kanji: 'Kanji is required' });
    expect(wrapper.text()).toContain('Kanji is required');
  });

  // FE-UT-042: Meaning_vi required - displays error when provided
  it('displays meaning_vi error when provided', () => {
    const wrapper = createWrapper(defaultFormData, { meaning_vi: 'Meaning is required' });
    expect(wrapper.text()).toContain('Meaning is required');
  });

  // FE-UT-070: MultiSelect related renders
  it('renders related words MultiSelect', () => {
    const wrapper = createWrapper();
    const relationSelects = wrapper.findAllComponents({ name: 'VocabRelationSelect' });
    expect(relationSelects[0].props('relationType')).toBe('related');
  });

  // FE-UT-071: MultiSelect synonyms renders
  it('renders synonyms MultiSelect', () => {
    const wrapper = createWrapper();
    const relationSelects = wrapper.findAllComponents({ name: 'VocabRelationSelect' });
    expect(relationSelects[1].props('relationType')).toBe('synonym');
  });

  // FE-UT-072: MultiSelect antonyms renders
  it('renders antonyms MultiSelect', () => {
    const wrapper = createWrapper();
    const relationSelects = wrapper.findAllComponents({ name: 'VocabRelationSelect' });
    expect(relationSelects[2].props('relationType')).toBe('antonym');
  });

  // FE-UT-073: MultiSelect excludes self
  it('excludes current vocabulary ID in edit mode', () => {
    const formData = { ...defaultFormData, id: 5 } as CreateVocabularyDto & { id: number };
    const wrapper = createWrapper(formData, {}, true);

    const relationSelects = wrapper.findAllComponents({ name: 'VocabRelationSelect' });
    relationSelects.forEach((select) => {
      expect(select.props('excludeIds')).toEqual([5]);
    });
  });

  // FE-UT-074: MultiSelect pre-selected values
  it('shows pre-selected relation IDs', () => {
    const formData = {
      ...defaultFormData,
      related_ids: [1, 2, 3],
      synonym_ids: [4, 5],
      antonym_ids: [6],
    };
    const wrapper = createWrapper(formData);

    const relationSelects = wrapper.findAllComponents({ name: 'VocabRelationSelect' });
    expect(relationSelects[0].props('modelValue')).toEqual([1, 2, 3]);
    expect(relationSelects[1].props('modelValue')).toEqual([4, 5]);
    expect(relationSelects[2].props('modelValue')).toEqual([6]);
  });

  // Field update events
  it('emits update:formData when kanji changes', async () => {
    const wrapper = createWrapper();

    const kanjiInput = wrapper.findComponent({ name: 'InputText' });
    await kanjiInput.setValue('新しい');

    expect(wrapper.emitted('update:formData')).toBeDefined();
    expect(wrapper.emitted('update:formData')![0][0]).toMatchObject({
      kanji: '新しい',
    });
  });

  it('emits update:formData when meaning_vi changes', async () => {
    const wrapper = createWrapper();

    const meaningInput = wrapper.findComponent({ name: 'Textarea' });
    await meaningInput.setValue('新しい意味');

    expect(wrapper.emitted('update:formData')).toBeDefined();
    expect(wrapper.emitted('update:formData')![0][0]).toMatchObject({
      meaning_vi: '新しい意味',
    });
  });

  it('emits update:formData when tags changes', async () => {
    const wrapper = createWrapper();

    const tagsInput = wrapper.findAllComponents({ name: 'InputText' })[4];
    await tagsInput.setValue('tag1, tag2, tag3');

    expect(wrapper.emitted('update:formData')).toBeDefined();
    // Tags input emits the raw string value, parent component handles parsing
    expect(wrapper.emitted('update:formData')![0][0]).toBeDefined();
  });
});
