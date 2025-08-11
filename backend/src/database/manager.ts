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
        owner_id TEXT NOT NULL,
        visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('tenant', 'private')),
        file_name TEXT,
        file_path TEXT,
        file_size INTEGER,
        mime_type TEXT,
        file_uuid TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create users table for authentication
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create tokens table for user authentication (1:1 relationship with users)
    await database.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes for better performance
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id)
    `);
    
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility)
    `);
    
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_documents_file_uuid ON documents(file_uuid)
    `);
    
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);
    
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token)
    `);
    
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id)
    `);
    
    // Check if we need to migrate existing documents table
    await this.migrateDocumentsTable(database);
    
    // Add more tables as needed
  }

  private async migrateDocumentsTable(database: IDatabase): Promise<void> {
    try {
      // Check if old documents table exists and needs migration
      const tableInfo = await database.query(`PRAGMA table_info(documents)`);
      const columns = tableInfo.map((col: any) => col.name);
      
      const missingColumns = [
        'owner_id', 
        'visibility',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'file_uuid'
      ].filter(col => !columns.includes(col));

      if (missingColumns.length > 0) {
        console.log('Migrating documents table with new columns...');
        
        // Add missing columns with ALTER TABLE
        for (const column of missingColumns) {
          let sql = '';
          switch (column) {
            case 'owner_id':
              sql = `ALTER TABLE documents ADD COLUMN owner_id TEXT NOT NULL DEFAULT ''`;
              break;
            case 'visibility':
              sql = `ALTER TABLE documents ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('tenant', 'private'))`;
              break;
            case 'file_name':
              sql = `ALTER TABLE documents ADD COLUMN file_name TEXT`;
              break;
            case 'file_path':
              sql = `ALTER TABLE documents ADD COLUMN file_path TEXT`;
              break;
            case 'file_size':
              sql = `ALTER TABLE documents ADD COLUMN file_size INTEGER`;
              break;
            case 'mime_type':
              sql = `ALTER TABLE documents ADD COLUMN mime_type TEXT`;
              break;
            case 'file_uuid':
              sql = `ALTER TABLE documents ADD COLUMN file_uuid TEXT`;
              break;
          }
          if (sql) {
            await database.run(sql);
          }
        }
        
        console.log('Documents table migration completed.');
      }
    } catch (error) {
      console.error('Error during documents table migration:', error);
    }
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