// 認証型定義 / Auth module type definitions
import type { UserRole } from './api.types';

// ログインペイロード / Login request payload
export interface LoginPayload {
  email: string;
  password: string;
}

// 認証ユーザー情報 / Authenticated user info
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

// ログインレスポンスデータ / Login response data
export interface LoginResponseData {
  token: string;
  user: AuthUser;
}
