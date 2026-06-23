// Projects business logic service.
import { ProjectsRepository } from './projects.repository';
import { ServiceError } from '@models/common.model';
import type { CreateProjectInput, UpdateProjectInput } from './projects.validation';

// Re-export ServiceError for controller usage.
export { ServiceError };

// Shape returned to clients: flat project with ownerName.
export interface ProjectResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

// Map a Prisma result row (with nested owner) to the flat response shape.
function toResponse(row: NonNullable<Awaited<ReturnType<ProjectsRepository['findById']>>>): ProjectResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    projectPrompt: row.projectPrompt,
    headline: row.headline,
    caption: row.caption,
    subtext: row.subtext,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ProjectsService {
  private repository: ProjectsRepository;

  constructor(repository?: ProjectsRepository) {
    this.repository = repository || new ProjectsRepository();
  }

  // List all non-deleted projects.
  async getProjects(): Promise<ProjectResponse[]> {
    const rows = await this.repository.findAll();
    return rows.map(toResponse);
  }

  // Get a single project by id, or throw 404.
  async getProject(id: number): Promise<ProjectResponse> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new ServiceError('Project not found', 404);
    }
    return toResponse(row);
  }

  // Create a new project.
  async createProject(data: CreateProjectInput, ownerId: number): Promise<ProjectResponse> {
    const row = await this.repository.create({
      name: data.name,
      description: data.description ?? null,
      projectPrompt: data.projectPrompt ?? null,
      headline: null,
      caption: null,
      subtext: null,
      owner: { connect: { id: ownerId } },
    });
    // Re-fetch to include owner name.
    return this.getProject(row.id);
  }

  // Update an existing project, or throw 404.
  async updateProject(id: number, data: UpdateProjectInput): Promise<ProjectResponse> {
    // Verify existence first.
    await this.getProject(id);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.projectPrompt !== undefined) updateData.projectPrompt = data.projectPrompt;

    await this.repository.update(id, updateData);
    return this.getProject(id);
  }

  // Soft delete a project, or throw 404.
  async deleteProject(id: number): Promise<void> {
    await this.getProject(id);
    await this.repository.softDelete(id);
  }
}
