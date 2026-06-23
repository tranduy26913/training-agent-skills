import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '@utils/response.util';

// Middleware factory that validates req.body or req.query against a Zod
// schema. On failure responds with 422 and the joined error messages.
export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const input = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(input);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message).join(', ');
      sendError(res, errors, 422);
      return;
    }
    if (source === 'body') {
      req.body = result.data;
    }
    next();
  };
}
