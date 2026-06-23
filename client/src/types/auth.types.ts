// Auth module type definitions.
import type { UserRole } from './api.types';

// Login request payload.
export interface LoginPayload {
  email: string;
  password: string;
}

// Authenticated user info.
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  avatar?: string;    // base64 image string
  birthday?: string;  // ISO date 'YYYY-MM-DD'
  note?: string;      // personal note
}

// Login response data.
export interface LoginResponseData {
  token: string;
  user: AuthUser;
}