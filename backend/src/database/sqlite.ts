import { Database } from 'sqlite3';
import { promisify } from 'util';
import { IDatabase } from './interfaces';
import path from 'path';
import fs from 'fs/promises';

export class SQLiteDatabase implements IDatabase {
  private db: Database;
  private allAsync: (sql: string, params?: any[]) => Promise<any[]>;
  private getAsync: (sql: string, params?: any[]) => Promise<any>;
  private runAsync: (sql: string, params?: any[]) => Promise<{ lastID?: number; changes: number }>;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.allAsync = promisify(this.db.all.bind(this.db));
    this.getAsync = promisify(this.db.get.bind(this.db));
    this.runAsync = promisify(this.db.run.bind(this.db));
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.allAsync(sql, params) as Promise<T[]>;
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.getAsync(sql, params) as Promise<T | undefined>;
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes: number }> {
    return this.runAsync(sql, params) as Promise<{ lastID?: number; changes: number }>;
  }

  async close(): Promise<void> {
    const close = promisify(this.db.close.bind(this.db));
    return close();
  }

  static async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}