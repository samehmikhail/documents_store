import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../authentication/middleware/authentication';
import { eventBusService } from '../services/eventBus';
import { eventDeliveryService } from '../services/eventDelivery';

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
router.post('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string') {
      res.status(422).json({
        success: false,
        message: req.t?.('events:messageRequired') || 'Message is required',
        code: 'MESSAGE_REQUIRED'
      });
      return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      res.status(422).json({
        success: false,
        message: req.t?.('events:messageEmpty') || 'Message cannot be empty',
        code: 'MESSAGE_EMPTY'
      });
      return;
    }

    // Check message length (2KB limit)
    if (trimmedMessage.length > 2048) {
      res.status(413).json({
        success: false,
        message: req.t?.('events:messageTooLarge') || 'Message too large (max 2048 characters)',
        code: 'MESSAGE_TOO_LARGE'
      });
      return;
    }

    // Create event
    const event = eventBusService.appendEvent(
      authenticatedReq.tenantId,
      trimmedMessage,
      authenticatedReq.user.id
    );

    // Broadcast to tenant room via Socket.IO
    await eventDeliveryService.broadcastEventCreated(event);

    // Log event creation (without sensitive data)
    console.log(`Event created: ${event.id} by user ${authenticatedReq.user.username} for tenant ${authenticatedReq.tenantId}`);

    res.status(201).json({
      success: true,
      message: req.t?.('events:eventCreated') || 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: req.t?.('server.error') || 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get events for tenant (snapshot/replay)
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
router.get('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { sinceId, limit } = req.query;

    // Validate limit parameter
    let actualLimit = 100; // default
    if (limit) {
      const parsedLimit = parseInt(limit as string, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        res.status(400).json({
          success: false,
          message: req.t?.('events:invalidLimit') || 'Invalid limit parameter',
          code: 'INVALID_LIMIT'
        });
        return;
      }
      actualLimit = Math.min(parsedLimit, 500); // cap at 500
    }

    // Get events
    const events = eventBusService.getEventsSince(
      authenticatedReq.tenantId,
      sinceId as string,
      actualLimit
    );

    res.json({
      success: true,
      message: req.t?.('events:eventsRetrieved') || 'Events retrieved successfully',
      data: events
    });
  } catch (error) {
    console.error('Error retrieving events:', error);
    res.status(500).json({
      success: false,
      message: req.t?.('server.error') || 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;