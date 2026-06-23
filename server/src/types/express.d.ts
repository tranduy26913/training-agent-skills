import { Request } from 'express';
import type { JwtPayload } from '@models/auth.model';

export type { JwtPayload };

// Authenticated request with the decoded JWT payload attached by authMiddleware.
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
