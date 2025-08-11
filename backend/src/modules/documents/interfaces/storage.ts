export interface StorageInterface {
  /**
   * Store a file and return its metadata
   */
  storeFile(file: Buffer, originalName: string, mimeType: string): Promise<StorageResult>;

  /**
   * Retrieve a file by its UUID
   */
  getFile(fileUuid: string): Promise<Buffer | null>;

  /**
   * Delete a file by its UUID
   */
  deleteFile(fileUuid: string): Promise<boolean>;

  /**
   * Check if a file exists
   */
  fileExists(fileUuid: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getFileMetadata(fileUuid: string): Promise<FileMetadata | null>;
}

export interface StorageResult {
  fileUuid: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export interface FileMetadata {
  fileUuid: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}