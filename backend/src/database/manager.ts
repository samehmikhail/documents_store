import path from 'path';
import { SQLiteDatabase } from './sqlite';
import { IDatabase } from './interfaces';
import { Config } from '../config';

// Manages per-tenant database connections
export class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, IDatabase> = new Map();
  private dbDirectory: string;

  private constructor() {
    this.dbDirectory = path.resolve(Config.DB_DIRECTORY);
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async getDatabase(tenantId: string): Promise<IDatabase> {
    if (!this.connections.has(tenantId)) {
      const dbPath = path.join(this.dbDirectory, `${tenantId}.db`);
      
      // Ensure directory exists
      await SQLiteDatabase.ensureDirectoryExists(dbPath);
      
      const database = new SQLiteDatabase(dbPath);
      await this.initializeTenantDatabase(database);
      
      this.connections.set(tenantId, database);
    }

    return this.connections.get(tenantId)!;
  }

  private async initializeTenantDatabase(database: IDatabase): Promise<void> {
    // Initialize database schema for tenant
    // This is a basic example - in a real app you'd have proper migrations
    await database.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add more tables as needed
  }

  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.entries()).map(
      async ([tenantId, connection]) => {
        await connection.close();
        this.connections.delete(tenantId);
      }
    );
    
    await Promise.all(closePromises);
  }
}

export const databaseManager = DatabaseManager.getInstance();