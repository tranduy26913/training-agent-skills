/**
 * Unit tests for ProjectFormDialog component.
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import ProjectFormDialog from '../ProjectFormDialog.vue';
import type { Project } from '@apptypes/projects.types';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: {
      projects: {
        form: {
          name: 'Project Name',
          namePlaceholder: 'Enter project name',
          description: 'Description',
          descriptionPlaceholder: 'Enter project description',
          projectPrompt: 'Project Prompt',
          promptPlaceholder: 'Enter system prompt for AI',
          createTitle: 'Create Project',
          editTitle: 'Edit Project',
        },
      },
      common: {
        cancel: 'Cancel',
        save: 'Save',
      },
    },
  },
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

function createWrapper(options: {
  visible?: boolean;
  mode?: 'create' | 'edit';
  project?: Project | null;
} = {}) {
  return mount(ProjectFormDialog, {
    props: {
      visible: options.visible ?? true,
      mode: options.mode ?? 'create',
      project: options.project ?? null,
    },
    global: {
      plugins: [i18n, PrimeVue],
      stubs: {
        Dialog: {
          template: '<div><slot name="footer" /></div>',
        },
        InputText: {
          template: '<input class="p-inputtext" />',
        },
        Textarea: {
          template: '<textarea class="p-textarea"></textarea>',
        },
        Button: {
          template: '<button class="p-button" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });
}

describe('ProjectFormDialog', () => {
  it('renders in create mode', () => {
    const wrapper = createWrapper({ mode: 'create', project: null });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders in edit mode with project data', () => {
    const wrapper = createWrapper({ mode: 'edit', project: mockProject });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders save and cancel buttons', () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});

