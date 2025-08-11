# Documents Store

A Node.js multi-module project for document management with backend and frontend modules.

## Project Structure

```
documents_store/
├── backend/        # Node.js/Express API service
├── frontend/       # Frontend module (coming soon)
├── package.json    # Root workspace configuration
└── README.md      # This file
```

## Backend Module

The backend module is a fully functional REST API service built with:

- **Node.js/Express 5.1.0** with TypeScript
- **JWT Authentication** with role-based access control
- **Multi-locale support** (English, Spanish, French)
- **In-memory database** for development
- **File upload/storage** with local file system
- **Swagger UI** for API documentation
- **Comprehensive testing** with Jest

### Quick Start

```bash
# Install all dependencies
npm install

# Start backend development server
npm run dev

# Build backend
npm run build

# Run tests
npm test
```

The API server runs on `http://localhost:3000` with:
- Interactive API docs at `/api-docs`
- Health check at `/api/health`
- All API endpoints under `/api/*`

### Default Admin Account
- Username: `admin`
- Password: `password`

## Features Implemented

- ✅ **Backend Module Structure**
- ✅ **Express 5.1.0** with TypeScript
- ✅ **REST APIs** with comprehensive endpoints
- ✅ **Swagger UI** documentation
- ✅ **In-memory database** with user and document models
- ✅ **File storage** access with local file system
- ✅ **Role-based access** (Admin, User, Guest roles)
- ✅ **Multi-locale support** with middleware
- ✅ **Authentication & Authorization** with JWT
- ✅ **Testing suite** with Jest
- ✅ **Development tooling** (ESLint, TypeScript, etc.)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout

### Documents (Protected)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List all documents
- `GET /api/documents/my` - User's documents
- `GET /api/documents/:id` - Download document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/search` - Search documents

## Next Steps

- Frontend module development
- Database integration (PostgreSQL/MongoDB)
- Advanced file processing
- Caching layer (Redis)
- Production deployment configuration

See `backend/README.md` for detailed backend documentation.