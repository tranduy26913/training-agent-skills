import { Response } from 'express';
import { ServiceError } from '../models/common.model';
import { logger } from './logger.util';

// 成功レスポンス / Send JSON response directly
export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  res.status(statusCode).json(data);
}

// エラーレスポンス / Send error response with message
export function sendError(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({ message });
}

// エラーハンドリング / Map ServiceError to HTTP response, fallback to 500
// ログファイル: logs/app.log (本番環境) / コンソール出力 (開発環境)
export function handleError(res: Response, error: unknown): void {
  if (error instanceof ServiceError) {
    logger.warn(`ServiceError: ${error.message}`, { code: error.code });
    sendError(res, error.message, error.code);
    return;
  }
  
  // 予期せぬエラーの場合はスタックトレースも含めて記録
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  logger.error(`Unhandled error: ${errorMessage}`, { stack: errorStack });
  sendError(res, 'Internal server error', 500);
}
