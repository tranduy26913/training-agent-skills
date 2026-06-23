// Projects module type definitions.

// Project data type returned by the API.
export interface Project {
  id: number;
  name: string;
  description: string | null;
  projectPrompt: string | null;
  headline: string | null;
  caption: string | null;
  subtext: string | null;
  ownerId: number;
  ownerName: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create project DTO.
export interface CreateProjectDto {
  name: string;
  description?: string;
  projectPrompt?: string;
}

// Update project DTO (all fields optional).
export type UpdateProjectDto = CreateProjectDto;
