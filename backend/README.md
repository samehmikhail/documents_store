# Documents Store Backend

A Node.js/Express REST API service for document management with role-based access control and multi-locale support.

## Features

- **Express 5.1.0** - Modern Express framework
- **TypeScript** - Type-safe development
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin, User, Guest roles
- **Multi-locale Support** - English, Spanish, French
- **In-memory Database** - Fast development setup
- **File Upload/Storage** - Local file storage with metadata
- **Swagger Documentation** - Interactive API documentation
- **Comprehensive Testing** - Jest test suite

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Development

The development server starts on `http://localhost:3000` with:

- API endpoints at `/api/*`
- Swagger documentation at `/api-docs`
- Health check at `/api/health`

### Default Admin Account

- **Username**: admin
- **Password**: password
- **Role**: admin

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Documents (Protected)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get all documents
- `GET /api/documents/my` - Get user's documents
- `GET /api/documents/:id` - Download document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/search?q=query` - Search documents

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
├── controllers/     # Request handlers
├── routes/         # Route definitions
├── middleware/     # Custom middleware
├── services/       # Business logic
├── models/         # Data models & in-memory DB
├── config/         # Configuration & Swagger
├── types/          # TypeScript type definitions
├── uploads/        # File storage directory
└── __tests__/      # Test files
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - JWT signing secret
- `MAX_FILE_SIZE` - Maximum upload size in bytes
- `SUPPORTED_LOCALES` - Comma-separated locale codes

## Testing

Run the test suite:

```bash
npm test
```

Test coverage includes:
- API endpoints
- Authentication flows
- Error handling
- Multi-locale responses

## Security Features

- JWT token authentication
- Role-based access control
- CORS protection
- Helmet security headers
- File upload validation
- Password hashing (bcrypt)

## Production Deployment

1. Build the project: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`

The built files will be in the `dist/` directory.