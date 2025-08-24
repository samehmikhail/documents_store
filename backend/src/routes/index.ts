import { Router } from 'express';
import { AuthenticatedRequest } from '../modules/authentication/middleware/authentication';
import documentRoutes from '../modules/documents/routes/documents';
import eventRoutes from '../modules/events/routes/events';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     security:
 *       - TenantAuth: []
 *       - UserTokenAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/UserToken'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/health', (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  res.json({
    success: true,
    message: req.t?.('welcome') || 'API is running',
    timestamp: new Date().toISOString(),
    tenant: authenticatedReq.tenant?.id || authenticatedReq.tenantId,
    user: {
      username: authenticatedReq.user.username,
      role: authenticatedReq.user.role
    }
  });
});

// Use the document routes
router.use(documentRoutes);

// Use the event routes  
router.use(eventRoutes);

export default router;