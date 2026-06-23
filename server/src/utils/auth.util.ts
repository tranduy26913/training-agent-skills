// Helpers for accessing the authenticated user on the request in a type-safe
// way, without `as any` or non-null assertions at call sites.
import type { AuthenticatedRequest } from '@types-express';
import type { JwtPayload } from '@models/auth.model';

// Returns the JWT payload when present, otherwise null.
export function getAuthUser(req: AuthenticatedRequest): JwtPayload | null {
  return req.user ?? null;
}

// Returns the authenticated user id, or null when not authenticated.
export function getAuthUserId(req: AuthenticatedRequest): number | null {
  return req.user?.userId ?? null;
}