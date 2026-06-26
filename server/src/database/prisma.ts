// Prisma client singleton. Reused across the process to avoid exhausting
// connection pools when multiple modules import the client. The DATABASE_URL
// env var must be set; see .env at the project root.
import dotenv from 'dotenv';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
dotenv.config({ path: '../.env' });
declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}
const adapter = new PrismaMariaDb({
  host: "localhost",
  port: 3306,
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "app_db",
});
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
