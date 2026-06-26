// Prisma v7+ configuration file.
// In Prisma v7, the datasource `url` property is no longer supported in
// schema.prisma. Connection URLs for migrations must be provided here.
// See: https://pris.ly/d/config-datasource
import dotenv from 'dotenv';
import path from 'node:path';
import { defineConfig, env } from '@prisma/config';

// Load .env from the project root (parent of server/) so DATABASE_URL
// resolves correctly for prisma CLI commands (migrate, validate, etc.).
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
  schema: './prisma/',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: './prisma/migrations',
    seed: "tsx src/database/seed.ts",
  },
});