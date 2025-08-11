import swaggerJSDoc from 'swagger-jsdoc';
import { Config } from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Documents Store API',
      version: '1.0.0',
      description: 'REST API for document management with role-based access and multi-locale support',
      contact: {
        name: 'API Support',
        email: 'support@documentstore.com'
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${Config.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'username', 'email', 'role'],
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier'
            },
            username: {
              type: 'string',
              description: 'User login name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'guest'],
              description: 'User role'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update date'
            }
          }
        },
        Document: {
          type: 'object',
          required: ['id', 'name', 'filename', 'mimeType', 'size', 'uploadedBy', 'uploadedAt'],
          properties: {
            id: {
              type: 'string',
              description: 'Document unique identifier'
            },
            name: {
              type: 'string',
              description: 'Original document name'
            },
            filename: {
              type: 'string',
              description: 'Stored filename'
            },
            mimeType: {
              type: 'string',
              description: 'Document MIME type'
            },
            size: {
              type: 'number',
              description: 'Document size in bytes'
            },
            uploadedBy: {
              type: 'string',
              description: 'ID of user who uploaded the document'
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Document upload date'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Document tags'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          required: ['success'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            data: {
              description: 'Response data (varies by endpoint)'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of error messages'
            }
          }
        },
        AuthToken: {
          type: 'object',
          required: ['token', 'expiresAt'],
          properties: {
            token: {
              type: 'string',
              description: 'JWT access token'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Token expiration date'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints'
      },
      {
        name: 'Documents',
        description: 'Document management endpoints'
      }
    ]
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'], // paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJSDoc(options);