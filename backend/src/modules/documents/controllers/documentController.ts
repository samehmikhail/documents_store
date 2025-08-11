import { Request, Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../../authentication/middleware/authentication';
import { databaseManager } from '../../../database/manager';
import { DocumentRepository } from '../repositories/documentRepository';
import { FilesystemStorage } from '../services/filesystemStorage';
import { Config } from '../../../config';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: Config.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now - can be restricted later
    cb(null, true);
  },
});

export class DocumentController {
  private storageService: FilesystemStorage;

  constructor() {
    this.storageService = new FilesystemStorage();
  }

  // Get multer middleware for single file upload
  getUploadMiddleware() {
    return upload.single('file');
  }

  // Get multer middleware for multiple file uploads
  getMultiUploadMiddleware() {
    return upload.array('files', 10);
  }

  /**
   * Get documents based on user role and access level
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const database = await databaseManager.getDatabase(authenticatedReq.tenantId);
      const documentRepo = new DocumentRepository(database);
      
      const documents = await documentRepo.findByAccessLevel(
        authenticatedReq.tenantId,
        authenticatedReq.user.id,
        authenticatedReq.user.role
      );
      
      res.json({
        success: true,
        message: req.t?.('documents:loaded') || 'Documents loaded successfully',
        data: documents,
        tenant: authenticatedReq.tenantId,
        user: authenticatedReq.user.username,
        accessLevel: authenticatedReq.user.role
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      });
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.invalid_id') || 'Invalid document ID'
        });
        return;
      }
      
      const database = await databaseManager.getDatabase(authenticatedReq.tenantId);
      const documentRepo = new DocumentRepository(database);
      
      const document = await documentRepo.findById(id);
      
      if (!document) {
        res.status(404).json({
          success: false,
          message: req.t?.('documents:not_found') || 'Document not found'
        });
        return;
      }

      // Check access permissions
      if (!this.canAccessDocument(document, authenticatedReq.user.id, authenticatedReq.user.role, authenticatedReq.tenantId)) {
        res.status(403).json({
          success: false,
          message: req.t?.('documents:access_denied') || 'Access denied'
        });
        return;
      }
      
      res.json({
        success: true,
        message: req.t?.('documents:loaded') || 'Document loaded successfully',
        data: document
      });
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      });
    }
  }

  /**
   * Create a text document
   */
  async createTextDocument(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { name, content, visibility = 'private' } = req.body;

      if (!name || !content) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.required') || 'Name and content are required'
        });
        return;
      }

      if (!['tenant', 'private'].includes(visibility)) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.invalid_visibility') || 'Invalid visibility level'
        });
        return;
      }

      const database = await databaseManager.getDatabase(authenticatedReq.tenantId);
      const documentRepo = new DocumentRepository(database);
      
      const document = await documentRepo.create({
        name,
        content,
        tenantId: authenticatedReq.tenantId,
        ownerId: authenticatedReq.user.id,
        visibility: visibility as 'tenant' | 'private'
      });
      
      res.status(201).json({
        success: true,
        message: req.t?.('documents:created') || 'Document created successfully',
        data: document
      });
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      });
    }
  }

  /**
   * Upload a file document
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { name, visibility = 'private' } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.file_required') || 'File is required'
        });
        return;
      }

      if (!['tenant', 'private'].includes(visibility)) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.invalid_visibility') || 'Invalid visibility level'
        });
        return;
      }

      // Store file using storage service
      const storageResult = await this.storageService.storeFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      const database = await databaseManager.getDatabase(authenticatedReq.tenantId);
      const documentRepo = new DocumentRepository(database);
      
      const document = await documentRepo.create({
        name: name || file.originalname,
        content: '', // Empty for file uploads
        tenantId: authenticatedReq.tenantId,
        ownerId: authenticatedReq.user.id,
        visibility: visibility as 'tenant' | 'private',
        fileName: file.originalname,
        filePath: storageResult.filePath,
        fileSize: storageResult.fileSize,
        mimeType: storageResult.mimeType,
        fileUuid: storageResult.fileUuid
      });
      
      res.status(201).json({
        success: true,
        message: req.t?.('documents:uploaded') || 'Document uploaded successfully',
        data: document
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      });
    }
  }

  /**
   * Download a file document
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.invalid_id') || 'Invalid document ID'
        });
        return;
      }
      
      const database = await databaseManager.getDatabase(authenticatedReq.tenantId);
      const documentRepo = new DocumentRepository(database);
      
      const document = await documentRepo.findById(id);
      
      if (!document) {
        res.status(404).json({
          success: false,
          message: req.t?.('documents:not_found') || 'Document not found'
        });
        return;
      }

      // Check access permissions
      if (!this.canAccessDocument(document, authenticatedReq.user.id, authenticatedReq.user.role, authenticatedReq.tenantId)) {
        res.status(403).json({
          success: false,
          message: req.t?.('documents:access_denied') || 'Access denied'
        });
        return;
      }

      if (!document.fileUuid) {
        res.status(400).json({
          success: false,
          message: req.t?.('documents:not_file') || 'Document is not a file'
        });
        return;
      }

      // Get file from storage
      const fileBuffer = await this.storageService.getFile(document.fileUuid);
      
      if (!fileBuffer) {
        res.status(404).json({
          success: false,
          message: req.t?.('documents:file_not_found') || 'File not found'
        });
        return;
      }

      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.send(fileBuffer);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      });
    }
  }

  /**
   * Update a document
   */
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.invalid_id') || 'Invalid document ID'
        });
        return;
      }
      
      const database = await databaseManager.getDatabase(authenticatedReq.tenantId);
      const documentRepo = new DocumentRepository(database);
      
      const existingDocument = await documentRepo.findById(id);
      
      if (!existingDocument) {
        res.status(404).json({
          success: false,
          message: req.t?.('documents:not_found') || 'Document not found'
        });
        return;
      }

      // Check if user can modify this document
      if (!this.canModifyDocument(existingDocument, authenticatedReq.user.id, authenticatedReq.user.role)) {
        res.status(403).json({
          success: false,
          message: req.t?.('documents:modify_denied') || 'Permission denied'
        });
        return;
      }

      // Filter allowed update fields
      const allowedFields = ['name', 'content', 'visibility'];
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
      );
      
      const document = await documentRepo.update(id, filteredUpdateData);
      
      res.json({
        success: true,
        message: req.t?.('documents:updated') || 'Document updated successfully',
        data: document
      });
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      });
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.invalid_id') || 'Invalid document ID'
        });
        return;
      }
      
      const database = await databaseManager.getDatabase(authenticatedReq.tenantId);
      const documentRepo = new DocumentRepository(database);
      
      const document = await documentRepo.findById(id);
      
      if (!document) {
        res.status(404).json({
          success: false,
          message: req.t?.('documents:not_found') || 'Document not found'
        });
        return;
      }

      // Check if user can delete this document
      if (!this.canModifyDocument(document, authenticatedReq.user.id, authenticatedReq.user.role)) {
        res.status(403).json({
          success: false,
          message: req.t?.('documents:delete_denied') || 'Permission denied'
        });
        return;
      }

      // Delete file from storage if it exists
      if (document.fileUuid) {
        await this.storageService.deleteFile(document.fileUuid);
      }

      const deleted = await documentRepo.delete(id);
      
      if (deleted) {
        res.json({
          success: true,
          message: req.t?.('documents:deleted') || 'Document deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: req.t?.('server.error') || 'Failed to delete document'
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      });
    }
  }

  /**
   * Check if user can access a document based on role and visibility
   */
  private canAccessDocument(document: any, userId: string, userRole: 'admin' | 'user', tenantId: string): boolean {
    // Document must belong to the same tenant
    if (document.tenantId !== tenantId) {
      return false;
    }

    // Admins can access all documents in their tenant
    if (userRole === 'admin') {
      return true;
    }

    // Regular users can access tenant-level docs or their own private docs
    return document.visibility === 'tenant' || 
           (document.visibility === 'private' && document.ownerId === userId);
  }

  /**
   * Check if user can modify/delete a document
   */
  private canModifyDocument(document: any, userId: string, userRole: 'admin' | 'user'): boolean {
    // Admins can modify any document in their tenant
    if (userRole === 'admin') {
      return true;
    }

    // Regular users can only modify their own documents
    return document.ownerId === userId;
  }
}