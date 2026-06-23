/**
 * Unit tests for useProjectsStore.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProjectsStore } from '../projects.store';
import type { CreateProjectDto, UpdateProjectDto } from '@apptypes/projects.types';

// ---- Composable mock ----
const projectsComposableMocks = vi.hoisted(() => ({
  getProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('@pages/projects/composables/useProjects', () => ({
  useProjects: () => projectsComposableMocks,
}));

describe('useProjectsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // F-STORE-01: fetchProjects updates projects
  it('fetchProjects sets projects from API', async () => {
    const mockProjects = [{ id: 1, name: 'Test' }];
    projectsComposableMocks.getProjects.mockResolvedValue(mockProjects);

    const store = useProjectsStore();
    await store.fetchProjects();

    expect(store.projects).toEqual(mockProjects);
  });

  // F-STORE-02: fetchProjects sets loading flag
  it('fetchProjects sets loading true during call', async () => {
    projectsComposableMocks.getProjects.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 50)),
    );

    const store = useProjectsStore();
    const promise = store.fetchProjects();

    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  // F-STORE-03: fetchProjects sets error on failure
  it('fetchProjects sets error on failure', async () => {
    projectsComposableMocks.getProjects.mockRejectedValue(new Error('API error'));

    const store = useProjectsStore();
    await store.fetchProjects();

    expect(store.error).toBeTruthy();
  });

  // F-STORE-04: createProject calls composable, does NOT reload list
  it('createProject calls composable but not fetchProjects', async () => {
    const data: CreateProjectDto = { name: 'New' };
    projectsComposableMocks.createProject.mockResolvedValue({ id: 1, ...data });

    const store = useProjectsStore();
    await store.createProject(data);

    expect(projectsComposableMocks.createProject).toHaveBeenCalledWith(data);
    expect(projectsComposableMocks.getProjects).not.toHaveBeenCalled();
  });

  // F-STORE-05: updateProject calls composable, does NOT reload list
  it('updateProject calls composable but not fetchProjects', async () => {
    const data: UpdateProjectDto = { name: 'Updated' };
    projectsComposableMocks.updateProject.mockResolvedValue({ id: 1, ...data });

    const store = useProjectsStore();
    await store.updateProject(1, data);

    expect(projectsComposableMocks.updateProject).toHaveBeenCalledWith(1, data);
    expect(projectsComposableMocks.getProjects).not.toHaveBeenCalled();
  });

  // F-STORE-06: deleteProject auto-reloads fetchProjects
  it('deleteProject calls composable and reloads list', async () => {
    projectsComposableMocks.deleteProject.mockResolvedValue(undefined);
    projectsComposableMocks.getProjects.mockResolvedValue([]);

    const store = useProjectsStore();
    await store.deleteProject(1);

    expect(projectsComposableMocks.deleteProject).toHaveBeenCalledWith(1);
    expect(projectsComposableMocks.getProjects).toHaveBeenCalled();
  });

  // F-STORE-07: clearCurrentProject clears state
  it('clearCurrentProject resets currentProject to null', () => {
    const store = useProjectsStore();
    store.currentProject = { id: 1, name: 'Test' } as any;

    store.clearCurrentProject();

    expect(store.currentProject).toBeNull();
  });

  // F-STORE-08: fetchProject sets currentProject
  it('fetchProject sets currentProject from API', async () => {
    const mockProject = { id: 1, name: 'Test' };
    projectsComposableMocks.getProject.mockResolvedValue(mockProject);

    const store = useProjectsStore();
    await store.fetchProject(1);

    expect(store.currentProject).toEqual(mockProject);
  });
});
