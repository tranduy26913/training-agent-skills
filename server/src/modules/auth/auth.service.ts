import { pool } from '../../database/connection';
import { comparePassword, hashPassword } from '../../utils/hash.util';
import { signToken } from '../../utils/token.util';
import { ServiceError } from '../../models/common.model';
import type { UserRow } from '../../models/users.model';
import type { LoginResponseData } from '../../models/auth.model';
import type { LoginInput, UpdateProfileInput, ChangePasswordInput } from './auth.validation';

// 認証サービス / Authentication service
export class AuthService {
  // ログイン処理 / Login with email and password
  async login(input: LoginInput): Promise<LoginResponseData | null> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT * FROM `users` WHERE `email` = ? LIMIT 1',
      [input.email],
    );

    const user = rows[0];
    if (!user) return null;

    if (user.status !== 'active') return null;

    const valid = await comparePassword(input.password, user.password);
    if (!valid) return null;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  /**
   * Update profile for the authenticated user.
   * Only allowed fields are updated: name, birthday, note, avatar.
   * 認証済みユーザーのプロフィールを更新する。name/birthday/note/avatarのみ更新可能。
   */
  async updateProfile(
    userId: number,
    input: UpdateProfileInput,
  ): Promise<Omit<UserRow, 'password'>> {
    const [existing] = await pool.query<UserRow[]>(
      'SELECT * FROM `users` WHERE `id` = ? LIMIT 1',
      [userId],
    );

    if (!existing[0]) {
      throw new ServiceError('User not found', 404);
    }

    await pool.query(
      'UPDATE `users` SET `name` = ?, `birthday` = ?, `note` = ?, `avatar` = ?, `updated_at` = NOW() WHERE `id` = ?',
      [
        input.name,
        input.birthday ?? null,
        input.note ?? null,
        input.avatar ?? null,
        userId,
      ],
    );

    const [updated] = await pool.query<UserRow[]>(
      'SELECT * FROM `users` WHERE `id` = ? LIMIT 1',
      [userId],
    );

    const { password: _, ...userWithoutPassword } = updated[0];
    return userWithoutPassword;
  }

  /**
   * Change password for the authenticated user.
   * Verifies currentPassword before updating.
   * 認証済みユーザーのパスワードを変更する。更新前に現在のパスワードを確認する。
   */
  async changePassword(userId: number, input: ChangePasswordInput): Promise<void> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT * FROM `users` WHERE `id` = ? LIMIT 1',
      [userId],
    );

    const user = rows[0];
    if (!user) {
      throw new ServiceError('User not found', 404);
    }

    const isValid = await comparePassword(input.currentPassword, user.password);
    if (!isValid) {
      throw new ServiceError('Current password is incorrect', 401);
    }

    const hashed = await hashPassword(input.newPassword);

    await pool.query('UPDATE `users` SET `password` = ?, `updated_at` = NOW() WHERE `id` = ?', [
      hashed,
      userId,
    ]);
  }
}
