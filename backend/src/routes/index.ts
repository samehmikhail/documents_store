import { Router } from 'express';
import { TenantRequest } from '../types/tenant';
import { databaseManager } from '../database/manager';
import { DocumentRepository } from '../repositories/documentRepository';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/health', (req, res) => {
  const tenantReq = req as TenantRequest;
  res.json({
    success: true,
    message: req.t?.('welcome') || 'API is running',
    timestamp: new Date().toISOString(),
    tenant: tenantReq.tenant?.name || tenantReq.tenantId
  });
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents for the tenant
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/documents', async (req, res) => {
  try {
    const tenantReq = req as TenantRequest;
    const database = await databaseManager.getDatabase(tenantReq.tenantId);
    const documentRepo = new DocumentRepository(database);
    
    const documents = await documentRepo.findAll();
    
    res.json({
      success: true,
      message: req.t?.('documents:loaded', 'Documents loaded successfully'),
      data: documents,
      tenant: tenantReq.tenantId
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: req.t?.('server.error') || 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Create a new document
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Document"
 *               content:
 *                 type: string
 *                 example: "Document content here"
 *             required:
 *               - name
 *               - content
 *     responses:
 *       201:
 *         description: Document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/documents', async (req, res) => {
  try {
    const tenantReq = req as TenantRequest;
    const { name, content } = req.body;

    if (!name || !content) {
      res.status(400).json({
        success: false,
        message: req.t?.('validation.required') || 'Name and content are required'
      });
      return;
    }

    const database = await databaseManager.getDatabase(tenantReq.tenantId);
    const documentRepo = new DocumentRepository(database);
    
    const document = await documentRepo.create({ name, content });
    
    res.status(201).json({
      success: true,
      message: req.t?.('documents:uploaded') || 'Document created successfully',
      data: document,
      tenant: tenantReq.tenantId
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      message: req.t?.('server.error') || 'Internal server error'
    });
  }
});

export default router;