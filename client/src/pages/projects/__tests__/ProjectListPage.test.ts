/**
 * Unit tests for ProjectListPage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import ProjectListPage from '../ProjectListPage.vue';
import { useProjectsStore } from '@stores/projects.store';
import type { Project } from '@apptypes/projects.types';

// ---- Mocks ----
const routerPush = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: {},
  },
});

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  description: 'A test description',
  projectPrompt: null,
  headline: null,
  caption: null,
  subtext: null,
  ownerId: 1,
  ownerName: 'Admin',
  isDeleted: false,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

type StoreState = Partial<ReturnType<typeof useProjectsStore>>;

function createWrapper(storeState: StoreState = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useProjectsStore();
  Object.assign(store, {
    projects: ref<Project[]>([]),
    loading: ref<boolean>(false),
    error: ref<string | null>(null),
    fetchProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    ...storeState,
  });

  return mount(ProjectListPage, {
    global: {
      plugins: [pinia, i18n, PrimeVue],
      stubs: {
        Button: true,
        ProjectCard: true,
        ProjectFormDialog: true,
        ProjectDeleteDialog: true,
        Skeleton: true,
      },
    },
  });
}

describe('ProjectListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // F-LIST-01: Shows skeleton when loading
  it('shows skeleton cards when loading', () => {
    const wrapper = createWrapper({ loading: true });
    const skeletons = wrapper.findAllComponents({ name: 'Skeleton' });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // F-LIST-02: Shows cards when loaded
  it('renders ProjectCard components when projects loaded', () => {
    const wrapper = createWrapper({ projects: [mockProject] });
    const cards = wrapper.findAllComponents({ name: 'ProjectCard' });
    expect(cards.length).toBe(1);
  });

  // F-LIST-03: Shows empty state when no projects
  it('shows empty state when no projects', () => {
    const wrapper = createWrapper({ projects: [] });
    expect(wrapper.text()).toContain('Chưa có Project nào');
  });

  // F-LIST-07: handleCardClick navigates to detail
  it('navigates to detail on card click', async () => {
    const wrapper = createWrapper({ projects: [mockProject] });
    const card = wrapper.findComponent({ name: 'ProjectCard' });
    await card.vm.$emit('click', 1);
    expect(routerPush).toHaveBeenCalledWith({ name: 'ProjectDetail', params: { id: 1 } });
  });

  // F-LIST-08: handleFormSaved (create) calls createProject
  it('calls createProject on form saved in create mode', async () => {
    const createProject = vi.fn().mockResolvedValue(undefined);
    const fetchProjects = vi.fn().mockResolvedValue(undefined);
    const wrapper = createWrapper({ createProject, fetchProjects });

    // Open create dialog
    const createBtn = wrapper.findComponent({ name: 'Button' });
    await createBtn.trigger('click');

    // Emit saved from dialog
    const dialog = wrapper.findComponent({ name: 'ProjectFormDialog' });
    await dialog.vm.$emit('saved', { name: 'New Project' });

    expect(createProject).toHaveBeenCalledWith({ name: 'New Project' });
  });

  // F-LIST-10: handleDeleteConfirmed calls deleteProject
  it('calls deleteProject on delete confirmed', async () => {
    const deleteProject = vi.fn().mockResolvedValue(undefined);
    const fetchProjects = vi.fn().mockResolvedValue(undefined);
    const wrapper = createWrapper({ projects: [mockProject], deleteProject, fetchProjects });

    // Trigger delete via card emit
    const card = wrapper.findComponent({ name: 'ProjectCard' });
    await card.vm.$emit('delete', 1);

    // Confirm delete
    const delDialog = wrapper.findComponent({ name: 'ProjectDeleteDialog' });
    await delDialog.vm.$emit('confirmed');

    expect(deleteProject).toHaveBeenCalledWith(1);
  });

  // fetchProjects called on mount
  it('calls fetchProjects on mount', () => {
    const fetchProjects = vi.fn();
    createWrapper({ fetchProjects });
    expect(fetchProjects).toHaveBeenCalledTimes(1);
  });
});
