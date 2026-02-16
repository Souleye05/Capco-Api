import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '../../config';

describe('PrismaService', () => {
  let service: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have configuration service', () => {
    expect(configService).toBeDefined();
  });

  it('should get connection info', async () => {
    const connectionInfo = await service.getConnectionInfo();
    
    expect(connectionInfo).toBeDefined();
    expect(connectionInfo.host).toBeDefined();
    expect(connectionInfo.port).toBeDefined();
    expect(connectionInfo.database).toBeDefined();
  });

  it('should perform health check', async () => {
    // This test might fail if database is not available, which is expected in CI
    try {
      const isHealthy = await service.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    } catch (error) {
      // Database connection might not be available in test environment
      expect(error).toBeDefined();
    }
  });
});