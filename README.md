# Documents Store (Full Stack)

Multi-tenant documents management platform consisting of:
- Backend: Node.js + Express 5 + TypeScript API with per-tenant SQLite, file uploads, localization, Swagger, and real-time events via Socket.IO.
- Frontend: React + TypeScript app (Vite) that interacts with the backend REST API and WebSocket namespace.

## Quick Start

Prerequisites
- Node.js >= 18
- npm >= 9

Install dependencies
- npm install

Environment
- Copy backend/.env and adjust values (see Backend Environment below).
- Optionally create frontend/.env (see Frontend Environment below).

Run in development
- Backend: npm --prefix backend run dev (http://localhost:3000 by default)
- Frontend: npm --prefix frontend run dev (http://localhost:5173 by default)
- API docs: http://localhost:3000/api-docs

Build
- Backend: npm --prefix backend run build
- Frontend: npm --prefix frontend run build

## Project Structure
- backend/ — API service
- frontend/ — React app (Vite)
- shared/ — shared assets (e.g., seed data)

## Backend Overview

Key features
- Multi-tenant pipeline (header X-TENANT-ID) and per-tenant SQLite DB files
- Authentication via X-User-Token stored in tenant DB
- Documents CRUD with file upload/download (UUID filenames, original name preserved)
- Localization (en, es, fr), Swagger docs at /api-docs
- Real-time events via Socket.IO with strict tenant isolation

Important headers
- X-TENANT-ID: tenant identifier (required)
- X-User-Token: user token (required)
- Accept-Language: en | es | fr (optional)

## Frontend Overview

- Vite dev server (default http://localhost:5173)
- Uses WebSocket to subscribe to backend events
- Identity header in UI: set Tenant and Token which are used for API/WS calls

## Environment Variables

Backend (NB_BACKEND_*)
- NB_BACKEND_PORT: HTTP port (default: 3000)
- NB_BACKEND_NODE_ENV: Node environment (default: development)
- NB_BACKEND_ALLOWED_ORIGINS: Comma-separated CORS origins. Use http://localhost:5173 for Vite.
- NB_BACKEND_UPLOAD_PATH: Directory for uploaded files (default: ./data/uploads)
- NB_BACKEND_MAX_FILE_SIZE: Max upload size in bytes (default: 10485760)
- NB_BACKEND_MAX_UPLOAD_FILES: Max files per multipart upload (default: 10)
- NB_BACKEND_DEFAULT_LOCALE: Default locale (default: en)
- NB_BACKEND_SUPPORTED_LOCALES: Comma-separated list (default: en,es,fr)
- NB_BACKEND_DB_DIRECTORY: Per-tenant DB files directory (default: ./data/databases)
- NB_BACKEND_SEED_DATA_PATH: Path to shared seed JSON (default: ../shared/seed/seedData.json)
- NB_BACKEND_SIO_NAMESPACE: Socket.IO namespace (default: /events)
- NB_BACKEND_EVENTS_BUFFER_SIZE: Ring buffer size per tenant (default: 500)
- NB_BACKEND_EVENTS_MESSAGE_MAX_LENGTH: Max event message length (default: 2048)
- NB_BACKEND_SIO_PING_INTERVAL: Socket.IO ping interval ms (default: 25000)
- NB_BACKEND_SIO_PING_TIMEOUT: Socket.IO ping timeout ms (default: 20000)

Frontend (Vite)
- VITE_BACKEND_URL: Backend base URL for REST/WS (default: http://localhost:3000)
- VITE_SEED_DATA_PATH: Path to seed data served by backend (default: /seed/seedData.json)

## How to Run End-to-End (local)
1) Backend
- cd backend
- cp .env .env.local (optional) and adjust; ensure NB_BACKEND_ALLOWED_ORIGINS includes http://localhost:5173
- npm run dev

2) Frontend
- cd frontend
- create .env with VITE_BACKEND_URL=http://localhost:3000 (optional)
- npm run dev

3) Try it
- Open API docs: http://localhost:3000/api-docs
- Open frontend app: http://localhost:5173

## Notes
- Each tenant has its own SQLite DB file at {NB_BACKEND_DB_DIRECTORY}/{tenant}.db
- File uploads are stored under NB_BACKEND_UPLOAD_PATH with UUID-based filenames
- WebSocket events are under namespace NB_BACKEND_SIO_NAMESPACE (default /events) and require auth { tenantId, token }
