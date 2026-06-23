// Auth module request/response models.
import type { UserRole } from './common.model';

// JWT token payload.
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

// User info returned on login.
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

// Login response data.
export interface LoginResponseData {
  token: string;
  user: AuthUser;
}
