import { ConfigService } from '@nestjs/config';
import { AppConfig, DatabaseConfig, JwtConfig } from './types';

export const getAppConfig = (config: ConfigService): AppConfig => ({
  port: config.get<number>('app.port'),
  environment: config.get<'development' | 'production' | 'test'>('app.environment'),
  apiPrefix: config.get<string>('app.apiPrefix'),
  corsOrigins: config.get<string[]>('app.corsOrigins') || [],
  enableSwagger: config.get<boolean>('app.enableSwagger'),
  logLevel: config.get<'error' | 'warn' | 'info' | 'debug'>('app.logLevel'),
  enableAudit: config.get<boolean>('app.enableAudit'),
});

export const getDatabaseConfig = (config: ConfigService): DatabaseConfig => ({
  url: config.get<string>('database.url'),
  host: config.get<string>('database.host') || 'localhost',
  port: config.get<number>('database.port') || 5432,
  username: config.get<string>('database.username') || 'postgres',
  password: config.get<string>('database.password') || undefined,
  database: config.get<string>('database.database') || 'migration_db',
  schema: config.get<string>('database.schema') || 'public',
  ssl: config.get<boolean>('database.ssl') || false,
  connectionTimeout: config.get<number>('database.connectionTimeout') || 60000,
  maxConnections: config.get<number>('database.maxConnections') || 10,
  connectRetries: config.get<number>('database.connectRetries') || 5,
  connectBaseDelay: config.get<number>('database.connectBaseDelay') || 200,
});

export const getJwtConfig = (config: ConfigService): JwtConfig => ({
  secret: config.get<string>('jwt.secret')!,
  expiresIn: config.get<string>('jwt.expiresIn') || '24h',
  refreshSecret: config.get<string>('jwt.refreshSecret') || undefined,
  refreshExpiresIn: config.get<string>('jwt.refreshExpiresIn') || '7d',
  issuer: config.get<string>('jwt.issuer') || 'capco-api',
  audience: config.get<string>('jwt.audience') || 'capco-users',
});
