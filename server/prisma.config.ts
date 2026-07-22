// Prisma v7+ configuration file.
// In Prisma v7, the datasource `url` property is no longer supported in
// schema.prisma. Connection URLs for migrations must be provided here.
// See: https://pris.ly/d/config-datasource
import dotenv from 'dotenv';
import { defineConfig, env } from '@prisma/config';

// Prisma commands run from server/, so use that directory explicitly.
dotenv.config({ path: '.env' });

const isTestEnvironment = process.env.NODE_ENV === 'test';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Supavisor session pooling works on IPv4-only development networks and
    // is also used by the Express runtime through PrismaPg.
    url: isTestEnvironment ? env('DATABASE_URL_TEST') : env('DATABASE_URL'),
  },
  migrations: {
    path: './prisma/migrations',
    seed: 'ts-node -r tsconfig-paths/register src/database/seed.ts',
  },
});
