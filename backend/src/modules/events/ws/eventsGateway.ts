import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Config } from '../../../config';
import { tenantStore } from '../../multi-tenant/services/tenantStore';
import { AuthenticationService } from '../../authentication/services/authenticationService';
import { databaseManager } from '../../../database/manager';
import { eventBusService } from '../services/eventBus';
import { Event, EventReplayRequest, EventError } from '../types/event';
import { IEventDeliveryService, setEventDeliveryService } from '../services/eventDelivery';

interface AuthPayload {
  tenantId: string;
  token: string;
}

interface AuthenticatedSocket extends Socket {
  tenantId: string;
  userId: string;
  username: string;
}

class SocketIOEventsGateway implements IEventDeliveryService {
  private io: SocketIOServer | null = null;
  private eventsNamespace: any = null;

  /**
   * Initialize Socket.IO server with existing HTTP server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: Config.ALLOWED_ORIGINS,
        credentials: true,
      },
      pingInterval: Config.SIO_PING_INTERVAL,
      pingTimeout: Config.SIO_PING_TIMEOUT,
    });

    // Create /events namespace
    this.eventsNamespace = this.io.of(Config.SIO_NAMESPACE);

    // Apply authentication middleware
    this.eventsNamespace.use(this.authenticationMiddleware.bind(this));

    // Handle connections
    this.eventsNamespace.on('connection', this.handleConnection.bind(this));

    // Set this instance as the event delivery service
    setEventDeliveryService(this);

    console.log(`🔌 Socket.IO Events Gateway initialized on namespace ${Config.SIO_NAMESPACE}`);
  }

  /**
   * Authentication middleware for Socket.IO connections
   */
  private async authenticationMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const auth = socket.handshake.auth as AuthPayload;
      const { tenantId, token } = auth;

      // Validate tenant and token are provided
      if (!tenantId || !token) {
        const error = new Error('Authentication failed: tenantId and token required');
        (error as any).data = { code: 'AUTH_REQUIRED', message: 'tenantId and token required in auth payload' };
        return next(error);
      }

      // Validate tenant exists
      if (!(await tenantStore.isValidTenant(tenantId))) {
        const error = new Error('Authentication failed: invalid tenant');
        (error as any).data = { code: 'INVALID_TENANT', message: 'Invalid or inactive tenant ID' };
        return next(error);
      }

      // Validate user token
      const database = await databaseManager.getDatabase(tenantId);
      const authService = new AuthenticationService(database);
      const user = await authService.findUserByToken(token);

      if (!user) {
        const error = new Error('Authentication failed: invalid token');
        (error as any).data = { code: 'INVALID_TOKEN', message: 'Invalid or expired token' };
        return next(error);
      }

      // Add authentication info to socket
      (socket as AuthenticatedSocket).tenantId = tenantId;
      (socket as AuthenticatedSocket).userId = user.id;
      (socket as AuthenticatedSocket).username = user.username;

