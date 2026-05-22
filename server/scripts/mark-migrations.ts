import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { pool } from '../src/database/connection';

const alreadyRan = [
  '001_create_users_table.sql',
  '002_create_roles_table.sql',
  '003_create_settings_table.sql',
  '004_create_audit_logs_table.sql',
  '005_add_user_fields.sql',
  '006_create_employees_table.sql',
  '007_create_notebooklm_workspace_ingestion.sql',
  '008_create_notebooklm_chat_tables.sql',
  '009_create_notebooklm_operations_tables.sql',
  '010_add_chat_session_llm_provider.sql',
];

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`_migrations\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL UNIQUE,
      \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [rows]: any = await pool.query('SELECT name FROM `_migrations`');
  const names = rows.map((r: any) => r.name as string);

  for (const m of alreadyRan) {
    if (!names.includes(m)) {
      await pool.query('INSERT INTO `_migrations` (`name`) VALUES (?)', [m]);
      console.log('Marked as done:', m);
    } else {
      console.log('Already tracked:', m);
    }
  }

  await pool.end();
  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
