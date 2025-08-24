import { io, Socket } from 'socket.io-client';
import { Event } from '../modules/events/types/event';

describe('Events Socket.IO Integration', () => {
  let client: Socket;
  const serverUrl = 'http://localhost:3000';
  const namespace = '/events';

  beforeAll((done) => {
    // Give server time to start if needed
    setTimeout(done, 1000);
  });

  afterEach(() => {
    if (client && client.connected) {
      client.disconnect();
    }
  });

  describe('Authentication', () => {
    it('should reject connection without auth', (done) => {
      client = io(`${serverUrl}${namespace}`, {
        autoConnect: false
      });

      client.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });

      client.connect();
    });

    it('should reject connection with invalid tenant', (done) => {
      client = io(`${serverUrl}${namespace}`, {
        auth: {
          tenantId: 'invalid-tenant',
          token: 'token_admin_a'
        },
        autoConnect: false
      });

      client.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });

      client.connect();
    });

    it('should reject connection with invalid token', (done) => {
      client = io(`${serverUrl}${namespace}`, {
        auth: {
          tenantId: 'company_a',
          token: 'invalid-token'
        },
        autoConnect: false
      });

      client.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });

      client.connect();
    });

    it('should accept connection with valid credentials', (done) => {
      client = io(`${serverUrl}${namespace}`, {
        auth: {
          tenantId: 'company_a',
          token: 'token_admin_a'
        },
        autoConnect: false
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        done();
      });

      client.on('connect_error', (error) => {
        done(error);
      });

      client.connect();
    });
  });

  describe('Event Broadcasting', () => {
    it('should receive snapshot on connection', (done) => {
      client = io(`${serverUrl}${namespace}`, {
        auth: {
          tenantId: 'company_a',
          token: 'token_admin_a'
        },
        autoConnect: false
      });

      client.on('snapshot', (events: Event[]) => {
        expect(Array.isArray(events)).toBe(true);
        done();
      });

      client.on('connect_error', (error) => {
        done(error);
      });

      client.connect();
    });

    it('should receive event_created when event is posted via REST', (done) => {
      client = io(`${serverUrl}${namespace}`, {
        auth: {
          tenantId: 'company_a',
          token: 'token_admin_a'
        },
        autoConnect: false
      });

      let eventReceived = false;

      client.on('event_created', (event: Event) => {
        expect(event.message).toBe('WebSocket test message');
        expect(event.tenant_id).toBe('company_a');
        eventReceived = true;
        done();
      });

      client.on('connect', async () => {
        // Wait a bit then create event via REST
        setTimeout(async () => {
          try {
            const fetch = (await import('node-fetch')).default;
            await fetch('http://localhost:3000/api/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-TENANT-ID': 'company_a',
                'X-User-Token': 'token_admin_a'
              },
              body: JSON.stringify({ message: 'WebSocket test message' })
            });
          } catch (error) {
            if (!eventReceived) {
              done(error);
            }
          }
        }, 100);
      });

      client.on('connect_error', (error) => {
        done(error);
      });

      client.connect();
    }, 10000);
  });

  describe('Replay Functionality', () => {
    it('should handle replay request', (done) => {
      client = io(`${serverUrl}${namespace}`, {
        auth: {
          tenantId: 'company_a',
          token: 'token_admin_a'
        },
        autoConnect: false
      });

      client.on('connect', () => {
        client.emit('replay', { limit: 5 }, (response: { events: Event[] }) => {
          expect(Array.isArray(response.events)).toBe(true);
          done();
        });
      });

      client.on('connect_error', (error) => {
        done(error);
      });

      client.connect();
    });
  });

  describe('Tenant Isolation', () => {
    it('should not receive events from other tenants', (done) => {
      const clientA = io(`${serverUrl}${namespace}`, {
        auth: {
          tenantId: 'company_a',
          token: 'token_admin_a'
        },
        autoConnect: false
      });

      let eventReceived = false;

      clientA.on('event_created', (event: Event) => {
        // Should not receive events from company_b
        if (event.tenant_id === 'company_b') {
          eventReceived = true;
          done(new Error('Received event from wrong tenant'));
        }
      });

      clientA.on('connect', async () => {
        // Wait then create event for company_b
        setTimeout(async () => {
          try {
            const fetch = (await import('node-fetch')).default;
            await fetch('http://localhost:3000/api/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-TENANT-ID': 'company_b',
                'X-User-Token': 'token_admin_b'
              },
              body: JSON.stringify({ message: 'Event for company B' })
            });
            
            // Wait a bit more and if no event was received from company_b, test passes
            setTimeout(() => {
              if (!eventReceived) {
                clientA.disconnect();
                done();
              }
            }, 500);
          } catch (error) {
            done(error);
          }
        }, 100);
      });

      clientA.on('connect_error', (error) => {
        done(error);
      });

      clientA.connect();
    }, 10000);
  });
});