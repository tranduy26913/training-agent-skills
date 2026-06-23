// Projects controller — request/response handlers.
import { Response } from 'express';
import { ProjectsService } from './projects.service';
import { sendSuccess } from '@utils/response.util';
import { getAuthUserId } from '@utils/auth.util';
import type { AuthenticatedRequest } from '@types-express';

const projectsService = new ProjectsService();

export class ProjectsController {
  // Get list of all non-deleted projects.
  async getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await projectsService.getProjects();
    sendSuccess(res, { data: result });
  }

  // Get a single project by ID.
  async getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const project = await projectsService.getProject(id);
    sendSuccess(res, { data: project });
  }

  // Create a new project.
  async createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const ownerId = getAuthUserId(req);
    if (ownerId === null) {
      sendSuccess(res, { message: 'Not authenticated' });
      return;
    }
    const project = await projectsService.createProject(req.body, ownerId);
    sendSuccess(res, { data: project }, 201);
  }

  // Update an existing project.
  async updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const project = await projectsService.updateProject(id, req.body);
    sendSuccess(res, { data: project });
  }

  // Soft delete a project.
  async deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);
    await projectsService.deleteProject(id);
    sendSuccess(res, { message: 'Project deleted successfully' });
  }
}
