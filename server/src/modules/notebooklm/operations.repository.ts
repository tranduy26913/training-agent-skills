import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../database/connection';
import type { NotebookLmJobStatus, NotebookLmJobType } from '../../models/notebooklm.model';

export interface OperationsJobRow extends RowDataPacket {
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

export interface OperationsJobStepRow extends RowDataPacket {
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

export interface DeadLetterJobRow extends RowDataPacket {
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

export class NotebookLmOperationsRepository {
  async listJobs(filters: ListJobsFilters): Promise<OperationsJobRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<OperationsJobRow[]>(
      `SELECT * FROM \`jobs\`
       ${whereClause}
       ORDER BY \`updated_at\` DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return rows;
  }

  async countJobs(filters: ListJobsFilters): Promise<number> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM \`jobs\` ${whereClause}`,
      params,
    );

    return Number(rows[0]?.total ?? 0);
  }

  async findJobById(jobId: number): Promise<OperationsJobRow | null> {
    const [rows] = await pool.query<OperationsJobRow[]>('SELECT * FROM `jobs` WHERE `id` = ? LIMIT 1', [jobId]);
    return rows[0] ?? null;
  }

  async findJobWithStepsById(jobId: number): Promise<OperationsJobDetail | null> {
    const job = await this.findJobById(jobId);
    if (!job) {
      return null;
    }

    const [steps] = await pool.query<OperationsJobStepRow[]>(
      `SELECT * FROM \`job_steps\`
       WHERE \`job_id\` = ?
       ORDER BY \`id\` ASC`,
      [jobId],
    );

    return {
      ...job,
      steps,
    };
  }

  async retryJob(jobId: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE \`jobs\`
       SET \`status\` = 'pending',
           \`error_message\` = NULL,
           \`updated_at\` = CURRENT_TIMESTAMP
       WHERE \`id\` = ?`,
      [jobId],
    );
  }

  async listDeadLetterJobs(): Promise<DeadLetterJobRow[]> {
    const [rows] = await pool.query<DeadLetterJobRow[]>(
      `SELECT * FROM \`dead_letter_jobs\`
       ORDER BY \`moved_at\` DESC, \`id\` DESC`,
    );

    return rows;
  }

  async findDeadLetterJobById(dlqId: number): Promise<DeadLetterJobRow | null> {
    const [rows] = await pool.query<DeadLetterJobRow[]>(
      'SELECT * FROM `dead_letter_jobs` WHERE `id` = ? LIMIT 1',
      [dlqId],
    );
    return rows[0] ?? null;
  }

  async updateDeadLetterJobNote(dlqId: number, note: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE `dead_letter_jobs` SET `note` = ?, `updated_at` = CURRENT_TIMESTAMP WHERE `id` = ?',
      [note, dlqId],
    );
  }

  async purgeDeadLetterJobs(): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM `dead_letter_jobs`');
    return Number(result.affectedRows ?? 0);
  }

  async createAuditLog(
    adminId: number,
    targetUserId: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    detail: Record<string, unknown>,
  ): Promise<void> {
    await pool.query<ResultSetHeader>(
      `INSERT INTO \`audit_logs\` (
         \`admin_id\`,
         \`target_user_id\`,
         \`action\`,
         \`changed_fields\`
       ) VALUES (?, ?, ?, ?)`,
      [adminId, targetUserId, action, JSON.stringify(detail)],
    );
  }
}