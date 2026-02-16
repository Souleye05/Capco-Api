import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/services/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            userRole: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 12),
        userRoles: [{ role: 'collaborateur' }],
        resetToken: null,
        resetExpiry: null,
        emailVerified: true,
        lastSignIn: null,
        migrationSource: 'supabase',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBeUndefined(); // Password should be excluded
    });

    it('should return null when user does not exist', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 12),
        userRoles: [],
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return auth response for valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 12),
        userRoles: [{ role: 'collaborateur' }],
        resetToken: null,
        resetExpiry: null,
        emailVerified: true,
        lastSignIn: null,
        migrationSource: 'supabase',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toBeDefined();
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.requiresPasswordReset).toBe(false);
    });

    it('should indicate password reset required for migrated users with reset token', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 12),
        userRoles: [{ role: 'collaborateur' }],
        resetToken: 'some-reset-token',
        resetExpiry: futureDate,
        emailVerified: true,
        lastSignIn: null,
        migrationSource: 'supabase',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.requiresPasswordReset).toBe(true);
      expect(result.user.requiresPasswordReset).toBe(true);
    });
  });

  describe('isMigratedUser', () => {
    it('should return true for migrated users', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        migrationSource: 'supabase',
      });

      const result = await service.isMigratedUser('1');

      expect(result).toBe(true);
    });

    it('should return false for non-migrated users', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        migrationSource: null,
      });

      const result = await service.isMigratedUser('1');

      expect(result).toBe(false);
    });
  });
});