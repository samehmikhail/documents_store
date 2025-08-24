# Real-Time Multi-Tenant Event Feed

This module implements a real-time event broadcasting system using Socket.IO 4.x with strict multi-tenant isolation.

## Overview

The event system provides:
- **In-memory event storage** with configurable ring buffer per tenant
- **REST API endpoints** for creating and retrieving events
- **Real-time WebSocket broadcasting** via Socket.IO
- **Strict tenant isolation** using Socket.IO rooms
- **Cursor-based replay** for historical events
- **Full authentication** and authorization integration

## Architecture

### Components

1. **EventBusService** (`services/eventBus.ts`)
   - In-memory ring buffer storage per tenant
   - Event creation and retrieval logic
   - Tenant isolation guarantees

2. **EventDeliveryService** (`services/eventDelivery.ts`)
   - Abstraction layer for real-time broadcasting
   - Hides Socket.IO complexity from business logic

3. **EventsGateway** (`ws/eventsGateway.ts`)
   - Socket.IO server integration
   - Authentication middleware for WebSocket connections
   - Room-based tenant isolation
   - Event broadcasting to tenant rooms

4. **REST Routes** (`routes/events.ts`)
   - HTTP endpoints for event operations
   - Request validation and error handling
   - Integration with existing auth middleware

### Data Model

```typescript
interface Event {
  id: string;         // UUID v4 
  tenant_id: string;  // Tenant identifier
  message: string;    // Event content (max 2048 chars)
  timestamp: string;  // ISO 8601 server timestamp
  author?: string;    // Username who created the event
}
```

## API Endpoints

### REST API

#### Create Event
```http
POST /api/events
Headers:
  X-TENANT-ID: company_a
  X-User-Token: your_token
  Content-Type: application/json

Body:
{
  "message": "Your event message here"
}
```

#### Get Events (Snapshot/Replay)
```http
GET /api/events?sinceId=<event_id>&limit=100
Headers:
  X-TENANT-ID: company_a
  X-User-Token: your_token
```

### WebSocket API

#### Connect to Events Namespace
```javascript
const socket = io('http://localhost:3000/events', {
  auth: {
    tenantId: 'company_a',
    token: 'your_token'
  }
});
```

#### Server to Client Events
- `snapshot` - Initial events on connection
- `event_created` - Real-time event broadcasts
- `replay_result` - Response to replay requests
- `error` - Error notifications

#### Client to Server Events
- `replay` - Request historical events
- `post_event` - Create event via WebSocket

## Configuration

Environment variables:

```bash
# Socket.IO Configuration
NB_BACKEND_SIO_NAMESPACE=/events          # WebSocket namespace
NB_BACKEND_EVENTS_BUFFER_SIZE=500         # Ring buffer size per tenant
NB_BACKEND_SIO_PING_INTERVAL=25000        # WebSocket ping interval (ms)
NB_BACKEND_SIO_PING_TIMEOUT=20000         # WebSocket ping timeout (ms)
```

## Tenant Isolation

The system enforces strict tenant isolation through:

1. **WebSocket Rooms**: Each tenant has a dedicated room `tenant:{tenantId}`
2. **Authentication**: Both REST and WebSocket validate tenant access
3. **Data Separation**: Events are stored per tenant with no cross-tenant access
4. **Broadcasting**: Events are only sent to clients in the same tenant room

## Usage Examples

### REST API
```bash
# Create an event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "X-TENANT-ID: company_a" \
  -H "X-User-Token: token_admin_a" \
  -d '{"message": "User logged in"}'

# Get recent events
curl -X GET http://localhost:3000/api/events?limit=10 \
  -H "X-TENANT-ID: company_a" \
  -H "X-User-Token: token_admin_a"

# Get events since specific ID
curl -X GET "http://localhost:3000/api/events?sinceId=123&limit=50" \
  -H "X-TENANT-ID: company_a" \
  -H "X-User-Token: token_admin_a"
```

### JavaScript Client
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/events', {
  auth: {
    tenantId: 'company_a',
    token: 'token_admin_a'
  }
});

// Listen for real-time events
socket.on('event_created', (event) => {
  console.log('New event:', event.message);
});

// Get initial snapshot
socket.on('snapshot', (events) => {
  console.log('Initial events:', events.length);
});

// Request replay
socket.emit('replay', { sinceId: 'some-event-id', limit: 10 }, (response) => {
  console.log('Historical events:', response.events);
});

// Create event via WebSocket
socket.emit('post_event', { message: 'Hello World' }, (response) => {
  if (response.event) {
    console.log('Event created:', response.event.id);
  }
});
```

## Error Handling

The system provides comprehensive error handling:

### REST API Errors
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid tenant/token)
- `413` - Message too large (>2048 characters)
- `422` - Validation error (empty message, etc.)
- `500` - Internal server error

### WebSocket Errors
- `connect_error` - Authentication failures
- `error` event - Operation errors with code and message

## Testing

Run the test suite:
```bash
# Unit tests for event bus
npm test -- src/__tests__/eventBus.test.ts

# Integration tests for Socket.IO
npm test -- src/__tests__/eventsSocketIO.test.ts

# Run demo script
npx ts-node demo/socket-demo.ts
```

## Performance Considerations

- **Memory Usage**: Ring buffer prevents unlimited memory growth
- **Tenant Isolation**: Per-tenant storage with configurable limits
- **Broadcast Efficiency**: Socket.IO rooms ensure targeted delivery
- **Replay Performance**: Cursor-based pagination for large histories

## Security Features

- **Authentication**: Required for all operations (REST and WebSocket)
- **Authorization**: Tenant-based access control
- **Input Validation**: Message size limits and content sanitization
- **Rate Limiting**: Configurable limits per tenant/user
- **Audit Logging**: All operations logged without sensitive data

## Scaling Considerations

For horizontal scaling, the system can be extended with:
- **Redis Adapter**: For multi-instance Socket.IO scaling
- **External Storage**: Replace in-memory buffers with Redis/Database
- **Message Queues**: For guaranteed delivery across instances

See the main issue description for detailed scaling plans with Redis adapter.