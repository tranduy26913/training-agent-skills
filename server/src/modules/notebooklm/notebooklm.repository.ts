import type { ResultSetHeader } from 'mysql2/promise';
import { pool } from '../../database/connection';
import type {
  CreateNotebookLmWorkspaceInput,
  NotebookLmDocumentRow,
  NotebookLmJobDetails,
  NotebookLmJobRow,
  NotebookLmJobStepRow,
  NotebookLmWorkspaceFilters,
  NotebookLmWorkspaceMemberRow,
  NotebookLmWorkspaceRow,
  UpdateNotebookLmWorkspaceInput,
} from '../../models/notebooklm.model';

export class NotebookLmRepository {
  async listWorkspacesForUser(
    userId: number,
    filters: NotebookLmWorkspaceFilters,
  ): Promise<{ data: NotebookLmWorkspaceRow[]; total: number }> {
    const conditions: string[] = ['wm.user_id = ?'];
    const params: unknown[] = [userId];

    if (filters.search) {
      conditions.push('w.name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (filters.role) {
      conditions.push('wm.role = ?');
      params.push(filters.role);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<NotebookLmWorkspaceRow[]>(
      `SELECT w.*, wm.role,
              COALESCE(COUNT(d.id), 0) AS document_count
       FROM \`workspaces\` w
       INNER JOIN \`workspace_members\` wm ON wm.workspace_id = w.id
       LEFT JOIN \`documents\` d ON d.workspace_id = w.id AND d.status != 'deleted'
       ${whereClause}
       GROUP BY w.id, wm.role
       ORDER BY w.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [[{ total }]] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total
       FROM \`workspaces\` w
       INNER JOIN \`workspace_members\` wm ON wm.workspace_id = w.id
       ${whereClause}`,
      params,
    );

    return { data: rows, total: Number(total ?? 0) };
  }

  async findWorkspaceByIdForUser(workspaceId: number, userId: number): Promise<NotebookLmWorkspaceRow | null> {
    const [rows] = await pool.query<NotebookLmWorkspaceRow[]>(
      `SELECT w.*, wm.role,
              COALESCE(COUNT(d.id), 0) AS document_count
       FROM \`workspaces\` w
       INNER JOIN \`workspace_members\` wm ON wm.workspace_id = w.id AND wm.user_id = ?
       LEFT JOIN \`documents\` d ON d.workspace_id = w.id AND d.status != 'deleted'
       WHERE w.id = ?
       GROUP BY w.id, wm.role
       LIMIT 1`,
      [userId, workspaceId],
    );
    return rows[0] ?? null;
  }

  async findWorkspaceById(workspaceId: number): Promise<NotebookLmWorkspaceRow | null> {
    const [rows] = await pool.query<NotebookLmWorkspaceRow[]>(
      'SELECT * FROM `workspaces` WHERE id = ? LIMIT 1',
      [workspaceId],
    );
    return rows[0] ?? null;
  }

  async findWorkspaceByNameForOwner(
    name: string,
    ownerId: number,
    excludeWorkspaceId?: number,
  ): Promise<NotebookLmWorkspaceRow | null> {
    const query = excludeWorkspaceId
      ? 'SELECT * FROM `workspaces` WHERE name = ? AND owner_id = ? AND id != ? LIMIT 1'
      : 'SELECT * FROM `workspaces` WHERE name = ? AND owner_id = ? LIMIT 1';
    const params = excludeWorkspaceId ? [name, ownerId, excludeWorkspaceId] : [name, ownerId];

    const [rows] = await pool.query<NotebookLmWorkspaceRow[]>(query, params);
    return rows[0] ?? null;
  }

  async createWorkspace(data: CreateNotebookLmWorkspaceInput & { owner_id: number }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO `workspaces` (`name`, `description`, `owner_id`) VALUES (?, ?, ?)',
      [data.name, data.description ?? null, data.owner_id],
    );
    return result;
  }

  async updateWorkspace(workspaceId: number, data: UpdateNotebookLmWorkspaceInput): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE `workspaces` SET `name` = ?, `description` = ? WHERE `id` = ?',
      [data.name, data.description ?? null, workspaceId],
    );
    return result;
  }

  async deleteWorkspace(workspaceId: number): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM `workspaces` WHERE `id` = ?',
      [workspaceId],
    );
    return result;
  }

  async createWorkspaceMember(data: {
    workspace_id: number;
    user_id: number;
    role: string;
  }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO `workspace_members` (`workspace_id`, `user_id`, `role`) VALUES (?, ?, ?)',
      [data.workspace_id, data.user_id, data.role],
    );
    return result;
  }

  async findMemberByWorkspaceAndUser(
    workspaceId: number,
    userId: number,
  ): Promise<NotebookLmWorkspaceMemberRow | null> {
    const [rows] = await pool.query<NotebookLmWorkspaceMemberRow[]>(
      'SELECT * FROM `workspace_members` WHERE `workspace_id` = ? AND `user_id` = ? LIMIT 1',
      [workspaceId, userId],
    );
    return rows[0] ?? null;
  }

  async listMembersByWorkspace(workspaceId: number): Promise<NotebookLmWorkspaceMemberRow[]> {
    const [rows] = await pool.query<NotebookLmWorkspaceMemberRow[]>(
      `SELECT wm.*, u.name AS user_name, u.email AS user_email
       FROM \`workspace_members\` wm
       INNER JOIN \`users\` u ON u.id = wm.user_id
       WHERE wm.workspace_id = ?
       ORDER BY FIELD(wm.role, 'owner', 'editor', 'viewer'), wm.id ASC`,
      [workspaceId],
    );
    return rows;
  }

  async updateMemberRole(workspaceId: number, userId: number, role: string): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE `workspace_members` SET `role` = ? WHERE `workspace_id` = ? AND `user_id` = ?',
      [role, workspaceId, userId],
    );
    return result;
  }

  async removeMember(workspaceId: number, userId: number): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM `workspace_members` WHERE `workspace_id` = ? AND `user_id` = ?',
      [workspaceId, userId],
    );
    return result;
  }

  async createDocument(data: {
    workspace_id: number;
    uploaded_by: number;
    filename: string;
    mime_type: string;
    file_size: number;
    file_data: Buffer;
    status: string;
  }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO \`documents\` (
        \`workspace_id\`, \`uploaded_by\`, \`filename\`, \`mime_type\`, \`file_size\`, \`file_data\`, \`status\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.workspace_id,
        data.uploaded_by,
        data.filename,
        data.mime_type,
        data.file_size,
        data.file_data,
        data.status,
      ],
    );
    return result;
  }

  async findDocumentByIdForWorkspace(documentId: number, workspaceId: number): Promise<NotebookLmDocumentRow | null> {
    const [rows] = await pool.query<NotebookLmDocumentRow[]>(
      'SELECT * FROM `documents` WHERE `id` = ? AND `workspace_id` = ? LIMIT 1',
      [documentId, workspaceId],
    );
    return rows[0] ?? null;
  }

  async listDocumentsByWorkspace(workspaceId: number): Promise<Array<NotebookLmDocumentRow & { latest_job_id: number | null }>> {
    const [rows] = await pool.query<Array<NotebookLmDocumentRow & { latest_job_id: number | null }>>(
      `SELECT d.id, d.workspace_id, d.uploaded_by, d.filename, d.mime_type, d.file_size,
              d.status, d.created_at, d.updated_at, (
         SELECT j.id
         FROM \`jobs\` j
         WHERE CAST(
           JSON_UNQUOTE(
             COALESCE(
               JSON_EXTRACT(j.payload, '$.documentId'),
               JSON_EXTRACT(j.payload, '$.document_id')
             )
           ) AS UNSIGNED
         ) = d.id
         ORDER BY j.id DESC
         LIMIT 1
       ) AS latest_job_id
       FROM \`documents\` d
       WHERE d.workspace_id = ?
       ORDER BY d.updated_at DESC`,
      [workspaceId],
    );
    return rows;
  }

  async createJob(data: {
    type: string;
    status: string;
    payload: Record<string, unknown>;
    max_retries?: number;
  }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO `jobs` (`type`, `status`, `payload`, `max_retries`) VALUES (?, ?, ?, ?)',
      [data.type, data.status, JSON.stringify(data.payload), data.max_retries ?? 3],
    );
    return result;
  }

  async createJobStep(data: {
    job_id: number;
    step_name: string;
    status?: string;
    progress_pct?: number;
    detail?: string | null;
  }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO \`job_steps\` (
        \`job_id\`, \`step_name\`, \`status\`, \`progress_pct\`, \`detail\`
      ) VALUES (?, ?, ?, ?, ?)`,
      [data.job_id, data.step_name, data.status ?? 'pending', data.progress_pct ?? 0, data.detail ?? null],
    );
    return result;
  }

  async findJobWithStepsByIdForUser(jobId: number, userId: number): Promise<NotebookLmJobDetails | null> {
    const [jobRows] = await pool.query<NotebookLmJobRow[]>(
      `SELECT j.*
       FROM \`jobs\` j
       INNER JOIN \`workspace_members\` wm
         ON wm.workspace_id = CAST(
           JSON_UNQUOTE(
             COALESCE(
               JSON_EXTRACT(j.payload, '$.workspaceId'),
               JSON_EXTRACT(j.payload, '$.workspace_id')
             )
           ) AS UNSIGNED
         )
       WHERE j.id = ? AND wm.user_id = ?
       LIMIT 1`,
      [jobId, userId],
    );

    const job = jobRows[0];
    if (!job) {
      return null;
    }

    const [steps] = await pool.query<NotebookLmJobStepRow[]>(
      'SELECT * FROM `job_steps` WHERE `job_id` = ? ORDER BY `id` ASC',
      [jobId],
    );

    const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
    return {
      ...job,
      payload,
      steps,
    };
  }
}
