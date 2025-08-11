# Documents Store Backend

Multi-tenant documents management API built with Node.js, Express 5 and TypeScript. It supports per-tenant SQLite databases, file uploads to the local filesystem with UUID-based file naming, role-based access to documents, localization, and Swagger docs.

## What’s Implemented

- Multi-tenant request pipeline with tenant validation and per-tenant databases
- User authentication via X-User-Token header (token stored in tenant DB)
- Documents module with CRUD, file upload/download, visibility (tenant/private)
- Filesystem-backed storage with UUID file naming and original name preservation
- Localization (en, es, fr) and Swagger/OpenAPI documentation
- Security middleware (Helmet, CORS) and structured logging (morgan)

## How to Run

Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

Steps
1. Install dependencies
   - npm install
2. Configure environment variables
   - Copy or create backend/.env and adjust values (see Environment Variables below)
3. Start in development
   - npm run dev
   - Server runs on http://localhost:3000 (configurable)
4. Open API docs
   - http://localhost:3000/api-docs

Optional
- Build: npm run build
- Tests: npm test
- Start production: npm start

## Request Pipeline and Key Headers

All API routes are mounted under /api and protected by tenant and user authentication middleware.
- Tenant header: X-TENANT-ID (required)
- User token header: X-User-Token (required)
- Optional localization header: Accept-Language: en | es | fr

Example Health Check
- curl -H "X-TENANT-ID: tenant-a" -H "X-User-Token: <token>" http://localhost:3000/api/health

## Folder Structure (Backend)

```
src/
├── app.ts                # Express app wiring and middleware order
├── config/               # Env config, localization, swagger
│   ├── index.ts          # Config (NB_BACKEND_* envs)
│   ├── localization.ts   # i18n setup and middleware
│   └── swagger.ts        # OpenAPI/Swagger spec
├── database/             # DB abstraction and per-tenant manager
│   ├── interfaces.ts     # IDatabase and repository interfaces
│   ├── manager.ts        # DatabaseManager (per-tenant SQLite, schema init)
│   └── sqlite.ts         # SQLite implementation (sqlite3)
├── modules/
│   ├── authentication/   # Token auth middleware and services
│   ├── data-seed/        # Seed service for test data
│   ├── documents/        # Documents domain (controllers, repo, routes, storage)
│   └── multi-tenant/     # Tenant middleware and discovery (tenantStore)
├── routes/               # API routes entry (health + modules)
└── uploads/              # Local file storage (NB_BACKEND_UPLOAD_PATH)
```

## Multi-tenant Support (How it works)

- Tenants are identified by the X-TENANT-ID request header.
- The tenant middleware validates the tenant by checking that a SQLite file exists at {NB_BACKEND_DB_DIRECTORY}/{tenantId}.db.
- Each tenant has its own isolated SQLite database file. There is no cross-tenant data access in queries because the app opens a DB connection scoped to the current tenantId.
- Database connections are managed by DatabaseManager which lazily creates/initializes the per-tenant DB schema on first access.

Related code
- src/modules/multi-tenant/middleware/tenant.ts
- src/modules/multi-tenant/services/tenantStore.ts
- src/database/manager.ts

## Documents File Storage (and file name handling)

- Uploads are handled via multer with in-memory storage, then persisted to disk using FilesystemStorage.
- When a file is saved, a UUID is generated and used as the stored filename, preserving the original file extension: {fileUuid}.{ext}.
- The original file name provided by the client (file.originalname) is stored in the DB (documents.file_name) and is used when downloading (Content-Disposition uses the original name).
- Files are stored under NB_BACKEND_UPLOAD_PATH (default: ./src/uploads). Retrieval resolves the file by UUID by scanning the storage directory for a filename prefixed by the UUID.
- Associated metadata stored in DB: file_uuid, file_name, file_path, file_size, mime_type.
- On document deletion, the stored file (if any) is removed from the filesystem.

Related code
- src/modules/documents/services/filesystemStorage.ts
- src/modules/documents/controllers/documentController.ts
- src/modules/documents/repositories/documentRepository.ts

