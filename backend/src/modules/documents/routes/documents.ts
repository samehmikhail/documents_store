import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';

const router = Router();
const documentController = new DocumentController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           example: "My Document"
 *         content:
 *           type: string
 *           example: "Document content here"
 *         tenantId:
 *           type: string
 *           example: "tenant-123"
 *         ownerId:
 *           type: string
 *           example: "user-456"
 *         visibility:
 *           type: string
 *           enum: [tenant, private]
 *           example: "private"
 *         fileName:
 *           type: string
 *           nullable: true
 *           example: "document.pdf"
 *         filePath:
 *           type: string
 *           nullable: true
 *         fileSize:
 *           type: number
 *           nullable: true
 *           example: 1024000
 *         mimeType:
 *           type: string
 *           nullable: true
 *           example: "application/pdf"
 *         fileUuid:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     DocumentRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "My Document"
 *         content:
 *           type: string
 *           example: "Document content here"
 *         visibility:
 *           type: string
 *           enum: [tenant, private]
 *           example: "private"
 *       required:
 *         - name
 *         - content
 */

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get documents based on user role and access level
 *     description: |
 *       - Regular users see tenant-level docs + their own private docs
 *       - Admins see all tenant documents
 *     tags:
 *       - Documents
 *     security:
 *       - TenantAuth: []
 *       - UserTokenAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/UserToken'
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *                 tenant:
 *                   type: string
 *                 user:
 *                   type: string
 *                 accessLevel:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/documents', documentController.getDocuments.bind(documentController));

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get a specific document by ID
 *     tags:
 *       - Documents
 *     security:
 *       - TenantAuth: []
 *       - UserTokenAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/UserToken'
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/documents/:id', documentController.getDocumentById.bind(documentController));



/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a file document or create a text document
 *     description: |
 *       This endpoint supports both file uploads and text document creation through multipart form data.
 *       - For file uploads: provide 'file' and optional 'name', 'content', 'visibility'
 *       - For text documents: provide 'name', 'content', and optional 'visibility' (no file)
 *       Either 'file' or 'content' is required, but not both.
 *     tags:
 *       - Documents
 *     security:
 *       - TenantAuth: []
 *       - UserTokenAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/UserToken'
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (optional - not needed for text documents)
 *               name:
 *                 type: string
 *                 description: Document name (required)
 *               content:
 *                 type: string
 *                 description: Document content (required for text documents, optional for file uploads)
 *               visibility:
 *                 type: string
 *                 enum: [tenant, private]
 *                 default: private
 *                 description: Document visibility level
 *             required:
 *               - name
 *           examples:
 *             fileUpload:
 *               summary: File upload example
 *               value:
 *                 file: "[binary data]"
 *                 name: "My Document"
 *                 visibility: "private"
 *             textDocument:
 *               summary: Text document example
 *               value:
 *                 name: "My Text Document"
 *                 content: "This is the document content"
 *                 visibility: "tenant"
 *     responses:
 *       201:
 *         description: Document uploaded or created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/documents/upload', documentController.getUploadMiddleware(), documentController.uploadDocument.bind(documentController));

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download a file document
 *     tags:
 *       - Documents
 *     security:
 *       - TenantAuth: []
 *       - UserTokenAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/UserToken'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/documents/:id/download', documentController.downloadDocument.bind(documentController));

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Update a document
 *     description: Users can only update their own documents. Admins can update any document in their tenant.
 *     tags:
 *       - Documents
 *     security:
 *       - TenantAuth: []
 *       - UserTokenAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/UserToken'
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [tenant, private]
 *     responses:
 *       200:
 *         description: Document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/documents/:id', documentController.updateDocument.bind(documentController));

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Users can only delete their own documents. Admins can delete any document in their tenant.
 *     tags:
 *       - Documents
 *     security:
 *       - TenantAuth: []
 *       - UserTokenAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/UserToken'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/documents/:id', documentController.deleteDocument.bind(documentController));

export default router;