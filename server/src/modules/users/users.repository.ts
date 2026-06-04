import { BaseRepository } from '../../database/base.repository';
import { pool } from '../../database/connection';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { User, UserFilters, AuditLogDTO, AuditLog } from '../../models/users.model';

export class UsersRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  // フィルター付きユーザー一覧取得 / Find all users with dynamic filters
  async findAllWithFilters(filters: UserFilters): Promise<{ data: User[]; total: number }> {
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

    const [rows] = await pool.query<User[]>(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.avatar,
              u.last_login_at, u.points, u.note, u.birthday,
              u.created_at, u.updated_at
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
  async findByIdWithoutPassword(id: number): Promise<User | null> {
    const [rows] = await pool.query<User[]>(
      'SELECT id, name, email, role, status, avatar, last_login_at, points, note, birthday, created_at, updated_at FROM `users` WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // メールでユーザー検索 / Find user by email
  async findByEmail(email: string, excludeId?: number): Promise<User | null> {
    const query = excludeId
      ? 'SELECT * FROM `users` WHERE email = ? AND id != ? LIMIT 1'
      : 'SELECT * FROM `users` WHERE email = ? LIMIT 1';
    const params = excludeId ? [email, excludeId] : [email];

    const [rows] = await pool.query<User[]>(query, params);
    return rows[0] || null;
  }

  // 監査ログ作成 / Create audit log entry
  async createAuditLog(entry: AuditLogDTO): Promise<void> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO `audit_logs` (`admin_id`, `target_user_id`, `action`, `changed_fields`) VALUES (?, ?, ?, ?)',
      [entry.admin_id, entry.target_user_id, entry.action, JSON.stringify(entry.changed_fields ?? null)]
    );
  }

  // 監査ログ取得 / Get audit logs for a target user
  async getAuditLogs(targetUserId: number, limit = 20): Promise<AuditLog[]> {
    const [rows] = await pool.query<AuditLog[]>(
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
