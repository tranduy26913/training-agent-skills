import { Response } from 'express';

// Send a JSON success response directly.
export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  res.status(statusCode).json(data);
}

// Send an error response with a message.
export function sendError(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({ message });
}
