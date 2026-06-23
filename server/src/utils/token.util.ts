import jwt from 'jsonwebtoken';
import { authConfig } from '@config';
import type { JwtPayload } from '@models/auth.model';

// Sign a JWT containing the given payload.
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn as unknown as number,
  });
}

// Verify a JWT and return its typed payload.
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
}
