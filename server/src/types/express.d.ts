import { Request } from 'express';
import type { JwtPayload } from '../models/auth.model';

export type { JwtPayload };

// 認証済みリクエスト / Authenticated request with JWT payload
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
