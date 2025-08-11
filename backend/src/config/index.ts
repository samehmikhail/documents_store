import { config } from 'dotenv';

config();

export const Config = {
  PORT: process.env.NB_BACKEND_PORT || 3000,
  NODE_ENV: process.env.NB_BACKEND_NODE_ENV || 'development',
  UPLOAD_PATH: process.env.NB_BACKEND_UPLOAD_PATH || './src/uploads',
  MAX_FILE_SIZE: parseInt(process.env.NB_BACKEND_MAX_FILE_SIZE || '10485760'), // 10MB default
  ALLOWED_ORIGINS: process.env.NB_BACKEND_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  DEFAULT_LOCALE: process.env.NB_BACKEND_DEFAULT_LOCALE || 'en',
  SUPPORTED_LOCALES: process.env.NB_BACKEND_SUPPORTED_LOCALES?.split(',') || ['en', 'es', 'fr']
};