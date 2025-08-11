import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/database';
import { Config } from '../config';
import { Document } from '../types';

export class DocumentService {
  async uploadDocument(
    file: Express.Multer.File,
    userId: string,
    tags?: string[]
  ): Promise<Document> {
    const documentId = uuidv4();
    const filename = `${documentId}-${file.originalname}`;
    const filepath = path.join(Config.UPLOAD_PATH, filename);

    // Ensure upload directory exists
    await fs.mkdir(Config.UPLOAD_PATH, { recursive: true });

    // Save file to disk
    await fs.writeFile(filepath, file.buffer);

    const document: Document = {
      id: documentId,
      name: file.originalname,
      filename,
      path: filepath,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      uploadedAt: new Date(),
      tags: tags || []
    };

    return database.createDocument(document);
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    return database.getDocumentById(id);
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return database.getDocumentsByUserId(userId);
  }

  async getAllDocuments(): Promise<Document[]> {
    return database.getAllDocuments();
  }

  async deleteDocument(id: string): Promise<boolean> {
    const document = database.getDocumentById(id);
    if (!document) {
      return false;
    }

    try {
      // Delete file from disk
      await fs.unlink(document.path);
    } catch (error) {
      console.warn(`Failed to delete file: ${document.path}`, error);
      // Continue with database deletion even if file deletion fails
    }

    return database.deleteDocument(id);
  }

  async getDocumentFile(id: string): Promise<{ document: Document; buffer: Buffer } | null> {
    const document = database.getDocumentById(id);
    if (!document) {
      return null;
    }

    try {
      const buffer = await fs.readFile(document.path);
      return { document, buffer };
    } catch (error) {
      console.error(`Failed to read file: ${document.path}`, error);
      return null;
    }
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return database.searchDocuments(query);
  }

  async updateDocumentTags(id: string, tags: string[]): Promise<Document | null> {
    const updated = database.updateDocument(id, { tags });
    return updated || null;
  }
}

export const documentService = new DocumentService();