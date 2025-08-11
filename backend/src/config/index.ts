import { config } from 'dotenv';

config();

export const Config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './src/uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  DEFAULT_LOCALE: process.env.DEFAULT_LOCALE || 'en',
  SUPPORTED_LOCALES: process.env.SUPPORTED_LOCALES?.split(',') || ['en', 'es', 'fr']
};