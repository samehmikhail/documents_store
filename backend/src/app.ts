import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { Config } from './config';
import { swaggerSpec } from './config/swagger';
import { localizationMiddleware } from './config/localization';
import { tenantMiddleware } from './modules/multi-tenant/middleware/tenant';
import apiRoutes from './routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: Config.ALLOWED_ORIGINS,
  credentials: true,
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Localization middleware
app.use(localizationMiddleware);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Documents Store API Documentation'
}));

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

// Apply tenant middleware to all API routes
app.use('/api', tenantMiddleware, apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: req.t?.('server.error') || 'Internal server error',
    ...(Config.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

export default app;