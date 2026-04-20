// 認証モデル定義 / Auth module request/response models
import type { UserRole } from './common.model';

// JWTペイロード / JWT token payload
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

// ログインレスポンスのユーザー情報 / User info returned on login
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

// ログインレスポンス / Login response data
export interface LoginResponseData {
  token: string;
  user: AuthUser;
}
