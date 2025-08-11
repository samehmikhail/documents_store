import { IRepository, IDatabase } from '../../../database/interfaces';
import { User } from '../types/user';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository implements IRepository<User> {
  constructor(private database: IDatabase) {}

  async findById(id: string): Promise<User | undefined> {
    const row = await this.database.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    return row ? this.mapRowToUser(row) : undefined;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const row = await this.database.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    return row ? this.mapRowToUser(row) : undefined;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.database.query('SELECT * FROM users ORDER BY created_at DESC');
    return rows.map(this.mapRowToUser);
  }

  async create(entity: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.database.run(
      'INSERT INTO users (id, username, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, entity.username, entity.role || 'user', now, now]
    );

    return {
      id,
      username: entity.username,
      role: entity.role || 'user',
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async update(id: string, entity: Partial<User>): Promise<User | undefined> {
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
      `UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database.run('DELETE FROM users WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}