      next();
    } catch (error) {
      console.error('Socket.IO authentication error:', error);
      const authError = new Error('Authentication failed: internal error');
      (authError as any).data = { code: 'INTERNAL_ERROR', message: 'Internal authentication error' };
      next(authError);
    }
  }

  /**
   * Handle new socket connections
   */
  private async handleConnection(socket: Socket): Promise<void> {
    const authSocket = socket as AuthenticatedSocket;
    const roomName = `tenant:${authSocket.tenantId}`;

    // Join tenant room
    await socket.join(roomName);

    // Log connection (without sensitive data)
    console.log(`Socket connected: ${socket.id} - user ${authSocket.username} in tenant ${authSocket.tenantId}`);

    // Send initial snapshot (last 10 events)
    try {
      const snapshot = eventBusService.getLastEvents(authSocket.tenantId, 10);
      socket.emit('snapshot', snapshot);
    } catch (error) {
      console.error('Error sending snapshot:', error);
    }

    // Handle replay requests
    socket.on('replay', this.handleReplay.bind(this, authSocket));

    // Handle post_event requests (optional alternative to REST)
    socket.on('post_event', this.handlePostEvent.bind(this, authSocket));

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} - user ${authSocket.username} in tenant ${authSocket.tenantId} (${reason})`);
    });
  }

  /**
   * Handle replay requests from clients
   */
  private async handleReplay(
    authSocket: AuthenticatedSocket,
    payload: EventReplayRequest,
    callback?: (response: { events: Event[] } | EventError) => void
  ): Promise<void> {
    try {
      const { sinceId, limit } = payload;

      // Validate limit
      const actualLimit = Math.min(limit || 100, 500);

      // Get events
      const events = eventBusService.getEventsSince(authSocket.tenantId, sinceId, actualLimit);

      // Respond via callback or emit
      if (callback) {
        callback({ events });
      } else {
        authSocket.emit('replay_result', { events });
      }
    } catch (error) {
      console.error('Error handling replay:', error);
      const errorResponse: EventError = {
        code: 'REPLAY_ERROR',
        message: 'Failed to retrieve events'
      };

      if (callback) {
        callback(errorResponse);
      } else {
        authSocket.emit('error', errorResponse);
      }
    }
  }

  /**
   * Handle post_event requests via WebSocket (alternative to REST)
   */
  private async handlePostEvent(
    authSocket: AuthenticatedSocket,
    payload: { message: string },
    callback?: (response: { event: Event } | EventError) => void
  ): Promise<void> {
    try {
      const { message } = payload;

      // Validate message
      if (!message || typeof message !== 'string') {
        const error: EventError = { code: 'MESSAGE_REQUIRED', message: 'Message is required' };
        if (callback) callback(error);
        else authSocket.emit('error', error);
        return;
      }

      const trimmedMessage = message.trim();
      if (trimmedMessage.length === 0) {
        const error: EventError = { code: 'MESSAGE_EMPTY', message: 'Message cannot be empty' };
        if (callback) callback(error);
        else authSocket.emit('error', error);
        return;
      }

      if (trimmedMessage.length > Config.EVENTS_MESSAGE_MAX_LENGTH) {
        const error: EventError = { code: 'MESSAGE_TOO_LARGE', message: `Message too large (max ${Config.EVENTS_MESSAGE_MAX_LENGTH} characters)` };
        if (callback) callback(error);
        else authSocket.emit('error', error);
        return;
      }

      // Create and broadcast event using consolidated service method
      const event = await eventBusService.createAndBroadcastEvent(authSocket.tenantId, trimmedMessage, authSocket.username);

      // Respond to sender
      if (callback) {
        callback({ event });
      }

      // Log event creation
      console.log(`Event created via WS: ${event.id} by user ${authSocket.username} for tenant ${authSocket.tenantId}`);
    } catch (error) {
      console.error('Error handling post_event:', error);
      const errorResponse: EventError = {
        code: 'POST_EVENT_ERROR',
        message: 'Failed to create event'
      };

      if (callback) {
        callback(errorResponse);
      } else {
        authSocket.emit('error', errorResponse);
      }
    }
  }

  /**
   * Broadcast event to tenant room (implements IEventDeliveryService)
   */
  async broadcastEventCreated(event: Event): Promise<void> {
    if (!this.eventsNamespace) {
      console.warn('Events namespace not initialized');
      return;
    }

    const roomName = `tenant:${event.tenant_id}`;
    this.eventsNamespace.to(roomName).emit('event_created', event);
  }

  /**
   * Get Socket.IO server instance (for potential external use)
   */
  getSocketIOServer(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Shutdown the gateway
   */
  shutdown(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.eventsNamespace = null;
      console.log('🔌 Socket.IO Events Gateway shutdown');
    }
  }
}

export const eventsGateway = new SocketIOEventsGateway();