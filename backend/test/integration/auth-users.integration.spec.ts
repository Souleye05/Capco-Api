import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/common/services/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Auth & Users Integration (E2E)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let prisma: PrismaService;

  const testUsers = {
    admin: {
      email: 'admin@test.capcos.fr',
      password: 'SecurePassword123!',
      role: 'admin',
    },
    collaborator: {
      email: 'collab@test.capcos.fr',
      password: 'CollaboratorPass456!',
      role: 'collaborateur',
    },
  };

  beforeAll(async () => {
    // Create a test module with minimal dependencies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findFirst: jest.fn(),
            },
            userRoles: {
              findFirst: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
            verify: jest.fn(() => ({ sub: 'test-id', email: 'test@test.com' })),
          },
        },
      ],
    }).compile();

    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  describe('Scenario 1: Create admin user and assign roles', () => {
    it('should create admin user and assign roles via UsersService', async () => {
      const adminSecurityContext = {
        userId: 'system-admin',
        roles: ['admin'],
      };

      // Mock Prisma responses for admin creation
      const mockAdminUser = {
        id: 'admin-id-123',
        email: testUsers.admin.email,
        password: 'hashed-password',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignIn: null,
        migrationSource: null,
        resetToken: null,
        resetExpiry: null,
        userRoles: [{ id: 'role-1', role: 'admin' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // Email doesn't exist
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockAdminUser);
      (prisma.userRoles.create as jest.Mock).mockResolvedValueOnce({
        id: 'role-1',
        role: 'admin',
      });

      const result = await usersService.create(
        {
          email: testUsers.admin.email,
          password: testUsers.admin.password,
          roles: ['admin'],
        },
        adminSecurityContext,
      );

      expect(result).toBeDefined();
      expect(result.email).toBe(testUsers.admin.email);
      expect(result.userRoles).toContainEqual(expect.objectContaining({ role: 'admin' }));
    });
  });

  describe('Scenario 2: Login with created user', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'collab-id-456',
        email: testUsers.collaborator.email,
        password: 'hashed-password',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignIn: null,
        migrationSource: null,
        resetToken: null,
        resetExpiry: null,
        userRoles: [{ id: 'role-2', role: 'collaborateur' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(mockUser); // lastSignIn update

      const loginResult = await authService.login({
        email: testUsers.collaborator.email,
        password: testUsers.collaborator.password,
      });

      expect(loginResult).toBeDefined();
      expect(loginResult.user.email).toBe(testUsers.collaborator.email);
      expect(loginResult.access_token).toBeDefined();
      expect(loginResult.user.roles).toContain('collaborateur');
    });
  });

  describe('Scenario 3: Assign additional role to user', () => {
    it('should assign compta role to collaborator', async () => {
      const adminSecurityContext = {
        userId: 'admin-id-123',
        roles: ['admin'],
      };

      const mockUser = {
        id: 'collab-id-456',
        email: testUsers.collaborator.email,
        userRoles: [{ id: 'role-2', role: 'collaborateur' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.userRoles.findFirst as jest.Mock).mockResolvedValueOnce(null); // compta role doesn't exist
      (prisma.userRoles.create as jest.Mock).mockResolvedValueOnce({
        id: 'role-3',
        role: 'compta',
      });

      await usersService.assignRole('collab-id-456', 'compta', adminSecurityContext);

      expect(prisma.userRoles.create).toHaveBeenCalledWith({
        data: {
          userId: 'collab-id-456',
          role: 'compta',
        },
      });
    });
  });

  describe('Scenario 4: Prevent unauthorized access', () => {
    it('should prevent non-admin from creating users', async () => {
      const userSecurityContext = {
        userId: 'collab-id-456',
        roles: ['collaborateur'],
      };

      await expect(
        usersService.create(
          {
            email: 'newuser@test.com',
            password: 'SecurePassword123!',
          },
          userSecurityContext,
        ),
      ).rejects.toThrow();
    });

    it('should prevent non-admin from assigning roles', async () => {
      const userSecurityContext = {
        userId: 'collab-id-456',
        roles: ['collaborateur'],
      };

      await expect(
        usersService.assignRole('collab-id-456', 'admin', userSecurityContext),
      ).rejects.toThrow();
    });
  });

  describe('Scenario 5: Prevent last admin deletion', () => {
    it('should prevent removal of last admin role', async () => {
      const adminSecurityContext = {
        userId: 'admin-id-123',
        roles: ['admin'],
      };

      const mockAdminUser = {
        id: 'admin-id-123',
        email: testUsers.admin.email,
        userRoles: [{ id: 'role-1', role: 'admin' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockAdminUser);
      (prisma.userRoles.count as jest.Mock).mockResolvedValueOnce(1); // Only one admin
      (prisma.userRoles.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'role-1',
        role: 'admin',
      });

      await expect(
        usersService.removeRole('admin-id-123', 'admin', adminSecurityContext),
      ).rejects.toThrow();
    });
  });

  describe('Scenario 6: List users by role', () => {
    it('should list all collaborators', async () => {
      const adminSecurityContext = {
        userId: 'admin-id-123',
        roles: ['admin'],
      };

      const mockUsers = [
        {
          id: 'collab-id-456',
          email: testUsers.collaborator.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userRoles: [{ id: 'role-2', role: 'collaborateur' }],
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(1);

      const result = await usersService.getUsersByRole(
        'collaborateur',
        { page: 1, limit: 20 },
        adminSecurityContext,
      );

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('Scenario 7: Update user email', () => {
    it('should update user email', async () => {
      const adminSecurityContext = {
        userId: 'admin-id-123',
        roles: ['admin'],
      };

      const mockUser = {
        id: 'collab-id-456',
        email: testUsers.collaborator.email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [{ id: 'role-2', role: 'collaborateur' }],
      };

      const updatedUser = { ...mockUser, email: 'newemail@test.com' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(updatedUser);

      const result = await usersService.update(
        'collab-id-456',
        { email: 'newemail@test.com' },
        adminSecurityContext,
      );

      expect(result.email).toBe('newemail@test.com');
    });
  });

  describe('Scenario 8: Delete user', () => {
    it('should delete a user', async () => {
      const adminSecurityContext = {
        userId: 'admin-id-123',
        roles: ['admin'],
      };

      const mockUser = {
        id: 'collab-id-456',
        email: testUsers.collaborator.email,
        userRoles: [{ id: 'role-2', role: 'collaborateur' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.userRoles.count as jest.Mock).mockResolvedValueOnce(0); // Not an admin
      (prisma.user.delete as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await usersService.remove('collab-id-456', adminSecurityContext);

      expect(result.message).toContain('deleted');
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'collab-id-456' } });
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
