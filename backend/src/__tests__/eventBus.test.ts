import { EventBusService } from '../modules/events/services/eventBus';

describe('EventBusService', () => {
  let eventBus: EventBusService;

  beforeEach(() => {
    eventBus = new EventBusService();
  });

  describe('appendEvent', () => {
    it('should create and append event with UUID and timestamp', () => {
      const tenantId = 'test-tenant';
      const message = 'Test message';
      const authorName = 'alice';

      const event = eventBus.appendEvent(tenantId, message, authorName);

      expect(event.id).toBeDefined();
      expect(event.tenant_id).toBe(tenantId);
      expect(event.message).toBe(message);
      expect(event.author).toBe(authorName);
      expect(event.timestamp).toBeDefined();
      expect(new Date(event.timestamp)).toBeInstanceOf(Date);
    });

    it('should trim message content', () => {
      const tenantId = 'test-tenant';
      const message = '  Test message with spaces  ';

      const event = eventBus.appendEvent(tenantId, message);

      expect(event.message).toBe('Test message with spaces');
    });

    it('should maintain ring buffer size limit', () => {
      const tenantId = 'test-tenant';
      const bufferSize = 3;
      
      // Create a smaller buffer for testing
      const smallEventBus = new EventBusService();
      (smallEventBus as any).bufferSize = bufferSize;

      // Add more events than buffer size
      for (let i = 1; i <= 5; i++) {
        smallEventBus.appendEvent(tenantId, `Message ${i}`);
      }

      const events = smallEventBus.getLastEvents(tenantId, 10);
      expect(events).toHaveLength(bufferSize);
      expect(events[0]?.message).toBe('Message 3');
      expect(events[2]?.message).toBe('Message 5');
    });
  });

  describe('getEventsSince', () => {
    beforeEach(() => {
      const tenantId = 'test-tenant';
      // Add some test events
      eventBus.appendEvent(tenantId, 'Event 1');
      eventBus.appendEvent(tenantId, 'Event 2');
      eventBus.appendEvent(tenantId, 'Event 3');
    });

    it('should return all events when no sinceId provided', () => {
      const events = eventBus.getEventsSince('test-tenant');
      expect(events).toHaveLength(3);
    });

    it('should return limited events when limit provided', () => {
      const events = eventBus.getEventsSince('test-tenant', undefined, 2);
      expect(events).toHaveLength(2);
    });

    it('should return events after sinceId (exclusive)', () => {
      const allEvents = eventBus.getLastEvents('test-tenant', 10);
      const sinceId = allEvents[0]?.id; // First event ID

      const events = eventBus.getEventsSince('test-tenant', sinceId);
      expect(events).toHaveLength(2);
      expect(events[0]?.message).toBe('Event 2');
      expect(events[1]?.message).toBe('Event 3');
    });

    it('should return empty array for non-existent sinceId', () => {
      const events = eventBus.getEventsSince('test-tenant', 'non-existent-id');
      expect(events).toHaveLength(0);
    });

    it('should return empty array for non-existent tenant', () => {
      const events = eventBus.getEventsSince('non-existent-tenant');
      expect(events).toHaveLength(0);
    });
  });

  describe('getLastEvents', () => {
    beforeEach(() => {
      const tenantId = 'test-tenant';
      for (let i = 1; i <= 5; i++) {
        eventBus.appendEvent(tenantId, `Event ${i}`);
      }
    });

    it('should return last N events', () => {
      const events = eventBus.getLastEvents('test-tenant', 3);
      expect(events).toHaveLength(3);
      expect(events[0]?.message).toBe('Event 3');
      expect(events[2]?.message).toBe('Event 5');
    });

    it('should return all events if count exceeds available', () => {
      const events = eventBus.getLastEvents('test-tenant', 10);
      expect(events).toHaveLength(5);
    });

    it('should return empty array for non-existent tenant', () => {
      const events = eventBus.getLastEvents('non-existent-tenant', 10);
      expect(events).toHaveLength(0);
    });
  });

  describe('tenant isolation', () => {
    it('should isolate events between tenants', () => {
      eventBus.appendEvent('tenant-a', 'Message for A');
      eventBus.appendEvent('tenant-b', 'Message for B');
      eventBus.appendEvent('tenant-a', 'Another message for A');

      const eventsA = eventBus.getLastEvents('tenant-a', 10);
      const eventsB = eventBus.getLastEvents('tenant-b', 10);

      expect(eventsA).toHaveLength(2);
      expect(eventsB).toHaveLength(1);
      expect(eventsA[0]?.message).toBe('Message for A');
      expect(eventsB[0]?.message).toBe('Message for B');
    });
  });

  describe('createAndBroadcastEvent', () => {
    it('should create event and call broadcast service', async () => {
      const tenantId = 'test-tenant';
      const message = 'Test broadcast message';
      const authorName = 'alice';

      // Mock the event delivery service to verify broadcast is called
      const mockBroadcast = jest.fn().mockResolvedValue(undefined);
      const originalEventDeliveryService = require('../modules/events/services/eventDelivery').eventDeliveryService;
      
      // Replace with mock
      require('../modules/events/services/eventDelivery').eventDeliveryService = {
        broadcastEventCreated: mockBroadcast
      };

      const event = await eventBus.createAndBroadcastEvent(tenantId, message, authorName);

      expect(event.id).toBeDefined();
      expect(event.tenant_id).toBe(tenantId);
      expect(event.message).toBe(message);
      expect(event.author).toBe(authorName);
      expect(mockBroadcast).toHaveBeenCalledWith(event);

      // Restore original
      require('../modules/events/services/eventDelivery').eventDeliveryService = originalEventDeliveryService;
    });
  });

  describe('utility functions', () => {
    it('should return correct tenant event count', () => {
      eventBus.appendEvent('test-tenant', 'Event 1');
      eventBus.appendEvent('test-tenant', 'Event 2');

      expect(eventBus.getTenantEventCount('test-tenant')).toBe(2);
      expect(eventBus.getTenantEventCount('non-existent')).toBe(0);
    });

    it('should clear tenant events', () => {
      eventBus.appendEvent('test-tenant', 'Event 1');
      expect(eventBus.getTenantEventCount('test-tenant')).toBe(1);

      eventBus.clearTenantEvents('test-tenant');
      expect(eventBus.getTenantEventCount('test-tenant')).toBe(0);
    });
  });
});