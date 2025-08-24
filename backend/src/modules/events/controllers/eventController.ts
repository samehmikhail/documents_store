import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../authentication/middleware/authentication';
import { eventBusService } from '../services/eventBus';
import { Config } from '../../../config';

export class EventController {
  /**
   * Create a new event
   */
  async createEvent(req: Request, res: Response): Promise<void> {
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

      // Check message length using environment variable
      if (trimmedMessage.length > Config.EVENTS_MESSAGE_MAX_LENGTH) {
        res.status(413).json({
          success: false,
          message: req.t?.('events:messageTooLarge') || `Message too large (max ${Config.EVENTS_MESSAGE_MAX_LENGTH} characters)`,
          code: 'MESSAGE_TOO_LARGE'
        });
        return;
      }

      // Create and broadcast event using consolidated service method
      const event = await eventBusService.createAndBroadcastEvent(
        authenticatedReq.tenantId,
        trimmedMessage,
        authenticatedReq.user.id
      );

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
  }

  /**
   * Get events for tenant (snapshot/replay)
   */
  async getEvents(req: Request, res: Response): Promise<void> {
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
  }
}

export const eventController = new EventController();