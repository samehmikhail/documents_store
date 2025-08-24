import { config } from 'dotenv';

config();

export const Config = {
  PORT: process.env.NB_BACKEND_PORT || 3000,
  NODE_ENV: process.env.NB_BACKEND_NODE_ENV || 'development',
  UPLOAD_PATH: process.env.NB_BACKEND_UPLOAD_PATH || './src/uploads',
  MAX_FILE_SIZE: parseInt(process.env.NB_BACKEND_MAX_FILE_SIZE || '10485760'), // 10MB default
  MAX_UPLOAD_FILES: parseInt(process.env.NB_BACKEND_MAX_UPLOAD_FILES || '10'), // 10 files default
  ALLOWED_ORIGINS: process.env.NB_BACKEND_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  DEFAULT_LOCALE: process.env.NB_BACKEND_DEFAULT_LOCALE || 'en',
  SUPPORTED_LOCALES: process.env.NB_BACKEND_SUPPORTED_LOCALES?.split(',') || ['en', 'es', 'fr'],
  DB_DIRECTORY: process.env.NB_BACKEND_DB_DIRECTORY || './databases',
  
  // Socket.IO configuration
  SIO_NAMESPACE: process.env.NB_BACKEND_SIO_NAMESPACE || '/events',
  EVENTS_BUFFER_SIZE: parseInt(process.env.NB_BACKEND_EVENTS_BUFFER_SIZE || '500'),
  SIO_PING_INTERVAL: parseInt(process.env.NB_BACKEND_SIO_PING_INTERVAL || '25000'),
  SIO_PING_TIMEOUT: parseInt(process.env.NB_BACKEND_SIO_PING_TIMEOUT || '20000'),
};