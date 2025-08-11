export interface Document {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  // New fields for file storage and access control
  tenantId: string;
  ownerId: string;
  visibility: 'tenant' | 'private';
  // File metadata (if document is a file)
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  fileUuid?: string;
}