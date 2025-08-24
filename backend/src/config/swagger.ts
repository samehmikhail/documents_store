import swaggerJSDoc from 'swagger-jsdoc';
import { Config } from './index';

// OpenAPI definition for multi-tenant documents store
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Documents Store API',
      version: '1.0.0',
      description: 'Multi-tenant documents management API with localization support.'
    },
    servers: [
      {
        url: `http://localhost:${Config.PORT}`,
        description: 'Development server',
      },
    ],
    // Tags to group APIs by module in Swagger UI
    tags: [
      {
        name: 'Health',
        description: 'Service health and root endpoints'
      },
      {
        name: 'Documents',
        description: 'Documents module APIs for managing documents and files'
      },
      {
        name: 'Events',
        description: 'Events module APIs for producing and reading events'
      }
    ],
    components: {
      securitySchemes: {
        UserTokenAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-User-Token',
          description: 'User authentication token'
        },
        TenantAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-TENANT-ID',
          description: 'Tenant identifier'
        }
      },
      parameters: {
        TenantId: {
          name: 'X-TENANT-ID',
          in: 'header',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Tenant identifier required for all API operations'
        },
        UserToken: {
          name: 'X-User-Token',
          in: 'header',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'User authentication token required for authenticated operations'
        },
        AcceptLanguage: {
          name: 'Accept-Language',
          in: 'header',
          required: false,
          schema: {
            type: 'string',
            enum: ['en', 'es', 'fr'],
            default: 'en'
          },
          description: 'Preferred language for response messages'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error description'
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            }
          }
        }
      },
      responses: {
        BadRequestError: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Tenant ID is required. Please provide X-TENANT-ID header.',
                code: 'TENANT_ID_MISSING'
              }
            }
          }
        },
        UnauthorizedError: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'User token is required. Please provide X-User-Token header.',
                code: 'USER_TOKEN_MISSING'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'You do not have permission to perform this action.',
                code: 'FORBIDDEN'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Invalid or inactive tenant ID.',
                code: 'TENANT_INVALID'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/modules/**/*.ts'], // Include module routes for Swagger scanning
};

export const swaggerSpec = swaggerJSDoc(options);