export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  apiPrefix: string;
  corsOrigins: string[];
  enableSwagger: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableAudit: boolean;
}

export interface DatabaseConfig {
  url?: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  schema: string;
  ssl: boolean;
  connectionTimeout: number;
  maxConnections: number;
  connectRetries: number;
  connectBaseDelay: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret?: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
}
