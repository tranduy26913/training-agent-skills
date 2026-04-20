import { Response } from 'express';
import { ServiceError } from '../models/common.model';

// 成功レスポンス / Send JSON response directly
export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  res.status(statusCode).json(data);
}

// エラーレスポンス / Send error response with message
export function sendError(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({ message });
}

// エラーハンドリング / Map ServiceError to HTTP response, fallback to 500
export function handleError(res: Response, error: unknown): void {
  if (error instanceof ServiceError) {
    sendError(res, error.message, error.code);
    return;
  }
  sendError(res, 'Internal server error', 500);
}
