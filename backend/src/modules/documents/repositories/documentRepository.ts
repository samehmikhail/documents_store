import { IRepository, IDatabase } from '../../../database/interfaces';
import { Document } from '../types/document';
import { v4 as uuidv4 } from 'uuid';

// Install uuid if not present
// npm install uuid @types/uuid

export class DocumentRepository implements IRepository<Document> {
  constructor(private database: IDatabase) {}

  async findById(id: string): Promise<Document | undefined> {
    const row = await this.database.get(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );

    return row ? this.mapRowToDocument(row) : undefined;
  }

  async findAll(): Promise<Document[]> {
    const rows = await this.database.query('SELECT * FROM documents ORDER BY created_at DESC');
    return rows.map(this.mapRowToDocument);
  }

  async create(entity: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.database.run(
      'INSERT INTO documents (id, name, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, entity.name, entity.content, now, now]
    );

    return {
      id,
      name: entity.name,
      content: entity.content,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async update(id: string, entity: Partial<Document>): Promise<Document | undefined> {
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
      `UPDATE documents SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database.run('DELETE FROM documents WHERE id = ?', [id]);
    return result.changes > 0;
  }

  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      name: row.name,
      content: row.content,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}