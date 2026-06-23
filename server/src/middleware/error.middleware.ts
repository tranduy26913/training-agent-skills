import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger.util';
import { sendError } from '@utils/response.util';
import { ServiceError } from '@models/common.model';

// Central error handler. Maps ServiceError to its HTTP code, 413 for payload
// too large, and falls back to 500 for unexpected errors.
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ServiceError) {
    sendError(res, err.message, err.code);
    return;
  }

  const typedErr = err as Error & { type?: string; status?: number; statusCode?: number };
  if (typedErr.type === 'entity.too.large' || typedErr.status === 413 || typedErr.statusCode === 413) {
    sendError(res, 'Request entity too large', 413);
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error(`Unhandled error: ${message}`, { stack });
  sendError(res, 'Internal server error', 500);
}
