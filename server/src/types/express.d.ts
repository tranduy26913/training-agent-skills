import { Request } from 'express';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user' | 'moderator';
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
