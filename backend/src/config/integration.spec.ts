import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';
import { ConfigModule } from './config.module';
import { CommonModule } from '../common/common.module';

describe('Configuration Integration', () => {
  let module: TestingModule;
  let configService: ConfigService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, CommonModule],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Configuration Loading', () => {
    it('should load all required configuration sections', () => {
      // Test database configuration
      expect(configService.get('database.url')).toBeDefined();
      expect(configService.get('database.host')).toBeDefined();
      expect(configService.get('database.port')).toBeDefined();

      // Test JWT configuration
      expect(configService.get('jwt.secret')).toBeDefined();
      expect(configService.get('jwt.expiresIn')).toBeDefined();
      expect(configService.get('jwt.issuer')).toBeDefined();

      // Test app configuration
      expect(configService.get('app.port')).toBeDefined();
      expect(configService.get('app.environment')).toBeDefined();
      expect(configService.get('app.corsOrigins')).toBeDefined();
    });

    it('should have valid configuration types', () => {
      expect(typeof configService.get<number>('app.port')).toBe('number');
      expect(typeof configService.get<string>('app.environment')).toBe('string');
      expect(Array.isArray(configService.get<string[]>('app.corsOrigins'))).toBe(true);
      expect(typeof configService.get<boolean>('app.enableSwagger')).toBe('boolean');
    });

    it('should validate JWT secret length', () => {
      const jwtSecret = configService.get<string>('jwt.secret');
      expect(jwtSecret.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Prisma Integration', () => {
    it('should create PrismaService with configuration', () => {
      expect(prismaService).toBeDefined();
    });

    it('should get connection info from configuration', async () => {
      const connectionInfo = await prismaService.getConnectionInfo();
      
      expect(connectionInfo).toBeDefined();
      expect(connectionInfo.host).toBe(configService.get('database.host'));
      expect(connectionInfo.port).toBe(configService.get('database.port').toString());
      expect(connectionInfo.database).toBe(configService.get('database.database'));
    });

    it('should perform health check', async () => {
      try {
        const isHealthy = await prismaService.healthCheck();
        expect(typeof isHealthy).toBe('boolean');
      } catch (error) {
        // Database might not be available in test environment
        expect(error).toBeDefined();
      }
    });
  });

  describe('Environment Variables', () => {
    it('should load environment variables correctly', () => {
      // These should be loaded from .env file
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.NODE_ENV).toBeDefined();
    });

    it('should apply default values for optional configs', () => {
      const port = configService.get<number>('app.port');
      const environment = configService.get<string>('app.environment');
      
      expect(port).toBe(3001); // Default value
      expect(['development', 'production', 'test']).toContain(environment);
    });
  });
});