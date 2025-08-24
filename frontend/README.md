# Documents Store Frontend

React + TypeScript (Vite) SPA that connects to the backend REST API and real-time events via Socket.IO.

## Features
- Identity header to select Tenant and provide Token
- Publish new events and see real-time updates per-tenant
- Configurable backend URL via Vite environment variables

## Scripts
- dev: starts Vite dev server
- build: type-checks and builds
- preview: serves the production build locally

## Structure
- src/contexts/IdentityContext.tsx — provides tenant and token
- src/components/IdentityHeader.tsx — identity UI
- src/components/NewEventForm.tsx — create an event
- src/components/EventsTable.tsx — real-time events table
- src/services/eventsService.ts — WebSocket client (uses VITE_BACKEND_URL and /events namespace)
- src/services/seedConfig.ts — loads optional seed data path
- src/App.tsx, src/main.tsx — app shell

## Environment Variables (Vite)
- VITE_BACKEND_URL: Backend base URL for REST and WebSocket (default: http://localhost:3000)
- VITE_SEED_DATA_PATH: Path to seed data served by backend (default: /seed/seedData.json)

Create a .env file in the frontend folder if you need to override defaults, e.g.:
```
VITE_BACKEND_URL=http://localhost:3000
VITE_SEED_DATA_PATH=/seed/seedData.json
```

## Run locally
1. From repo root, start the backend first:
   - npm --prefix backend run dev
2. Start the frontend dev server:
   - npm --prefix frontend run dev
3. Open http://localhost:5173

Notes
- Ensure the backend CORS (NB_BACKEND_ALLOWED_ORIGINS) includes http://localhost:5173
- WebSocket connects to `${VITE_BACKEND_URL}/events` with auth { tenantId, token }