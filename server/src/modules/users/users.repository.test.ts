import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersRepository } from './users.repository';
import type { UserFilters } from '../../models/users.model';

// DB接続モック / Mock database connection
vi.mock('../../database/connection', () => {
  const mockPool = {
    query: vi.fn(),
  };
  return { pool: mockPool };
});

import { pool } from '../../database/connection';

const mockPool = pool as unknown as { query: ReturnType<typeof vi.fn> };

describe('UsersRepository', () => {
  let repository: UsersRepository;

  beforeEach(() => {
    repository = new UsersRepository();
    vi.clearAllMocks();
  });

  describe('findAllWithFilters', () => {
    it('builds query with search filter', async () => {
      // フィルター付きSQLを構築する / Builds correct SQL with search filter
      mockPool.query
        .mockResolvedValueOnce([[{ id: 1, name: 'John', email: 'john@test.com' }]])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const filters: UserFilters = { search: 'john' };
      const result = await repository.findAllWithFilters(filters);

      expect(mockPool.query).toHaveBeenCalledTimes(2);

      const firstCall = mockPool.query.mock.calls[0];
      expect(firstCall[0]).toContain('(u.name LIKE ? OR u.email LIKE ?)');
      expect(firstCall[1]).toContain('%john%');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('builds query with role and status filters', async () => {
      // ロールとステータスフィルターでSQLを構築する / Builds SQL with role and status
      mockPool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: 0 }]]);

      const filters: UserFilters = { role: 'admin', status: 'active' };
      await repository.findAllWithFilters(filters);

      const firstCall = mockPool.query.mock.calls[0];
      expect(firstCall[0]).toContain('u.role = ?');
      expect(firstCall[0]).toContain('u.status = ?');
      expect(firstCall[1]).toContain('admin');
      expect(firstCall[1]).toContain('active');
    });

    it('builds query with date range filters', async () => {
      // 日付範囲フィルターでSQLを構築する / Builds SQL with date range
      mockPool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: 0 }]]);

      const filters: UserFilters = { startDate: '2026-01-01', endDate: '2026-12-31' };
      await repository.findAllWithFilters(filters);

      const firstCall = mockPool.query.mock.calls[0];
      expect(firstCall[0]).toContain('u.created_at >= ?');
      expect(firstCall[0]).toContain('u.created_at <= ?');
    });

    it('returns all users when no filters provided', async () => {
      // フィルターなしで全ユーザーを返す / Returns all users without filters
      mockPool.query
        .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]])
        .mockResolvedValueOnce([[{ total: 2 }]]);

      const result = await repository.findAllWithFilters({});

      const firstCall = mockPool.query.mock.calls[0];
      expect(firstCall[0]).not.toContain('WHERE');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('applies pagination with default values', async () => {
      // デフォルトページネーションを適用する / Applies default pagination
      mockPool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: 0 }]]);

      await repository.findAllWithFilters({});

      const firstCall = mockPool.query.mock.calls[0];
      expect(firstCall[0]).toContain('LIMIT ? OFFSET ?');
      // デフォルト: limit=20, offset=0
      expect(firstCall[1]).toContain(20);
      expect(firstCall[1]).toContain(0);
    });
  });

  describe('findByIdWithoutPassword', () => {
    it('returns user without password field', async () => {
      // パスワードなしでユーザーを返す / Returns user excluding password
      mockPool.query.mockResolvedValueOnce([[{ id: 1, name: 'John', email: 'john@test.com' }]]);

      const user = await repository.findByIdWithoutPassword(1);

      expect(user).toEqual({ id: 1, name: 'John', email: 'john@test.com' });
      expect(mockPool.query.mock.calls[0][0]).not.toContain('password');
    });

    it('returns null when user not found', async () => {
      // ユーザーが見つからない場合nullを返す / Returns null when not found
      mockPool.query.mockResolvedValueOnce([[]]);

      const user = await repository.findByIdWithoutPassword(999);

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('finds user by email', async () => {
      // メールでユーザーを検索する / Finds user by email
      mockPool.query.mockResolvedValueOnce([[{ id: 1, email: 'john@test.com' }]]);

      const user = await repository.findByEmail('john@test.com');

      expect(user).toBeDefined();
      expect(mockPool.query.mock.calls[0][1]).toEqual(['john@test.com']);
    });

    it('excludes specific user ID when provided', async () => {
      // 指定IDを除外して検索する / Excludes specific ID
      mockPool.query.mockResolvedValueOnce([[]]);

      await repository.findByEmail('john@test.com', 5);

      expect(mockPool.query.mock.calls[0][0]).toContain('id != ?');
      expect(mockPool.query.mock.calls[0][1]).toEqual(['john@test.com', 5]);
    });
  });

  describe('createAuditLog', () => {
    it('inserts audit log entry', async () => {
      // 監査ログを挿入する / Inserts audit log
      mockPool.query.mockResolvedValueOnce([{ insertId: 1 }]);

      await repository.createAuditLog({
        admin_id: 1,
        target_user_id: 2,
        action: 'CREATE',
        changed_fields: null,
      });

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query.mock.calls[0][0]).toContain('INSERT INTO `audit_logs`');
      expect(mockPool.query.mock.calls[0][1]).toEqual([1, 2, 'CREATE', 'null']);
    });
  });

  describe('getAuditLogs', () => {
    it('returns audit logs with admin name', async () => {
      // 管理者名付き監査ログを返す / Returns audit logs with admin_name
      const mockLogs = [
        { id: 1, admin_id: 1, admin_name: 'Admin', action: 'CREATE', timestamp: new Date() },
      ];
      mockPool.query.mockResolvedValueOnce([mockLogs]);

      const logs = await repository.getAuditLogs(2);

      expect(logs).toHaveLength(1);
      expect(logs[0].admin_name).toBe('Admin');
      expect(mockPool.query.mock.calls[0][0]).toContain('JOIN `users` u ON al.admin_id = u.id');
      expect(mockPool.query.mock.calls[0][1]).toEqual([2, 20]);
    });
  });
});
