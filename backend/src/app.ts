import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { Config } from './config';
import { swaggerSpec } from './config/swagger';
import { localizationMiddleware } from './config/localization';
import { tenantMiddleware } from './modules/multi-tenant/middleware/tenant';
import { authenticationMiddleware } from './modules/authentication/middleware/authentication';
import apiRoutes from './routes';

// Helper registration functions to make middleware order explicit and easy to follow
function registerSecurity(app: express.Express) {
  // Security middleware
  app.use(helmet());
}

function registerCors(app: express.Express) {
  // CORS configuration
  app.use(cors({
    origin: Config.ALLOWED_ORIGINS,
    credentials: true,
  }));
}

function registerLogging(app: express.Express) {
  // Logging middleware
  app.use(morgan('combined'));
}

function registerParsers(app: express.Express) {
  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
}

function registerLocalization(app: express.Express) {
  // Localization middleware
  app.use(localizationMiddleware);
}

function registerDocs(app: express.Express) {
  // API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Documents Store API Documentation'
  }));
}

function registerRootEndpoint(app: express.Express) {
  // Root endpoint (no tenant required)
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: `${req.t?.('welcome') || 'Welcome'} to Documents Store API`,
      version: '1.0.0',
      documentation: '/api-docs',
      health: '/api/health'
    });
  });
}

function registerMultiTenantChecker(app: express.Express) {
  // Apply tenant middleware to all API routes
  app.use('/api', tenantMiddleware, authenticationMiddleware, apiRoutes);
}

function registerNotFound(app: express.Express) {
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });
  });
}

function registerErrorHandler(app: express.Express) {
  // Global error handler (must be last)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);

    res.status(err.status || 500).json({
      success: false,
      message: req.t?.('server.error') || 'Internal server error',
      ...(Config.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
    });
  });
}

const app = express();

// The order below defines the exact request handling pipeline
[
  registerSecurity,
  registerCors,
  registerLogging,
  registerParsers,
  registerLocalization,
  registerDocs,
  registerRootEndpoint,
  registerMultiTenantChecker,
  registerNotFound,
  registerErrorHandler,
].forEach(step => step(app));

export default app;