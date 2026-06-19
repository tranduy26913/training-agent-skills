import { ServiceError } from '@models/common.model';
import type { JwtPayload } from '@types-express';
import {
  NotebookLmOperationsRepository,
  type ListJobsFilters,
  type OperationsJobDetail,
  type OperationsJobRow,
  type DeadLetterJobRow,
} from './operations.repository';

interface ListJobsResult {
  data: OperationsJobRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface PurgeDlqResult {
  deletedCount: number;
  message: string;
}

export class NotebookLmOperationsService {
  private readonly repository: NotebookLmOperationsRepository;

  constructor(repository?: NotebookLmOperationsRepository) {
    this.repository = repository ?? new NotebookLmOperationsRepository();
  }

  private ensureAdmin(actor: JwtPayload): void {
    if (actor.role !== 'admin') {
      throw new ServiceError('Insufficient permissions', 403);
    }
  }

  async listJobs(actor: JwtPayload, filters: ListJobsFilters): Promise<ListJobsResult> {
    this.ensureAdmin(actor);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const [data, total] = await Promise.all([
      this.repository.listJobs({ ...filters, page, limit }),
      this.repository.countJobs(filters),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getJobDetail(actor: JwtPayload, jobId: number): Promise<OperationsJobDetail> {
    this.ensureAdmin(actor);

    const detail = await this.repository.findJobWithStepsById(jobId);
    if (!detail) {
      throw new ServiceError('Job not found', 404);
    }

    return detail;
  }

  async retryJob(actor: JwtPayload, jobId: number, reason: string): Promise<OperationsJobDetail> {
    this.ensureAdmin(actor);

    const job = await this.repository.findJobById(jobId);
    if (!job) {
      throw new ServiceError('Job not found', 404);
    }

    if (job.status !== 'failed' && job.status !== 'dead_letter') {
      throw new ServiceError('Only failed or dead_letter jobs can be retried', 400);
    }

    await this.repository.retryJob(jobId);
    await this.repository.createAuditLog(actor.userId, actor.userId, 'UPDATE', {
      operation: 'NOTEBOOKLM_JOB_RETRY',
      jobId,
      previousStatus: job.status,
      nextStatus: 'pending',
      reason,
    });

    const detail = await this.repository.findJobWithStepsById(jobId);
    if (!detail) {
      throw new ServiceError('Job not found', 404);
    }

    return detail;
  }

  async listDeadLetterJobs(actor: JwtPayload): Promise<DeadLetterJobRow[]> {
    this.ensureAdmin(actor);
    return this.repository.listDeadLetterJobs();
  }

  async getDeadLetterJob(actor: JwtPayload, dlqId: number): Promise<DeadLetterJobRow> {
    this.ensureAdmin(actor);

    const item = await this.repository.findDeadLetterJobById(dlqId);
    if (!item) {
      throw new ServiceError('Dead-letter item not found', 404);
    }

    return item;
  }

  async updateDeadLetterJobNote(actor: JwtPayload, dlqId: number, note: string): Promise<DeadLetterJobRow> {
    this.ensureAdmin(actor);

    const existingItem = await this.repository.findDeadLetterJobById(dlqId);
    if (!existingItem) {
      throw new ServiceError('Dead-letter item not found', 404);
    }

    await this.repository.updateDeadLetterJobNote(dlqId, note);
    await this.repository.createAuditLog(actor.userId, actor.userId, 'UPDATE', {
      operation: 'NOTEBOOKLM_DLQ_NOTE_UPDATE',
      deadLetterJobId: dlqId,
    });

    const updatedItem = await this.repository.findDeadLetterJobById(dlqId);
    if (!updatedItem) {
      throw new ServiceError('Dead-letter item not found', 404);
    }

    return updatedItem;
  }

  async purgeDeadLetterJobs(actor: JwtPayload, reason: string): Promise<PurgeDlqResult> {
    this.ensureAdmin(actor);

    const deletedCount = await this.repository.purgeDeadLetterJobs();
    await this.repository.createAuditLog(actor.userId, actor.userId, 'DELETE', {
      operation: 'NOTEBOOKLM_DLQ_PURGE',
      deletedCount,
      reason,
    });

    return {
      deletedCount,
      message: 'Deleted successfully',
    };
  }
}