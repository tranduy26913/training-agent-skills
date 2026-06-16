// Prisma client singleton. Reused across the process to avoid exhausting
// connection pools when multiple modules import the client. The DATABASE_URL
// env var must be set; see .env at the project root.
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

// Reuse the client in dev (ts-node-dev / nodemon hot-reload) to prevent
// multiple connection pools from leaking across reloads.
export const prisma: PrismaClient =
  globalThis.__prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}

// Test the connection. Replaces the old mysql2 testConnection helper.
export async function testConnection(): Promise<void> {
  await prisma.$connect();
  // Lightweight query to confirm the DB is reachable.
  await prisma.$queryRaw`SELECT 1`;
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
