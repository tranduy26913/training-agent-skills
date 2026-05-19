/**
 * Auth service unit tests (updateProfile, changePassword)
 * 認証サービスのユニットテスト（プロフィール更新、パスワード変更）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { ServiceError } from '../../models/common.model';

// データベース接続のモック / Mock database pool
vi.mock('../../database/connection', () => ({
  pool: {
    query: vi.fn(),
  },
}));

// ハッシュユーティリティのモック / Mock hash utilities
vi.mock('../../utils/hash.util', () => ({
  hashPassword: vi.fn().mockResolvedValue('new_hashed_password'),
  comparePassword: vi.fn(),
}));

// トークンユーティリティのモック / Mock token utility
vi.mock('../../utils/token.util', () => ({
  signToken: vi.fn().mockReturnValue('mock_token'),
}));

import { pool } from '../../database/connection';
import { comparePassword, hashPassword } from '../../utils/hash.util';

const mockPool = pool as unknown as { query: ReturnType<typeof vi.fn> };
const mockComparePassword = comparePassword as ReturnType<typeof vi.fn>;
const mockHashPassword = hashPassword as ReturnType<typeof vi.fn>;

const mockUserRow = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed_old_password',
  role: 'user' as const,
  status: 'active' as const,
  avatar: null,
  birthday: null,
  note: null,
  points: 0,
  last_login_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    vi.clearAllMocks();
    // デフォルトのハッシュ関数モック / Default hash mock
    mockHashPassword.mockResolvedValue('new_hashed_password');
  });

  // ===== updateProfile =====
  describe('updateProfile', () => {
    it('updates only allowed fields (name, birthday, note, avatar)', async () => {
      // 許可されたフィールドのみを更新する
      const updatedUser = { ...mockUserRow, name: 'New Name', password: undefined };
      mockPool.query
        .mockResolvedValueOnce([[{ ...mockUserRow }]]) // SELECT to verify user exists
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
        .mockResolvedValueOnce([[{ ...mockUserRow, name: 'New Name' }]]); // SELECT after update

      const result = await service.updateProfile(1, {
        name: 'New Name',
        birthday: undefined,
        note: undefined,
        avatar: undefined,
      });

      expect(result.name).toBe('New Name');
      // email/role/status/points should not be updated
      const updateCall = mockPool.query.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE');
      expect(updateCall[0]).not.toContain('email');
      expect(updateCall[0]).not.toContain('role');
      expect(updateCall[0]).not.toContain('status');
    });

    it('throws ServiceError 404 when user not found', async () => {
      // ユーザーが見つからない場合404エラーを投げる
      mockPool.query.mockResolvedValueOnce([[]]); // empty result

      await expect(service.updateProfile(999, { name: 'X' }))
        .rejects.toMatchObject({ code: 404 });
    });

    it('updates avatar as base64 string', async () => {
      // アバターをbase64文字列として更新する
      const base64Avatar = 'data:image/png;base64,abc123';
      mockPool.query
        .mockResolvedValueOnce([[{ ...mockUserRow }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ ...mockUserRow, avatar: base64Avatar }]]);

      const result = await service.updateProfile(1, { name: 'Test User', avatar: base64Avatar });

      expect(result.avatar).toBe(base64Avatar);
    });
  });

  // ===== changePassword =====
  describe('changePassword', () => {
    it('changes password when currentPassword is correct', async () => {
      // 現在のパスワードが正しい場合にパスワードを変更する
      mockPool.query
        .mockResolvedValueOnce([[{ ...mockUserRow }]]) // SELECT password
        .mockResolvedValueOnce([{ affectedRows: 1 }]);  // UPDATE password
      mockComparePassword.mockResolvedValueOnce(true);

      await expect(
        service.changePassword(1, {
          currentPassword: 'correct_password',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123',
        }),
      ).resolves.toBeUndefined();

      expect(mockHashPassword).toHaveBeenCalledWith('newpass123');
      expect(mockPool.query.mock.calls[1][0]).toContain('UPDATE');
    });

    it('throws ServiceError 401 when currentPassword is wrong', async () => {
      // 現在のパスワードが間違っている場合401エラーを投げる
      mockPool.query.mockResolvedValueOnce([[{ ...mockUserRow }]]);
      mockComparePassword.mockResolvedValueOnce(false);

      await expect(
        service.changePassword(1, {
          currentPassword: 'wrong_password',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123',
        }),
      ).rejects.toMatchObject({ code: 401 });
    });

    it('throws ServiceError 404 when user not found', async () => {
      // ユーザーが見つからない場合404エラーを投げる
      mockPool.query.mockResolvedValueOnce([[]]); // empty result

      await expect(
        service.changePassword(999, {
          currentPassword: 'any',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123',
        }),
      ).rejects.toMatchObject({ code: 404 });
    });

    it('hashes newPassword before saving to database', async () => {
      // データベースに保存する前に新しいパスワードをハッシュ化する
      mockPool.query
        .mockResolvedValueOnce([[{ ...mockUserRow }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockComparePassword.mockResolvedValueOnce(true);

      await service.changePassword(1, {
        currentPassword: 'correct',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      expect(mockHashPassword).toHaveBeenCalledWith('newpass123');
      // UPDATE should use hashed password, not plain text
      const updateQuery = mockPool.query.mock.calls[1];
      expect(updateQuery[1]).toContain('new_hashed_password');
    });
  });
});
