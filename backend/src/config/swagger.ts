import swaggerJSDoc from 'swagger-jsdoc';
import { Config } from './index';

// Minimal OpenAPI definition for an empty project
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Documents Store API',
      version: '1.0.0',
      description: 'API documentation will be available once endpoints are implemented.'
    },
    servers: [
      {
        url: `http://localhost:${Config.PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: [], // No API files yet
};

export const swaggerSpec = swaggerJSDoc(options);