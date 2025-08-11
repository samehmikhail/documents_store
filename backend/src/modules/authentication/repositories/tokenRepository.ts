import { IRepository, IDatabase } from '../../../database/interfaces';
import { Token } from '../types/user';
import { v4 as uuidv4 } from 'uuid';

export class TokenRepository implements IRepository<Token> {
  constructor(private database: IDatabase) {}

  async findById(id: string): Promise<Token | undefined> {
    const row = await this.database.get(
      'SELECT * FROM tokens WHERE id = ?',
      [id]
    );

    return row ? this.mapRowToToken(row) : undefined;
  }

  async findByToken(token: string): Promise<Token | undefined> {
    const row = await this.database.get(
      'SELECT * FROM tokens WHERE token = ?',
      [token]
    );

    return row ? this.mapRowToToken(row) : undefined;
  }

  async findByUserId(userId: string): Promise<Token | undefined> {
    const row = await this.database.get(
      'SELECT * FROM tokens WHERE user_id = ?',
      [userId]
    );

    return row ? this.mapRowToToken(row) : undefined;
  }

  async findAll(): Promise<Token[]> {
    const rows = await this.database.query('SELECT * FROM tokens ORDER BY created_at DESC');
    return rows.map(this.mapRowToToken);
  }

  async create(entity: Omit<Token, 'id' | 'createdAt' | 'updatedAt'>): Promise<Token> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.database.run(
      'INSERT INTO tokens (id, token, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, entity.token, entity.userId, now, now]
    );

    return {
      id,
      token: entity.token,
      userId: entity.userId,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async update(id: string, entity: Partial<Token>): Promise<Token | undefined> {
    const existing = await this.findById(id);
    if (!existing) {
      return undefined;
    }

    const now = new Date().toISOString();

    // Build dynamic update query
    const fields = Object.keys(entity).filter(key => key !== 'id' && key !== 'createdAt');
    if (fields.length === 0) {
      return existing;
    }

    const setClause = fields.map(field => `${this.camelToSnakeCase(field)} = ?`).join(', ');
    const values = fields.map(field => (entity as any)[field]);
    values.push(now); // for updated_at
    values.push(id); // for WHERE clause

    await this.database.run(
      `UPDATE tokens SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.database.run('DELETE FROM tokens WHERE id = ?', [id]);
      return result && (result.changes || 0) > 0;
    } catch (error) {
      console.error('Error deleting token:', error);
      return false;
    }
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await this.database.run('DELETE FROM tokens WHERE user_id = ?', [userId]);
      // For DELETE operations, SQLite might return undefined, so we'll check if the operation succeeded
      // by trying to find the token afterwards
      if (result === undefined) {
        // If result is undefined, check if the token still exists
        const remainingToken = await this.findByUserId(userId);
        return !remainingToken; // If no token found, deletion was successful
      }
      return result && (result.changes || 0) > 0;
    } catch (error) {
      console.error('Error deleting tokens by user ID:', error);
      return false;
    }
  }

  private mapRowToToken(row: any): Token {
    return {
      id: row.id,
      token: row.token,
      userId: row.user_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}