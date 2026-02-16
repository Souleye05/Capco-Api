import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from './config.module';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load database configuration', () => {
    const databaseUrl = service.get<string>('database.url');
    expect(databaseUrl).toBeDefined();
    expect(databaseUrl).toContain('postgresql://');
  });

  it('should load JWT configuration', () => {
    const jwtSecret = service.get<string>('jwt.secret');
    const jwtExpiresIn = service.get<string>('jwt.expiresIn');
    
    expect(jwtSecret).toBeDefined();
    expect(jwtSecret.length).toBeGreaterThan(32);
    expect(jwtExpiresIn).toBeDefined();
  });

  it('should load app configuration', () => {
    const port = service.get<number>('app.port');
    const environment = service.get<string>('app.environment');
    
    expect(port).toBeDefined();
    expect(typeof port).toBe('number');
    expect(environment).toBeDefined();
  });

  it('should validate required configuration', () => {
    // Test that required configurations are present
    const requiredConfigs = [
      'database.url',
      'jwt.secret',
      'app.port',
      'app.environment'
    ];

    requiredConfigs.forEach(config => {
      const value = service.get(config);
      expect(value).toBeDefined();
    });
  });
});