## Usage of the Database

- Engine: SQLite via sqlite3 node module.
- Isolation: One DB file per tenant in NB_BACKEND_DB_DIRECTORY (default: ./databases), file name {tenantId}.db.
- Access: DatabaseManager returns an IDatabase connection for the current tenant based on X-TENANT-ID.
- Schema (auto-initialized per tenant):
  - documents: id, name, content, owner_id, visibility ('tenant' | 'private'), file_* fields, created_at, updated_at.
  - users: id, username (unique), role ('admin' | 'user').
  - tokens: id, token (unique), user_id (1:1), foreign key to users.
- Indexes are created for common lookups (owner, visibility, file_uuid, username, token).

Typical flow
- Authentication middleware loads user from tokens table by X-User-Token within the tenant DB.
- DocumentsRepository runs SQL only against the tenant’s DB. Admin users see all docs; regular users see tenant-level docs plus their own private docs.

Related code
- src/database/manager.ts, src/database/sqlite.ts, src/database/interfaces.ts
- src/modules/authentication/middleware/authentication.ts
- src/modules/documents/repositories/documentRepository.ts

## API Overview (Documents)

Base path: /api (requires headers X-TENANT-ID and X-User-Token)
- GET /api/documents — list documents by access level
- GET /api/documents/{id} — get a document (access controlled)
- POST /api/documents/upload — upload a file or create a text document (multipart/form-data)
  - fields: file (binary, optional), name (string, required), content (string, optional), visibility ('tenant'|'private', default 'private')
- GET /api/documents/{id}/download — download the file (uses original filename)
- PUT /api/documents/{id} — update name/content/visibility
- DELETE /api/documents/{id} — delete document (and physical file if present)

Explore full schema and examples in Swagger UI at /api-docs.

## Multi-locale Support

You can set the response language via Accept-Language header or ?locale=<code> query.
Supported: en (default), es, fr.

## Environment Variables

All variables are prefixed with NB_BACKEND_. A sample .env is included under backend/.env.
- NB_BACKEND_PORT: Server port (default: 3000)
- NB_BACKEND_NODE_ENV: Node environment (development, production, ...)
- NB_BACKEND_ALLOWED_ORIGINS: Comma-separated list of CORS origins
- NB_BACKEND_UPLOAD_PATH: Directory for file storage (default: ./src/uploads)
- NB_BACKEND_MAX_FILE_SIZE: Max upload size in bytes (default: 10485760)
- NB_BACKEND_MAX_UPLOAD_FILES: Max number of files for multi-upload (default: 10)
- NB_BACKEND_DEFAULT_LOCALE: Default locale (default: en)
- NB_BACKEND_SUPPORTED_LOCALES: Comma-separated list (default: en,es,fr)
- NB_BACKEND_DB_DIRECTORY: Directory where tenant DB files are stored (default: ./databases)

## Scripts
- npm run dev — Start development server with hot reload
- npm run build — Build TypeScript to JavaScript
- npm start — Start production server
- npm test — Run test suite
- npm run lint — Run ESLint
- npm run lint:fix — Fix ESLint issues

## Examples

1) Create a text document
- curl -X POST http://localhost:3000/api/documents/upload \
  -H "X-TENANT-ID: tenant-a" -H "X-User-Token: <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "name=My Text Doc" -F "content=Hello world" -F "visibility=tenant"

2) Upload a file
- curl -X POST http://localhost:3000/api/documents/upload \
  -H "X-TENANT-ID: tenant-a" -H "X-User-Token: <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/file.pdf" -F "name=Proposal" -F "visibility=private"

3) Download a file
- curl -L -O -J http://localhost:3000/api/documents/<id>/download \
  -H "X-TENANT-ID: tenant-a" -H "X-User-Token: <token>"

## Production Deployment
1. Build: npm run build
2. Set production env vars (.env or environment)
3. Start: npm start

Artifacts are emitted to dist/.