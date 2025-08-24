import { Event } from '../types/event';
import { Config } from '../../../config';
import { v4 as uuidv4 } from 'uuid';

export class EventBusService {
  private eventsByTenant: Map<string, Event[]> = new Map();
  private readonly bufferSize: number;

  constructor() {
    this.bufferSize = Config.EVENTS_BUFFER_SIZE;
  }

  /**
   * Append event to tenant's ring buffer and trim if needed
   */
  appendEvent(tenantId: string, message: string, authorId?: string): Event {
    const event: Event = {
      id: uuidv4(),
      tenant_id: tenantId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      author_id: authorId
    };

    let tenantEvents = this.eventsByTenant.get(tenantId);
    if (!tenantEvents) {
      tenantEvents = [];
      this.eventsByTenant.set(tenantId, tenantEvents);
    }

    tenantEvents.push(event);

    // Ring buffer trim - keep only latest events
    if (tenantEvents.length > this.bufferSize) {
      tenantEvents.splice(0, tenantEvents.length - this.bufferSize);
    }

    return event;
  }

  /**
   * Get events for tenant since a specific event ID (exclusive)
   * If sinceId is not provided, returns the last N events
   */
  getEventsSince(tenantId: string, sinceId?: string, limit?: number): Event[] {
    const tenantEvents = this.eventsByTenant.get(tenantId) || [];
    
    if (!sinceId) {
      // Return last N events if no sinceId provided
      const actualLimit = Math.min(limit || this.bufferSize, this.bufferSize);
      return tenantEvents.slice(-actualLimit);
    }

    // Find index of sinceId event
    const sinceIndex = tenantEvents.findIndex(event => event.id === sinceId);
    if (sinceIndex === -1) {
      // sinceId not found, return empty array to avoid confusion
      return [];
    }

    // Return events after sinceId (exclusive)
    const eventsAfter = tenantEvents.slice(sinceIndex + 1);
    const actualLimit = Math.min(limit || eventsAfter.length, this.bufferSize);
    
    return eventsAfter.slice(0, actualLimit);
  }

  /**
   * Get the last N events for a tenant (for initial snapshot)
   */
  getLastEvents(tenantId: string, count: number = 10): Event[] {
    const tenantEvents = this.eventsByTenant.get(tenantId) || [];
    const actualCount = Math.min(count, tenantEvents.length);
    return tenantEvents.slice(-actualCount);
  }

  /**
   * Get total events count for a tenant (for debugging/monitoring)
   */
  getTenantEventCount(tenantId: string): number {
    return this.eventsByTenant.get(tenantId)?.length || 0;
  }

  /**
   * Clear events for a tenant (for testing/cleanup)
   */
  clearTenantEvents(tenantId: string): void {
    this.eventsByTenant.delete(tenantId);
  }
}

// Singleton instance
export const eventBusService = new EventBusService();