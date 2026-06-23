/**
 * Unit tests for ProjectCard component.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import ProjectCard from '../ProjectCard.vue';
import type { Project } from '@apptypes/projects.types';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: { en: { common: { edit: 'Edit', delete: 'Delete' } } },
});

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  description: 'A test description',
  projectPrompt: 'A test prompt',
  headline: null,
  caption: null,
  subtext: null,
  ownerId: 1,
  ownerName: 'Admin',
  isDeleted: false,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function createWrapper(projectOverrides: Partial<Project> = {}) {
  return mount(ProjectCard, {
    props: {
      project: { ...mockProject, ...projectOverrides },
    },
    global: {
      plugins: [i18n, PrimeVue],
      directives: {
        tooltip: () => undefined,
      },
      stubs: {
        Button: {
          template: '<button :class="`pi ${icon}`" @click="$emit(\'click\', $event)"><slot /></button>',
          props: ['icon', 'label'],
        },
      },
    },
  });
}

describe('ProjectCard', () => {
  // F-CARD-01: Displays project name
  it('renders project name', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Test Project');
  });

  // F-CARD-02: Displays description
  it('renders description when present', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('A test description');
  });

  // F-CARD-03: Hides description when null
  it('does not render description when null', () => {
    const wrapper = createWrapper({ description: null });
    expect(wrapper.text()).not.toContain('A test description');
  });

  // F-CARD-04: Displays prompt preview
  it('renders prompt preview when present', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('A test prompt');
  });

  // F-CARD-05: Hides prompt preview when null
  it('does not render prompt preview when null', () => {
    const wrapper = createWrapper({ projectPrompt: null });
    expect(wrapper.text()).not.toContain('A test prompt');
  });

  // F-CARD-06: Emits click when card is clicked
  it('emits click with project id on card click', async () => {
    const wrapper = createWrapper();
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')![0]).toEqual([1]);
  });

  // F-CARD-07: Emits edit when edit button clicked
  it('emits edit with project id on edit click', async () => {
    const wrapper = createWrapper();
    const editBtn = wrapper.find('.pi-pencil');
    await editBtn.trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')![0]).toEqual([1]);
  });

  // F-CARD-08: Emits delete when delete button clicked
  it('emits delete with project id on delete click', async () => {
    const wrapper = createWrapper();
    const deleteBtn = wrapper.find('.pi-trash');
    await deleteBtn.trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')![0]).toEqual([1]);
  });
});
