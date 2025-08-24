import { Event } from '../types/event';

/**
 * Abstract event delivery service to hide Socket.IO complexity from business layer
 * This service will be implemented by the Socket.IO gateway
 */
export interface IEventDeliveryService {
  broadcastEventCreated(event: Event): Promise<void>;
}

/**
 * Default implementation (no-op) that will be replaced by Socket.IO implementation
 */
class DefaultEventDeliveryService implements IEventDeliveryService {
  async broadcastEventCreated(event: Event): Promise<void> {
    // No-op implementation for when Socket.IO is not initialized
    console.log(`Event delivery not initialized: ${event.id}`);
  }
}

// Singleton instance that will be replaced by Socket.IO implementation
export let eventDeliveryService: IEventDeliveryService = new DefaultEventDeliveryService();

/**
 * Set the event delivery service implementation (used by Socket.IO gateway)
 */
export function setEventDeliveryService(service: IEventDeliveryService): void {
  eventDeliveryService = service;
}