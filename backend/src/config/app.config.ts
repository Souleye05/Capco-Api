import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info',
  enableAudit: process.env.ENABLE_AUDIT !== 'false',
}));