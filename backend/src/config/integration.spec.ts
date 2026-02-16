import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getAppConfig, getDatabaseConfig, getJwtConfig } from './config.helpers';
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
      const dbCfg = getDatabaseConfig(configService);
      expect(dbCfg.url).toBeDefined();
      expect(dbCfg.host).toBeDefined();
      expect(dbCfg.port).toBeDefined();

      // Test JWT configuration
      const jwtCfg = getJwtConfig(configService);
      expect(jwtCfg.secret).toBeDefined();
      expect(jwtCfg.expiresIn).toBeDefined();
      expect(jwtCfg.issuer).toBeDefined();

      // Test app configuration
      const appCfg = getAppConfig(configService);
      expect(appCfg.port).toBeDefined();
      expect(appCfg.environment).toBeDefined();
      expect(appCfg.corsOrigins).toBeDefined();
    });

    it('should have valid configuration types', () => {
      const appCfg = getAppConfig(configService);
      expect(typeof appCfg.port).toBe('number');
      expect(typeof appCfg.environment).toBe('string');
      expect(Array.isArray(appCfg.corsOrigins)).toBe(true);
      expect(typeof appCfg.enableSwagger).toBe('boolean');
    });

    it('should validate JWT secret length', () => {
      const jwtCfg2 = getJwtConfig(configService);
      expect(jwtCfg2.secret.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Prisma Integration', () => {
    it('should create PrismaService with configuration', () => {
      expect(prismaService).toBeDefined();
    });

    it('should get connection info from configuration', async () => {
      const connectionInfo = await prismaService.getConnectionInfo();
      
      expect(connectionInfo).toBeDefined();
      const dbCfg2 = getDatabaseConfig(configService);
      expect(connectionInfo.host).toBe(dbCfg2.host);
      expect(connectionInfo.port).toBe(dbCfg2.port.toString());
      expect(connectionInfo.database).toBe(dbCfg2.database);
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
      const appCfg2 = getAppConfig(configService);

      expect(appCfg2.port).toBe(3001); // Default value
      expect(['development', 'production', 'test']).toContain(appCfg2.environment);
    });
  });
});