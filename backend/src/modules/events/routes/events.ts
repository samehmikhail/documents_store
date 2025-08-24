import { Router } from 'express';
import { eventController } from '../controllers/eventController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - id
 *         - tenant_id
 *         - message
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: Unique event identifier (UUID)
 *         tenant_id:
 *           type: string
 *           description: Tenant identifier
 *         message:
 *           type: string
 *           description: Event message content
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Event creation timestamp
 *         author_id:
 *           type: string
 *           description: ID of the user who created the event
 *     CreateEventRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           maxLength: 2048
 *           description: Event message content
 */

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags:
 *       - Events
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEventRequest'
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       413:
 *         description: Message too large
 *       422:
 *         description: Validation error
 */
router.post('/events', eventController.createEvent.bind(eventController));

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get events for tenant (snapshot/replay)
 *     tags:
 *       - Events
 *     security:
 *       - TenantAuth: []
 *       - UserTokenAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - $ref: '#/components/parameters/UserToken'
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: sinceId
 *         schema:
 *           type: string
 *         description: Return events after this event ID (exclusive)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Maximum number of events to return
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/events', eventController.getEvents.bind(eventController));

export default router;