import { Response } from 'express';
import { getAuthUserId } from '@utils/auth.util';
import { sendError, sendSuccess } from '@utils/response.util';
import type { AuthenticatedRequest } from '@types-express';
import { VocabulariesService } from './vocabularies.service';

const vocabulariesService = new VocabulariesService();

function getQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export class VocabulariesController {
  async getVocabularies(req: AuthenticatedRequest, res: Response): Promise<void> {
    const vocabularies = await vocabulariesService.getVocabularies({
      search: getQueryValue(req.query.search),
      level: getQueryValue(req.query.level),
      status: getQueryValue(req.query.status),
    });
    sendSuccess(res, { data: vocabularies });
  }

  async getVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const vocabulary = await vocabulariesService.getVocabulary(id);
    sendSuccess(res, { data: vocabulary });
  }

  async createVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const adminId = getAuthUserId(req);
    if (adminId === null) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    const vocabulary = await vocabulariesService.createVocabulary(req.body, adminId);
    sendSuccess(res, { data: vocabulary }, 201);
  }

  async updateVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const adminId = getAuthUserId(req);
    if (adminId === null) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    const id = Number(req.params.id);
    const vocabulary = await vocabulariesService.updateVocabulary(id, req.body, adminId);
    sendSuccess(res, { data: vocabulary });
  }

  async deleteVocabulary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const adminId = getAuthUserId(req);
    if (adminId === null) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    const id = Number(req.params.id);
    await vocabulariesService.deleteVocabulary(id, adminId);
    sendSuccess(res, { message: 'Vocabulary deleted successfully' });
  }
}
