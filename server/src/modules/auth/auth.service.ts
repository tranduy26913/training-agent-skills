import { pool } from '../../database/connection';
import { comparePassword } from '../../utils/hash.util';
import { signToken } from '../../utils/token.util';
import type { RowDataPacket } from 'mysql2/promise';
import type { LoginInput } from './auth.validation';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'moderator';
  status: string;
}

export class AuthService {
  async login(input: LoginInput): Promise<{ token: string; user: Omit<UserRow, 'password'> } | null> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT * FROM `users` WHERE `email` = ? LIMIT 1',
      [input.email]
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
}
