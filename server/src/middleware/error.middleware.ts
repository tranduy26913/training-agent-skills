import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';
import { sendError } from '../utils/response.util';

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, { stack: err.stack });
  sendError(res, err.message || 'Internal server error', 500);
}
