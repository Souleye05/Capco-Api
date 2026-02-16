import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'passer',
  database: process.env.DB_NAME || 'migration_db',
  schema: process.env.DB_SCHEMA || 'public',
  ssl: process.env.DB_SSL === 'true',
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 60000,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10,
  connectRetries: parseInt(process.env.DB_CONNECT_RETRIES, 10) || 5,
  connectBaseDelay: parseInt(process.env.DB_CONNECT_BASE_DELAY, 10) || 200,
}));