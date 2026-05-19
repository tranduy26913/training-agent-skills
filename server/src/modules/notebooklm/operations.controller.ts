import { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/express.d';
import { handleError, sendSuccess } from '../../utils/response.util';
import { NotebookLmOperationsService } from './operations.service';

export class NotebookLmOperationsController {
  private readonly service: NotebookLmOperationsService;

  constructor(service?: NotebookLmOperationsService) {
    this.service = service ?? new NotebookLmOperationsService();
  }

  async listJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.listJobs(req.user!, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        type: req.query.type as 'INGEST' | 'QUERY' | 'DELETE_DOC' | 'DELETE_WORKSPACE' | undefined,
        status: req.query.status as
          | 'pending'
          | 'processing'
          | 'retrying'
          | 'done'
          | 'failed'
          | 'dead_letter'
          | undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getJobDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const detail = await this.service.getJobDetail(req.user!, Number(req.params.id));
      sendSuccess(res, detail);
    } catch (error) {
      handleError(res, error);
    }
  }

  async retryJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const detail = await this.service.retryJob(req.user!, Number(req.params.id), req.body.reason);
      sendSuccess(res, detail);
    } catch (error) {
      handleError(res, error);
    }
  }

  async listDeadLetterJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.listDeadLetterJobs(req.user!);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getDeadLetterJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.getDeadLetterJob(req.user!, Number(req.params.id));
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateDeadLetterJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.updateDeadLetterJobNote(req.user!, Number(req.params.id), req.body.note);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  async purgeDeadLetterJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.purgeDeadLetterJobs(req.user!, req.body.reason);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }
}