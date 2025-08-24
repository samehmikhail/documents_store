# Documents Store Frontend

Single-page React + TypeScript UI with three sections:

- Section A: Identity (tenant dropdown + user token) — no network calls; values are included with later actions.
- Section B: New Event Form — placeholder that writes to an in-memory service for now.
- Section C: Real-time Events Table — subscribes to an in-memory stream per-tenant.

## Scripts

- dev: starts Vite dev server
- build: type-checks and builds
- preview: serves the production build locally

## Structure

- src/contexts/IdentityContext.tsx — provides tenant and token
- src/components/IdentityHeader.tsx — Section A UI
- src/components/NewEventForm.tsx — Section B UI (placeholder functionality)
- src/components/EventsTable.tsx — Section C UI (placeholder real-time)
- src/services/eventsService.ts — in-memory events store with pub/sub
- src/App.tsx, src/main.tsx — app shell

## Run locally

1. From the repo root, install dependencies in the frontend folder.
2. Start the dev server.

The app is intentionally independent of the backend for now. Future tasks can replace the in-memory service with API and WebSocket calls.