// チャットリポジトリ / Chat repository for database access
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../database/connection';
import type { ListSessionsQuery } from './chat.validation';

// チャットセッション行型 / Chat session row type
export interface ChatSessionRow extends RowDataPacket {
  id: number;
  workspace_id: number;
  user_id: number;
  title: string;
  created_at: Date;
  updated_at: Date;
}

// チャットメッセージ行型 / Chat message row type
export interface ChatMessageRow extends RowDataPacket {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  sources: unknown;
  job_id: number | null;
  created_at: Date;
}

// ワークスペースメンバー行型 / Workspace member row type
export interface WorkspaceMemberRow extends RowDataPacket {
  user_id: number;
  workspace_id: number;
  role: string;
}

export class ChatRepository {
  // ワークスペースメンバー確認 / Find workspace member for access control
  async findWorkspaceMember(workspaceId: number, userId: number): Promise<WorkspaceMemberRow | null> {
    const [rows] = await pool.query<WorkspaceMemberRow[]>(
      'SELECT * FROM `workspace_members` WHERE `workspace_id` = ? AND `user_id` = ? LIMIT 1',
      [workspaceId, userId],
    );
    return rows[0] ?? null;
  }

  // セッションID検索 / Find chat session by primary key
  async findSessionById(sessionId: number): Promise<ChatSessionRow | null> {
    const [rows] = await pool.query<ChatSessionRow[]>(
      'SELECT * FROM `chat_sessions` WHERE `id` = ? LIMIT 1',
      [sessionId],
    );
    return rows[0] ?? null;
  }

  // ワークスペースのセッション一覧取得 / List sessions for a workspace with pagination
  async listSessionsForWorkspace(
    workspaceId: number,
    filters: ListSessionsQuery,
  ): Promise<{ data: ChatSessionRow[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<ChatSessionRow[]>(
      'SELECT * FROM `chat_sessions` WHERE `workspace_id` = ? ORDER BY `updated_at` DESC LIMIT ? OFFSET ?',
      [workspaceId, limit, offset],
    );

    const [[{ total }]] = await pool.query<any[]>(
      'SELECT COUNT(*) AS total FROM `chat_sessions` WHERE `workspace_id` = ?',
      [workspaceId],
    );

    return { data: rows, total: Number(total ?? 0) };
  }

  // セッション作成 / Insert new chat session
  async createSession(data: {
    workspace_id: number;
    user_id: number;
    title: string;
  }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO `chat_sessions` (`workspace_id`, `user_id`, `title`) VALUES (?, ?, ?)',
      [data.workspace_id, data.user_id, data.title],
    );
    return result;
  }

  // セッション更新 / Update chat session title
  async updateSession(sessionId: number, data: { title: string }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE `chat_sessions` SET `title` = ? WHERE `id` = ?',
      [data.title, sessionId],
    );
    return result;
  }

  // メッセージ作成 / Insert new chat message
  async createMessage(data: {
    session_id: number;
    role: 'user' | 'assistant';
    content: string;
    job_id?: number | null;
  }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO `chat_messages` (`session_id`, `role`, `content`, `job_id`) VALUES (?, ?, ?, ?)',
      [data.session_id, data.role, data.content, data.job_id ?? null],
    );
    return result;
  }

  // セッションのメッセージ一覧 / List all messages for a session ordered by creation time
  async listMessagesBySession(sessionId: number): Promise<ChatMessageRow[]> {
    const [rows] = await pool.query<ChatMessageRow[]>(
      'SELECT * FROM `chat_messages` WHERE `session_id` = ? ORDER BY `created_at` ASC',
      [sessionId],
    );
    return rows;
  }

  // ジョブ作成 / Insert new job record
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

  // ジョブステップ作成 / Insert a job step record
  async createJobStep(data: {
    job_id: number;
    step_name: string;
    status?: string;
    progress_pct?: number;
    detail?: string | null;
  }): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO \`job_steps\` (\`job_id\`, \`step_name\`, \`status\`, \`progress_pct\`, \`detail\`)
       VALUES (?, ?, ?, ?, ?)`,
      [data.job_id, data.step_name, data.status ?? 'pending', data.progress_pct ?? 0, data.detail ?? null],
    );
    return result;
  }
}
