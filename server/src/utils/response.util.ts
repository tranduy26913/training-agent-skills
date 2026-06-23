import { Response } from 'express';
import { ServiceError } from '@models/common.model';
import { logger } from './logger.util';

// Send a JSON success response directly.
export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  res.status(statusCode).json(data);
}

// Send an error response with a message.
export function sendError(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({ message });
}

// Map ServiceError to its HTTP response, fallback to 500 for unexpected
// errors. Logs go to logs/app.log (production) or console (development).
export function handleError(res: Response, error: unknown): void {
  if (error instanceof ServiceError) {
    logger.warn(`ServiceError: ${error.message}`, { code: error.code });
    sendError(res, error.message, error.code);
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  logger.error(`Unhandled error: ${errorMessage}`, { stack: errorStack });
  sendError(res, 'Internal server error', 500);
}
