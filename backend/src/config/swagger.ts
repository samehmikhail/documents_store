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
    components: {
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
  apis: ['./src/routes/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJSDoc(options);