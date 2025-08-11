import { Response } from 'express';
import { documentService } from '../services/documents';
import { AuthRequest } from '../middleware/auth';
import { LocalizedRequest } from '../middleware/localization';
import { ApiResponse } from '../types';

type DocumentControllerRequest = AuthRequest & LocalizedRequest;

export class DocumentController {
  /**
   * @swagger
   * /api/documents/upload:
   *   post:
   *     summary: Upload a document
   *     tags: [Documents]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               document:
   *                 type: string
   *                 format: binary
   *               tags:
   *                 type: string
   *                 description: Comma-separated tags
   *     responses:
   *       201:
   *         description: Document uploaded successfully
   *       400:
   *         description: No file uploaded
   *       401:
   *         description: Unauthorized
   */
  async uploadDocument(req: DocumentControllerRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = req.user?.id;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        } as ApiResponse);
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: req.t?.('auth.unauthorized') || 'Unauthorized'
        } as ApiResponse);
        return;
      }

      const tags = req.body.tags ? req.body.tags.split(',').map((tag: string) => tag.trim()) : [];
      
      const document = await documentService.uploadDocument(file, userId, tags);

      res.status(201).json({
        success: true,
        data: document,
        message: req.t?.('document.uploaded') || 'Document uploaded successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * @swagger
   * /api/documents:
   *   get:
   *     summary: Get all documents
   *     tags: [Documents]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: List of documents
   *       401:
   *         description: Unauthorized
   */
  async getAllDocuments(req: DocumentControllerRequest, res: Response): Promise<void> {
    try {
      const documents = await documentService.getAllDocuments();

      res.json({
        success: true,
        data: documents
      } as ApiResponse);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * @swagger
   * /api/documents/my:
   *   get:
   *     summary: Get user's documents
   *     tags: [Documents]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: List of user's documents
   *       401:
   *         description: Unauthorized
   */
  async getUserDocuments(req: DocumentControllerRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: req.t?.('auth.unauthorized') || 'Unauthorized'
        } as ApiResponse);
        return;
      }

      const documents = await documentService.getDocumentsByUser(userId);

      res.json({
        success: true,
        data: documents
      } as ApiResponse);
    } catch (error) {
      console.error('Get user documents error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * @swagger
   * /api/documents/{id}:
   *   get:
   *     summary: Download a document
   *     tags: [Documents]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Document file
   *       404:
   *         description: Document not found
   *       401:
   *         description: Unauthorized
   */
  async downloadDocument(req: DocumentControllerRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Document ID is required'
        } as ApiResponse);
        return;
      }
      
      const result = await documentService.getDocumentFile(id);

      if (!result) {
        res.status(404).json({
          success: false,
          message: req.t?.('document.notFound') || 'Document not found'
        } as ApiResponse);
        return;
      }

      const { document, buffer } = result;

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * @swagger
   * /api/documents/{id}:
   *   delete:
   *     summary: Delete a document
   *     tags: [Documents]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Document deleted successfully
   *       404:
   *         description: Document not found
   *       401:
   *         description: Unauthorized
   */
  async deleteDocument(req: DocumentControllerRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Document ID is required'
        } as ApiResponse);
        return;
      }
      
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Get document to check ownership
      const document = await documentService.getDocumentById(id);
      
      if (!document) {
        res.status(404).json({
          success: false,
          message: req.t?.('document.notFound') || 'Document not found'
        } as ApiResponse);
        return;
      }

      // Check if user owns the document or is admin
      if (document.uploadedBy !== userId && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: req.t?.('auth.forbidden') || 'Insufficient permissions'
        } as ApiResponse);
        return;
      }

      const deleted = await documentService.deleteDocument(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: req.t?.('document.notFound') || 'Document not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: req.t?.('document.deleted') || 'Document deleted successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * @swagger
   * /api/documents/search:
   *   get:
   *     summary: Search documents
   *     tags: [Documents]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query
   *     responses:
   *       200:
   *         description: Search results
   *       401:
   *         description: Unauthorized
   */
  async searchDocuments(req: DocumentControllerRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        } as ApiResponse);
        return;
      }

      const documents = await documentService.searchDocuments(q);

      res.json({
        success: true,
        data: documents
      } as ApiResponse);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }
}

export const documentController = new DocumentController();