import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaService } from '../common/services/prisma.service';
import { ConfigModule } from '../config';

describe('HealthController', () => {
  let controller: HealthController;
  let configService: ConfigService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [HealthController],
      providers: [PrismaService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check status', async () => {
    const result = await controller.healthCheck();
    
    expect(result).toBeDefined();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
    expect(result.environment).toBeDefined();
    expect(result.database).toBeDefined();
    expect(result.configuration).toBeDefined();
  });

  it('should return configuration check', async () => {
    const result = await controller.configCheck();
    
    expect(result).toBeDefined();
    expect(result.status).toBe('ok');
    expect(result.message).toBe('Configuration validation passed');
    expect(result.configs).toBeDefined();
    expect(result.configs.database).toBeDefined();
    expect(result.configs.jwt).toBeDefined();
    expect(result.configs.app).toBeDefined();
  });

  it('should have valid configuration values', async () => {
    const result = await controller.configCheck();
    
    // Verify database config
    expect(result.configs.database.host).toBeDefined();
    expect(result.configs.database.port).toBeGreaterThan(0);
    expect(result.configs.database.database).toBeDefined();
    
    // Verify JWT config
    expect(result.configs.jwt.issuer).toBeDefined();
    expect(result.configs.jwt.audience).toBeDefined();
    expect(result.configs.jwt.expiresIn).toBeDefined();
    
    // Verify app config
    expect(result.configs.app.environment).toBeDefined();
    expect(result.configs.app.port).toBeGreaterThan(0);
  });
});