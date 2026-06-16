// NotebookLM operations data access via Prisma Client.
// Covers job/job_step listing, the dead-letter queue, and admin audit log
// writes that reuse the global User/AuditLog models.
import { prisma } from '../../database/prisma';
import type { NotebookLmJobStatus, NotebookLmJobType } from '../../models/notebooklm.model';

// Row types mirror the previous mysql2 snake_case response shape so the rest
// of the service / controller layers keep working without changes. Prisma
// returns camelCase fields; the service uses the snake_case keys below.
export interface OperationsJobRow {
  id: number;
  type: NotebookLmJobType;
  status: NotebookLmJobStatus;
  payload: unknown;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OperationsJobStepRow {
  id: number;
  job_id: number;
  step_name: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  progress_pct: number;
  detail: string | null;
  started_at: Date | null;
  finished_at: Date | null;
}

export interface OperationsJobDetail extends OperationsJobRow {
  steps: OperationsJobStepRow[];
}

export interface DeadLetterJobRow {
  id: number;
  original_job_id: number;
  job_type: string;
  payload: unknown;
  failure_reason: string | null;
  note: string | null;
  moved_at: Date;
  updated_at: Date;
}

export interface ListJobsFilters {
  page?: number;
  limit?: number;
  type?: NotebookLmJobType;
  status?: NotebookLmJobStatus;
}

// Map a Prisma job row to the snake_case shape used by the service layer.
function mapJobRow(j: {
  id: number;
  type: string;
  status: string;
  payload: unknown;
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): OperationsJobRow {
  return {
    id: j.id,
    type: j.type as NotebookLmJobType,
    status: j.status as NotebookLmJobStatus,
    payload: j.payload,
    retry_count: j.retryCount,
    max_retries: j.maxRetries,
    error_message: j.errorMessage,
    created_at: j.createdAt,
    updated_at: j.updatedAt,
  };
}

// Map a Prisma job_step row to the snake_case shape.
function mapStepRow(s: {
  id: number;
  jobId: number;
  stepName: string;
  status: string;
  progressPct: number;
  detail: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}): OperationsJobStepRow {
  return {
    id: s.id,
    job_id: s.jobId,
    step_name: s.stepName,
    status: s.status as OperationsJobStepRow['status'],
    progress_pct: s.progressPct,
    detail: s.detail,
    started_at: s.startedAt,
    finished_at: s.finishedAt,
  };
}

// Map a Prisma dead_letter_jobs row to the snake_case shape.
function mapDeadLetterRow(d: {
  id: number;
  originalJobId: number;
  jobType: string;
  payload: unknown;
  failureReason: string | null;
  note: string | null;
  movedAt: Date;
  updatedAt: Date;
}): DeadLetterJobRow {
  return {
    id: d.id,
    original_job_id: d.originalJobId,
    job_type: d.jobType,
    payload: d.payload,
    failure_reason: d.failureReason,
    note: d.note,
    moved_at: d.movedAt,
    updated_at: d.updatedAt,
  };
}

export class NotebookLmOperationsRepository {
  // List jobs, filtered by type/status, paginated by updated_at desc.
  async listJobs(filters: ListJobsFilters): Promise<OperationsJobRow[]> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const rows = await prisma.job.findMany({
      where: {
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });
    return rows.map(mapJobRow);
  }

  // Count jobs matching the same filters as listJobs.
  async countJobs(filters: ListJobsFilters): Promise<number> {
    return prisma.job.count({
      where: {
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
    });
  }

  // Find a single job by id.
  async findJobById(jobId: number): Promise<OperationsJobRow | null> {
    const j = await prisma.job.findUnique({ where: { id: jobId } });
    return j ? mapJobRow(j) : null;
  }

  // Find a job with all of its steps.
  async findJobWithStepsById(jobId: number): Promise<OperationsJobDetail | null> {
    const j = await prisma.job.findUnique({
      where: { id: jobId },
      include: { steps: { orderBy: { id: 'asc' } } },
    });
    if (!j) return null;
    return { ...mapJobRow(j), steps: j.steps.map(mapStepRow) };
  }

  // Retry a job: set status to pending, clear error_message.
  async retryJob(jobId: number): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'pending', errorMessage: null },
    });
  }

  // List all dead-letter rows.
  async listDeadLetterJobs(): Promise<DeadLetterJobRow[]> {
    const rows = await prisma.deadLetterJob.findMany({
      orderBy: [{ movedAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(mapDeadLetterRow);
  }

  // Find a single dead-letter row.
  async findDeadLetterJobById(dlqId: number): Promise<DeadLetterJobRow | null> {
    const d = await prisma.deadLetterJob.findUnique({ where: { id: dlqId } });
    return d ? mapDeadLetterRow(d) : null;
  }

  // Update a dead-letter note.
  async updateDeadLetterJobNote(dlqId: number, note: string): Promise<void> {
    await prisma.deadLetterJob.update({
      where: { id: dlqId },
      data: { note },
    });
  }

  // Purge all dead-letter rows. Returns the count of deleted rows.
  async purgeDeadLetterJobs(): Promise<number> {
    const result = await prisma.deadLetterJob.deleteMany();
    return result.count;
  }

  // Append an admin audit log entry.
  async createAuditLog(
    adminId: number,
    targetUserId: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    detail: Record<string, unknown>,
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        adminId,
        targetUserId,
        action,
        changedFields: detail as any,
      },
    });
  }
}
