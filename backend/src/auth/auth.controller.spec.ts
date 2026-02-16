import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/services/prisma.service';
import { AppRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn(),
            changePassword: jest.fn(),
            getProfile: jest.fn(),
            isMigratedUser: jest.fn(),
            getMigrationStats: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return auth response', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const expectedResponse = {
        access_token: 'jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          emailVerified: true,
          roles: [AppRole.collaborateur],
          migrationSource: 'supabase',
          requiresPasswordReset: false,
          lastSignIn: null,
        },
        requiresPasswordReset: false,
      };

      (authService.login as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const registerDto = { 
        email: 'newuser@example.com', 
        password: 'password',
        role: AppRole.collaborateur,
      };
      const expectedResponse = {
        access_token: 'jwt-token',
        user: {
          id: '2',
          email: 'newuser@example.com',
          emailVerified: false,
          roles: [AppRole.collaborateur],
          migrationSource: null,
          requiresPasswordReset: false,
          lastSignIn: null,
        },
        requiresPasswordReset: false,
      };

      (authService.register as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset', async () => {
      const dto = { email: 'test@example.com' };
      const expectedResponse = { message: 'If the email exists, a reset link has been sent' };

      (authService.requestPasswordReset as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.requestPasswordReset(dto);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockRequest = { user: { userId: '1' } };
      const expectedProfile = {
        id: '1',
        email: 'test@example.com',
        emailVerified: true,
        roles: [AppRole.collaborateur],
        migrationSource: 'supabase',
        requiresPasswordReset: false,
        lastSignIn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.getProfile as jest.Mock).mockResolvedValue(expectedProfile);

      const result = await controller.getProfile(mockRequest);

      expect(authService.getProfile).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedProfile);
    });
  });

  describe('getMigrationStatus', () => {
    it('should return migration status', async () => {
      const mockRequest = { user: { userId: '1' } };

      (authService.isMigratedUser as jest.Mock).mockResolvedValue(true);

      const result = await controller.getMigrationStatus(mockRequest);

      expect(authService.isMigratedUser).toHaveBeenCalledWith('1');
      expect(result).toEqual({ isMigrated: true });
    });
  });
});