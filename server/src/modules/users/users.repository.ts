import { BaseRepository } from '../../database/base.repository';
import { pool } from '../../database/connection';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// ユーザーデータ型 / User data type
export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  avatar: string | null;
  created_at: Date;
  updated_at: Date;
}

// フィルター型 / Filter parameters type
export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 監査ログ型 / Audit log entry type
export interface AuditLogEntry {
  admin_id: number;
  target_user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_fields?: Record<string, { old: unknown; new: unknown }> | null;
}

// 監査ログ行型 / Audit log row type
export interface AuditLogRow extends RowDataPacket {
  id: number;
  admin_id: number;
  target_user_id: number;
  action: string;
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  timestamp: Date;
  admin_name: string;
}

export class UsersRepository extends BaseRepository<UserRow> {
  constructor() {
    super('users');
  }

  // フィルター付きユーザー一覧取得 / Find all users with dynamic filters
  async findAllWithFilters(filters: UserFilters): Promise<{ data: UserRow[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.role) {
      conditions.push('u.role = ?');
      params.push(filters.role);
    }

    if (filters.status) {
      conditions.push('u.status = ?');
      params.push(filters.status);
    }

    if (filters.startDate) {
      conditions.push('u.created_at >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('u.created_at <= ?');
      params.push(filters.endDate);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // ソート列のホワイトリスト / Whitelist allowed sort columns to prevent SQL injection
    const ALLOWED_SORT_FIELDS: Record<string, string> = {
      id: 'u.id',
      name: 'u.name',
      email: 'u.email',
      role: 'u.role',
      status: 'u.status',
      created_at: 'u.created_at',
      updated_at: 'u.updated_at',
    };
    const sortColumn = ALLOWED_SORT_FIELDS[filters.sortBy || ''] || 'u.created_at';
    const sortDir = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const [rows] = await pool.query<UserRow[]>(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.avatar, u.created_at, u.updated_at
       FROM \`users\` u ${whereClause} ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM \`users\` u ${whereClause}`,
      params
    );

    return { data: rows, total };
  }

  // IDでユーザー取得（パスワード除外） / Find user by ID excluding password
  async findByIdWithoutPassword(id: number): Promise<UserRow | null> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, name, email, role, status, avatar, created_at, updated_at FROM `users` WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // メールでユーザー検索 / Find user by email
  async findByEmail(email: string, excludeId?: number): Promise<UserRow | null> {
    const query = excludeId
      ? 'SELECT * FROM `users` WHERE email = ? AND id != ? LIMIT 1'
      : 'SELECT * FROM `users` WHERE email = ? LIMIT 1';
    const params = excludeId ? [email, excludeId] : [email];

    const [rows] = await pool.query<UserRow[]>(query, params);
    return rows[0] || null;
  }

  // 監査ログ作成 / Create audit log entry
  async createAuditLog(entry: AuditLogEntry): Promise<void> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO `audit_logs` (`admin_id`, `target_user_id`, `action`, `changed_fields`) VALUES (?, ?, ?, ?)',
      [entry.admin_id, entry.target_user_id, entry.action, JSON.stringify(entry.changed_fields ?? null)]
    );
  }

  // 監査ログ取得 / Get audit logs for a target user
  async getAuditLogs(targetUserId: number, limit = 20): Promise<AuditLogRow[]> {
    const [rows] = await pool.query<AuditLogRow[]>(
      `SELECT al.*, u.name as admin_name
       FROM \`audit_logs\` al
       JOIN \`users\` u ON al.admin_id = u.id
       WHERE al.target_user_id = ?
       ORDER BY al.timestamp DESC
       LIMIT ?`,
      [targetUserId, limit]
    );
    return rows;
  }
}
