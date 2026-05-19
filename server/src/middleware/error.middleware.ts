import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';
import { sendError } from '../utils/response.util';

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const typedErr = err as Error & { type?: string; status?: number; statusCode?: number };
  if (typedErr.type === 'entity.too.large' || typedErr.status === 413 || typedErr.statusCode === 413) {
    sendError(res, 'Request entity too large', 413);
    return;
  }

  logger.error(err.message, { stack: err.stack });
  sendError(res, err.message || 'Internal server error', 500);
}
