// Prisma client singleton. Reused across the process to avoid exhausting
// connection pools when multiple modules import the client. The DATABASE_URL
// env var must be set; see server/.env.
import dotenv from 'dotenv';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}
const isTestEnvironment = process.env.NODE_ENV === 'test';
const connectionString = isTestEnvironment
  ? process.env.DATABASE_URL_TEST
  : process.env.DATABASE_URL;

if (!connectionString) {
  const variableName = isTestEnvironment ? 'DATABASE_URL_TEST' : 'DATABASE_URL';
  throw new Error(`${variableName} is required in server/.env.`);
}

if (isTestEnvironment && connectionString === process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_TEST must not point to the primary database.');
}

const adapter = new PrismaPg({ connectionString });
// Reuse the client in dev (ts-node-dev / nodemon hot-reload) to prevent
// multiple connection pools from leaking across reloads.
// In Prisma v7+, the datasource URL is no longer read from schema.prisma.
// It must be passed explicitly to the PrismaClient constructor.
export const prisma: PrismaClient =
  globalThis.__prismaClient ?? new PrismaClient({ adapter });


if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}

// Verify the database is reachable.
export async function testConnection(): Promise<void> {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
}

// Disconnect the client gracefully.
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
