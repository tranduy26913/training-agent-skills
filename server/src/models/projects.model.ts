// Projects module request/response models.
// Project management for AI Content Generation.

// Application-side Project type: Prisma-generated row.
export type Project = import('@prisma/client').Project;

// DTO for creating a new project.
export interface CreateProjectDto {
  name: string;
  description?: string;
  projectPrompt?: string;
}

// DTO for updating an existing project (all fields optional).
export interface UpdateProjectDto {
  name?: string;
  description?: string;
  projectPrompt?: string;
}
