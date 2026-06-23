// Projects API service extending the base client.
import apiClient from './api.service';
import { BaseApiClient } from './base-api.service';
import type { AxiosResponse } from 'axios';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@apptypes/projects.types';

// Projects API client.
class ProjectsApiClient extends BaseApiClient<Project, CreateProjectDto, UpdateProjectDto> {
  constructor() {
    super('/admin/projects');
  }

  // Get all projects (no pagination). Response: { data: Project[] }.
  async getProjects(): Promise<Project[]> {
    const response: AxiosResponse<{ data: Project[] }> = await apiClient.get(
      this.basePath,
    );
    return response.data.data;
  }

  // Override getById to unwrap { data: Project } response.
  async getById(id: number): Promise<Project> {
    const response: AxiosResponse<{ data: Project }> = await apiClient.get(
      `${this.basePath}/${id}`,
    );
    return response.data.data;
  }

  // Override create to unwrap { data: Project } response.
  async create(data: CreateProjectDto): Promise<Project> {
    const response: AxiosResponse<{ data: Project }> = await apiClient.post(
      this.basePath,
      data,
    );
    return response.data.data;
  }

  // Override update to unwrap { data: Project } response.
  async update(id: number, data: UpdateProjectDto): Promise<Project> {
    const response: AxiosResponse<{ data: Project }> = await apiClient.put(
      `${this.basePath}/${id}`,
      data,
    );
    return response.data.data;
  }
}

// Singleton instance.
export const projectsApiService = new ProjectsApiClient();
