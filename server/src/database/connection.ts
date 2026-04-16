import mysql from 'mysql2/promise';
import { databaseConfig } from '../config';

export const pool = mysql.createPool(databaseConfig);

export async function testConnection(): Promise<void> {
  const connection = await pool.getConnection();
  console.log('Database connected successfully');
  connection.release();
}
