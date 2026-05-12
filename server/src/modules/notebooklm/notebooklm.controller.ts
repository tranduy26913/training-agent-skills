import { Response } from 'express';
import { NotebookLmService } from './notebooklm.service';
import { handleError, sendSuccess } from '../../utils/response.util';
import type { AuthenticatedRequest } from '../../types/express.d';

export class NotebookLmController {
  private readonly service: NotebookLmService;

  constructor(service?: NotebookLmService) {
    this.service = service ?? new NotebookLmService();
  }

  async listWorkspaces(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.listWorkspaces(req.user!.userId, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string | undefined,
        role: req.query.role as 'owner' | 'editor' | 'viewer' | undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  async createWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspace = await this.service.createWorkspace(req.body, req.user!.userId);
      sendSuccess(res, workspace, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.searchUsers(
        {
          q: String(req.query.q ?? ''),
          page: req.query.page ? Number(req.query.page) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        },
        req.user!.userId,
      );
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspace = await this.service.getWorkspace(Number(req.params.id), req.user!.userId);
      sendSuccess(res, workspace);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspace = await this.service.updateWorkspace(Number(req.params.id), req.body, req.user!.userId);
      sendSuccess(res, workspace);
    } catch (error) {
      handleError(res, error);
    }
  }

  async deleteWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.deleteWorkspace(Number(req.params.id), req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  async listMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const members = await this.service.listMembers(Number(req.params.id), req.user!.userId);
      sendSuccess(res, members);
    } catch (error) {
      handleError(res, error);
    }
  }

  async addMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const members = await this.service.addMember(Number(req.params.id), req.body, req.user!.userId);
      sendSuccess(res, members);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const members = await this.service.updateMemberRole(
        Number(req.params.id),
        Number(req.params.userId),
        req.body.role,
        req.user!.userId,
      );
      sendSuccess(res, members);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await this.service.removeMember(Number(req.params.id), Number(req.params.userId), req.user!.userId);
      sendSuccess(res, { message: 'Member removed successfully' });
    } catch (error) {
      handleError(res, error);
    }
  }

  async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { filename, mimeType, fileSize, fileDataBase64 } = req.body;
      const result = await this.service.enqueueDocumentIngestion(
        Number(req.params.id),
        {
          filename,
          mimeType,
          fileSize,
          fileData: Buffer.from(fileDataBase64, 'base64'),
        },
        req.user!.userId,
      );
      sendSuccess(res, result, 202);
    } catch (error) {
      handleError(res, error);
    }
  }

  async listDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const documents = await this.service.listDocuments(Number(req.params.id), req.user!.userId);
      sendSuccess(res, documents);
    } catch (error) {
      handleError(res, error);
    }
  }

  async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.enqueueDocumentDeletion(
        Number(req.params.id),
        Number(req.params.docId),
        req.user!.userId,
      );
      sendSuccess(res, result, 202);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * ドキュメントをダウンロードする / Download a document file
   */
  async downloadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { filename, mimeType, fileData } = await this.service.downloadDocument(
        Number(req.params.id),
        Number(req.params.docId),
        req.user!.userId,
      );
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(fileData);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getJobStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const job = await this.service.getJobStatus(Number(req.params.jobId), req.user!.userId);
      sendSuccess(res, job);
    } catch (error) {
      handleError(res, error);
    }
  }
}
