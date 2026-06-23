// Projects Pinia store.
import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useProjects } from '@pages/projects/composables/useProjects';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@apptypes/projects.types';

export const useProjectsStore = defineStore('projects', () => {
  const {
    getProjects: apiGetProjects,
    getProject: apiGetProject,
    createProject: apiCreateProject,
    updateProject: apiUpdateProject,
    deleteProject: apiDeleteProject,
  } = useProjects();

  // State
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const loading = shallowRef(false);
  const error = shallowRef<string | null>(null);

  // Extract a readable error message from an unknown catch value.
  function extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message || fallback;
    }
    return fallback;
  }

  // Fetch all projects.
  async function fetchProjects(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      projects.value = await apiGetProjects();
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch projects');
    } finally {
      loading.value = false;
    }
  }

  // Fetch a single project.
  async function fetchProject(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      currentProject.value = await apiGetProject(id);
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch project');
    } finally {
      loading.value = false;
    }
  }

  // Create a project (does NOT auto-reload list).
  async function createProject(data: CreateProjectDto): Promise<void> {
    await apiCreateProject(data);
  }

  // Update a project (does NOT auto-reload list).
  async function updateProject(id: number, data: UpdateProjectDto): Promise<void> {
    await apiUpdateProject(id, data);
  }

  // Delete a project and auto-reload the list.
  async function deleteProject(id: number): Promise<void> {
    await apiDeleteProject(id);
    await fetchProjects();
  }

  // Clear current project.
  function clearCurrentProject(): void {
    currentProject.value = null;
  }

  return {
    // State
    projects, currentProject, loading, error,
    // Actions
    fetchProjects, fetchProject, createProject, updateProject, deleteProject, clearCurrentProject,
  };
});
