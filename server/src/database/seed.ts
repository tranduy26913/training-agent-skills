import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import fs from 'fs';
import path from 'path';
import { pool } from './connection';

async function runSeeds(): Promise<void> {
  const seedsDir = path.resolve(__dirname, '../../../database/seeds');
  if (!fs.existsSync(seedsDir)) {
    console.log('No seeds directory found.');
    process.exit(0);
  }

  const files = fs.readdirSync(seedsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No seed files found.');
    await pool.end();
    process.exit(0);
  }

  for (const file of files) {
    const filePath = path.join(seedsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8').trim();

    if (!content) continue;

    console.log(`Running seed: ${file}`);
    const cleanedSQL = content
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanedSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log(`  ✓ ${file}`);
  }

  console.log('All seeds completed.');
  await pool.end();
  process.exit(0);
}

runSeeds().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
