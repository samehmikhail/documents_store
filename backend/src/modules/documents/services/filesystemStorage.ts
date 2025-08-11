import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageInterface, StorageResult, FileMetadata } from '../interfaces/storage';
import { Config } from '../../../config';

export class FilesystemStorage implements StorageInterface {
  private readonly storageDir: string;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || Config.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.access(this.storageDir);
    } catch {
      await fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  async storeFile(file: Buffer, originalName: string, mimeType: string): Promise<StorageResult> {
    const fileUuid = uuidv4();
    const extension = path.extname(originalName);
    const fileName = `${fileUuid}${extension}`;
    const filePath = path.join(this.storageDir, fileName);

    await fs.writeFile(filePath, file);

    return {
      fileUuid,
      filePath,
      fileSize: file.length,
      mimeType
    };
  }

  async getFile(fileUuid: string): Promise<Buffer | null> {
    try {
      const filePath = await this.getFilePath(fileUuid);
      if (!filePath) {
        return null;
      }
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error retrieving file:', error);
      return null;
    }
  }

  async deleteFile(fileUuid: string): Promise<boolean> {
    try {
      const filePath = await this.getFilePath(fileUuid);
      if (!filePath) {
        return false;
      }
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async fileExists(fileUuid: string): Promise<boolean> {
    try {
      const filePath = await this.getFilePath(fileUuid);
      if (!filePath) {
        return false;
      }
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileMetadata(fileUuid: string): Promise<FileMetadata | null> {
    try {
      const filePath = await this.getFilePath(fileUuid);
      if (!filePath) {
        return null;
      }
      
      const stats = await fs.stat(filePath);
      
      return {
        fileUuid,
        filePath,
        fileSize: stats.size,
        mimeType: 'application/octet-stream', // Default, should be stored in DB
        createdAt: stats.birthtime
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  private async getFilePath(fileUuid: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.storageDir);
      const matchingFile = files.find(file => file.startsWith(fileUuid));
      
      if (matchingFile) {
        return path.join(this.storageDir, matchingFile);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding file path:', error);
      return null;
    }
  }
}