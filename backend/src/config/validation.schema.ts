import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173,http://localhost:3000'),
  ENABLE_SWAGGER: Joi.boolean().default(true),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  ENABLE_AUDIT: Joi.boolean().default(true),

  // Database
  DATABASE_URL: Joi.string().required(),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().default('migration_db'),
  DB_SCHEMA: Joi.string().default('public'),
  DB_SSL: Joi.boolean().default(false),
  DB_CONNECTION_TIMEOUT: Joi.number().default(60000),
  DB_MAX_CONNECTIONS: Joi.number().default(10),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('capco-api'),
  JWT_AUDIENCE: Joi.string().default('capco-users'),

  // Email (optional)
  EMAIL_SERVICE: Joi.string().default('smtp'),
  EMAIL_HOST: Joi.string().allow('').optional(),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().allow('').optional(),
  EMAIL_PASS: Joi.string().allow('').optional(),
  EMAIL_FROM: Joi.string().email().default('noreply@capco.com'),

  // Storage
  UPLOAD_PATH: Joi.string().default('./uploads'),
  USE_S3: Joi.boolean().default(false),
  AWS_REGION: Joi.string().allow('').when('USE_S3', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
  AWS_ACCESS_KEY_ID: Joi.string().allow('').when('USE_S3', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').when('USE_S3', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
  AWS_S3_BUCKET: Joi.string().allow('').when('USE_S3', { is: true, then: Joi.required(), otherwise: Joi.optional() }),

  // Backup
  BACKUP_PATH: Joi.string().default('./backups'),
  TEMP_PATH: Joi.string().default('./temp'),

  // Supabase (for migration purposes)
  SUPABASE_URL: Joi.string().uri().allow('').optional(),
  SUPABASE_ANON_KEY: Joi.string().allow('').optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow('').optional(),
});