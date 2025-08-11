# Documents Store Backend

A Node.js/Express REST API service with localization middleware and Swagger documentation.

## Features

- **Express 5.1.0** - Modern Express framework
- **TypeScript** - Type-safe development
- **Localization Middleware** - English, Spanish, French
- **Swagger Documentation** - Interactive API documentation
- **CORS & Helmet** - Basic security and CORS protection

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables (an example .env is provided in this folder)
# You can edit ./.env or create it if missing

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Development

The development server starts on `http://localhost:3000` (configurable via .env) with:

- API routes mounted at `/api/*`
- Swagger documentation at `/api-docs`
- Health check at `/api/health`
- Root endpoint at `/` returning a localized welcome message


## API Endpoints

- `GET /` - Root endpoint with localized welcome message
- `GET /api/health` - Health check
- `GET /api-docs` - Swagger UI documentation

## Multi-locale Support

Add `?locale=<code>` to any request or use `Accept-Language` header.

Supported locales:
- `en` - English (default)
- `es` - Spanish
- `fr` - French

Example: `GET /?locale=es` returns Spanish messages.

## Architecture

```
src/
├── config/         # Configuration & Swagger setup
├── middleware/     # Localization and other middleware
├── routes/         # Route definitions (health check, etc.)
├── modules/        # Project is following vertically architecture. Each folder would have its own folder.
├── types/          # TypeScript type augmentations
├── uploads/        # File storage directory (for future use)
├── app.ts          # Express app initialization
└── index.ts        # Server bootstrap
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Environment Variables

All variables are prefixed with `NB_BACKEND_`. A sample `.env` is included under `backend/.env`.

Key variables:
- `NB_BACKEND_PORT` - Server port (default: 3000)
- `NB_BACKEND_NODE_ENV` - Node environment (development, production, etc.)
- `NB_BACKEND_ALLOWED_ORIGINS` - Comma-separated list of CORS origins
- `NB_BACKEND_UPLOAD_PATH` - Local uploads directory path (default: ./src/uploads)
- `NB_BACKEND_MAX_FILE_SIZE` - Maximum upload size in bytes (default: 10485760)
- `NB_BACKEND_DEFAULT_LOCALE` - Default locale (default: en)
- `NB_BACKEND_SUPPORTED_LOCALES` - Comma-separated locale codes (default: en,es,fr)

Note: JWT-related variables exist in the config for future use (`NB_BACKEND_JWT_*`), but authentication endpoints are not yet implemented in this backend module.

## Testing

Run tests with:

```bash
npm test
```

Note: Jest is configured in the project, but test files may be minimal or pending depending on the current development stage.

## Security & Middleware

- CORS protection (configurable origins)
- Helmet security headers
- Request logging (morgan)
- Localization middleware

## Production Deployment

1. Build the project: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`

The built files will be in the `dist/` directory.