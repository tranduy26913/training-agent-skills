import jwt from 'jsonwebtoken';
import { authConfig } from '../config';
import type { JwtPayload } from '../types/express.d';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(
    { ...payload } as object,
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiresIn as any }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
}
