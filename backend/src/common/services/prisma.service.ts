import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('database.url');

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    const dbUrl = this.configService.get<string>('database.url');

    try {
      await this.connectWithRetry(dbUrl);
      this.logger.log('Successfully connected to database');

      // Test database connection with a simple query
      const healthy = await this.healthCheck();
      if (healthy) {
        this.logger.log('Database health check passed');
      } else {
        this.logger.warn('Database health check reported issues');
      }

      // Log connection pool information (non-sensitive)
      const connectionInfo = await this.getConnectionInfo();
      this.logger.log(`Connected to database: ${connectionInfo.database} on ${connectionInfo.host}:${connectionInfo.port}`);
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${this.maskDatabaseUrl(dbUrl)} - ${error?.message ?? error}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      // attempt graceful disconnect with timeout
      const disconnectPromise = this.$disconnect();
      const timeout = this.configService.get<number>('database.connectionTimeout') || 5000;

      await Promise.race([
        disconnectPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma disconnect timeout')), timeout)),
      ]);

      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test basic connectivity
      await this.$queryRaw`SELECT 1 as health_check`;
      
      // Test if we can access our main tables (basic schema validation)
      await this.$queryRaw`SELECT COUNT(*) FROM "User" LIMIT 1`;
      
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  async getConnectionInfo() {
    const databaseUrl = this.configService.get<string>('database.url') || '';
    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: url.port,
        database: url.pathname.slice(1),
        schema: url.searchParams.get('schema') || 'public',
        ssl: url.searchParams.get('sslmode') === 'require',
      };
    } catch (error) {
      this.logger.warn('Unable to parse database URL for connection info');
      return { host: 'unknown', port: '', database: 'unknown', schema: 'public', ssl: false };
    }
  }

  private maskDatabaseUrl(databaseUrl: string | undefined): string {
    if (!databaseUrl) return 'not-set';
    try {
      const url = new URL(databaseUrl);
      if (url.password) url.password = '****';
      return url.toString();
    } catch (e) {
      return 'invalid-url';
    }
  }

  private async connectWithRetry(databaseUrl: string | undefined) {
    const maxAttempts = this.configService.get<number>('database.connectRetries') ?? 5;
    const baseDelay = this.configService.get<number>('database.connectBaseDelay') ?? 200; // ms

    let attempt = 0;
    let lastError: any;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        await this.$connect();
        return;
      } catch (error) {
        lastError = error;
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || attempt >= maxAttempts) break;

        const delay = Math.pow(2, attempt) * baseDelay;
        this.logger.warn(`Database connect attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    this.logger.error(`Unable to connect to database after ${attempt} attempts: ${lastError?.message ?? lastError}`);
    throw lastError;
  }

  async getConnectionStats() {
    try {
      // Get database connection statistics
      const stats = await this.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      ` as any[];

      return stats[0] || { total_connections: 0, active_connections: 0, idle_connections: 0 };
    } catch (error) {
      this.logger.error('Failed to get connection stats:', error);
      return { total_connections: 0, active_connections: 0, idle_connections: 0 };
    }
  }

  async getDatabaseSize(): Promise<string> {
    try {
      const result = await this.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      ` as any[];
      
      return result[0]?.size || 'Unknown';
    } catch (error) {
      this.logger.error('Failed to get database size:', error);
      return 'Unknown';
    }
  }

  /**
   * Execute a transaction with automatic retry logic
   */
  async executeTransaction<T>(
    fn: (prisma: PrismaService) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(async (tx) => {
          // Create a temporary service instance with the transaction client
          const transactionService = Object.create(this);
          Object.setPrototypeOf(transactionService, PrismaService.prototype);
          Object.assign(transactionService, tx);
          
          return await fn(transactionService);
        });
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable (connection issues, deadlocks, etc.)
        if (this.isRetryableError(error) && attempt < maxRetries) {
          this.logger.warn(`Transaction attempt ${attempt} failed, retrying...`, error);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError!;
  }

  private isRetryableError(error: any): boolean {
    // Check for retryable error codes
    const retryableCodes = [
      'P2034', // Transaction conflict
      'P2028', // Transaction API error
      'P1001', // Can't reach database server
      'P1002', // Database server timeout
    ];
    
    return retryableCodes.includes(error.code) || 
           error.message?.includes('connection') ||
           error.message?.includes('timeout');
  }
}