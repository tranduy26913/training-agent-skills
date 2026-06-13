import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import fs from 'fs';
import path from 'path';
import { pool } from './connection';
import type { RowDataPacket } from 'mysql2/promise';

// Check for test mode via command line argument
const isTestMode = process.argv.includes('--test');
if (isTestMode) {
  process.env.DB_NAME = 'app_db_test';
  console.log('Running migrations in TEST mode on database: app_db_test');
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`_migrations\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL UNIQUE,
      \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT name FROM `_migrations` ORDER BY id ASC'
  );
  return rows.map((r) => r.name);
}

async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();

  const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    process.exit(0);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !executed.includes(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    await pool.end();
    process.exit(0);
  }

  for (const file of pending) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract UP section
    const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?=--\s*DOWN|$)/i);
    if (!upMatch) {
      console.error(`No -- UP section found in ${file}`);
      process.exit(1);
    }

    const upSQL = upMatch[1].trim();
    if (!upSQL) {
      console.warn(`Empty UP section in ${file}, skipping.`);
      continue;
    }

    console.log(`Running migration: ${file}`);
    const statements = upSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }

    await pool.query('INSERT INTO `_migrations` (`name`) VALUES (?)', [file]);
    console.log(`  ✓ ${file}`);
  }

  console.log('All migrations completed.');
  await pool.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
