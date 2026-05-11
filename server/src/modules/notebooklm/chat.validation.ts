// チャット機能のバリデーションスキーマ / Validation schemas for chat feature
import { z } from 'zod';

// セッション作成スキーマ / Schema for creating a chat session
export const createSessionSchema = z.object({
  title: z.string().trim().max(255, 'Title must be at most 255 characters').optional(),
});

// セッション更新スキーマ / Schema for updating a chat session
export const updateSessionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
});

// メッセージ送信スキーマ / Schema for sending a chat message
export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be at most 10000 characters'),
});

// セッション一覧クエリスキーマ / Schema for listing sessions query params
export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

// 型推論エクスポート / Inferred type exports
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
