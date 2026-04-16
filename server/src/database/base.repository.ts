import { pool } from '../database/connection';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export abstract class BaseRepository<T> {
  constructor(protected tableName: string) {}

  async findAll(page = 1, limit = 20): Promise<{ data: T[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM \`${this.tableName}\` LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM \`${this.tableName}\``
    );
    return { data: rows as T[], total };
  }

  async findById(id: number): Promise<T | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM \`${this.tableName}\` WHERE id = ?`,
      [id]
    );
    return (rows[0] as T) || null;
  }

  async create(data: Partial<T>): Promise<ResultSetHeader> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.map((k) => `\`${k}\``).join(', ');

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO \`${this.tableName}\` (${columns}) VALUES (${placeholders})`,
      values
    );
    return result;
  }

  async update(id: number, data: Partial<T>): Promise<ResultSetHeader> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE \`${this.tableName}\` SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    return result;
  }

  async delete(id: number): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM \`${this.tableName}\` WHERE id = ?`,
      [id]
    );
    return result;
  }
}
