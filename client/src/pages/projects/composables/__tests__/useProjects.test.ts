/**
 * Unit tests for useProjects composable.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjects } from '@pages/projects/composables/useProjects';
import type { CreateProjectDto } from '@apptypes/projects.types';

// ---- Service mock ----
const projectsServiceMocks = vi.hoisted(() => ({
  getProjects: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@services/projects.service', () => ({
  projectsApiService: projectsServiceMocks,
}));

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // F-COMP-01: getProjects calls API and returns list
  it('calls getProjects and returns data', async () => {
    const mockProjects = [{ id: 1, name: 'Test' }];
    projectsServiceMocks.getProjects.mockResolvedValue(mockProjects);

    const { getProjects } = useProjects();
    const result = await getProjects();

    expect(projectsServiceMocks.getProjects).toHaveBeenCalled();
    expect(result).toEqual(mockProjects);
  });

  // F-COMP-02: createProject calls API with data
  it('calls create with correct data', async () => {
    const data: CreateProjectDto = { name: 'Test Project' };
    projectsServiceMocks.create.mockResolvedValue({ id: 1, ...data });

    const { createProject } = useProjects();
    await createProject(data);

    expect(projectsServiceMocks.create).toHaveBeenCalledWith(data);
  });

  // F-COMP-03: updateProject calls API with id and data
  it('calls update with id and data', async () => {
    const data: CreateProjectDto = { name: 'Updated' };
    projectsServiceMocks.update.mockResolvedValue({ id: 5, ...data });

    const { updateProject } = useProjects();
    await updateProject(5, data);

    expect(projectsServiceMocks.update).toHaveBeenCalledWith(5, data);
  });

  // F-COMP-04: deleteProject calls API with id
  it('calls delete with id', async () => {
    projectsServiceMocks.delete.mockResolvedValue(undefined);

    const { deleteProject } = useProjects();
    await deleteProject(1);

    expect(projectsServiceMocks.delete).toHaveBeenCalledWith(1);
  });
});
