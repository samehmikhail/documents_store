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

  /**
   * Find documents based on role and user access
   * - Admins see all tenant documents
   * - Regular users see tenant-level docs + their own private docs
   * Since each tenant has its own database, we don't need to filter by tenant_id
   */
  async findByAccessLevel(userId: string, userRole: 'admin' | 'user'): Promise<Document[]> {
    let query: string;
    let params: string[];

    if (userRole === 'admin') {
      // Admins see all documents in the tenant database
      query = 'SELECT * FROM documents ORDER BY created_at DESC';
      params = [];
    } else {
      // Regular users see tenant-level docs + their own private docs
      query = `
        SELECT * FROM documents 
        WHERE visibility = 'tenant' OR (visibility = 'private' AND owner_id = ?)
        ORDER BY created_at DESC
      `;
      params = [userId];
    }

    const rows = await this.database.query(query, params);
    return rows.map(this.mapRowToDocument);
  }

  /**
   * Find documents owned by a specific user
   */
  async findByOwner(ownerId: string): Promise<Document[]> {
    const rows = await this.database.query(
      'SELECT * FROM documents WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    return rows.map(this.mapRowToDocument);
  }

  async create(entity: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.database.run(
      `INSERT INTO documents (
        id, name, content, owner_id, visibility,
        file_name, file_path, file_size, mime_type, file_uuid,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, entity.name, entity.content, entity.ownerId, entity.visibility,
        entity.fileName || null, entity.filePath || null, entity.fileSize || null, 
        entity.mimeType || null, entity.fileUuid || null,
        now, now
      ]
    );

    return {
      id,
      ...entity,
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
    return result && result.changes > 0;
  }

  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      name: row.name,
      content: row.content,
      ownerId: row.owner_id,
      visibility: row.visibility,
      fileName: row.file_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      fileUuid: row.file_uuid,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}