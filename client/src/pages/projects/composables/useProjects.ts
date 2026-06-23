// Projects API composable wrapper.
import { projectsApiService } from '@services/projects.service';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@apptypes/projects.types';

// Re-export types for component usage.
export type { Project, CreateProjectDto, UpdateProjectDto };

// Thin API wrappers for project endpoints.
export function useProjects() {
  // Get all projects.
  async function getProjects(): Promise<Project[]> {
    return projectsApiService.getProjects();
  }

  // Get a single project.
  async function getProject(id: number): Promise<Project> {
    return projectsApiService.getById(id);
  }

  // Create a project.
  async function createProject(data: CreateProjectDto): Promise<Project> {
    return projectsApiService.create(data);
  }

  // Update a project.
  async function updateProject(id: number, data: UpdateProjectDto): Promise<Project> {
    return projectsApiService.update(id, data);
  }

  // Delete a project.
  async function deleteProject(id: number): Promise<void> {
    return projectsApiService.delete(id);
  }

  return { getProjects, getProject, createProject, updateProject, deleteProject };
}
