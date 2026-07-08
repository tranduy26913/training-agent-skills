import { Response } from 'express';
import { getAuthUserId } from '@utils/auth.util';
import { sendSuccess } from '@utils/response.util';
import type { AuthenticatedRequest } from '@types-express';
import { ScriptsService } from './scripts.service';

const scriptsService = new ScriptsService();

export class ScriptsController {
  async getScripts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const projectId = Number(req.query.projectId);
    const scripts = await scriptsService.getScripts(projectId);
    sendSuccess(res, { data: scripts });
  }

  async getScript(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const script = await scriptsService.getScript(id);
    sendSuccess(res, { data: script });
  }

  async createScript(req: AuthenticatedRequest, res: Response): Promise<void> {
    const ownerId = getAuthUserId(req);
    if (ownerId === null) {
      sendSuccess(res, { message: 'Not authenticated' }, 401);
      return;
    }
    const script = await scriptsService.createScript(req.body, ownerId);
    sendSuccess(res, { data: script }, 201);
  }

  async updateScript(req: AuthenticatedRequest, res: Response): Promise<void> {
    const adminId = getAuthUserId(req);
    if (adminId === null) {
      sendSuccess(res, { message: 'Not authenticated' }, 401);
      return;
    }
    const id = Number(req.params.id);
    const script = await scriptsService.updateScript(id, req.body, adminId);
    sendSuccess(res, { data: script });
  }

  async deleteScript(req: AuthenticatedRequest, res: Response): Promise<void> {
    const adminId = getAuthUserId(req);
    if (adminId === null) {
      sendSuccess(res, { message: 'Not authenticated' }, 401);
      return;
    }
    const id = Number(req.params.id);
    await scriptsService.deleteScript(id, adminId);
    sendSuccess(res, { message: 'Script deleted successfully' });
  }

  async generateScript(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await scriptsService.generateScript(req.body);
    sendSuccess(res, { data: result });
  }

  async getAiModels(_req: AuthenticatedRequest, res: Response): Promise<void> {
    sendSuccess(res, { data: scriptsService.getAiModels() });
  }
}
