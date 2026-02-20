import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../common/services/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { AppRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UsersService (Unit Tests)', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignIn: null,
    migrationSource: null,
    resetToken: null,
    resetExpiry: null,
    userRoles: [{ id: '1', role: 'collaborateur' }],
  };

  const mockAdmin = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'admin@example.com',
    password: 'hashedPassword',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignIn: new Date(),
    migrationSource: null,
    resetToken: null,
    resetExpiry: null,
    userRoles: [{ id: '2', role: 'admin' }],
  };

  const adminSecurityContext = {
    userId: mockAdmin.id,
    roles: [AppRole.admin],
  };

  const userSecurityContext = {
    userId: mockUser.id,
    roles: ['collaborateur'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({
              ...mockUser,
              email: createUserDto.email,
            }),
            findUnique: jest.fn().mockResolvedValue({
              ...mockUser,
              email: createUserDto.email,
            }),
          },
          userRoles: {
            create: jest.fn(),
          },
        };
        return await callback(mockTx);
      });

      const result = await service.create(createUserDto, adminSecurityContext);

      expect(result.email).toBe(createUserDto.email);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
      };

      await expect(service.create(createUserDto, userSecurityContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.create(createUserDto, adminSecurityContext)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should assign roles when provided', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        roles: [AppRole.collaborateur, AppRole.compta],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({
              ...mockUser,
              email: createUserDto.email,
            }),
            findUnique: jest.fn().mockResolvedValue({
              ...mockUser,
              email: createUserDto.email,
              userRoles: [
                { id: '1', role: 'collaborateur' },
                { id: '2', role: 'compta' },
              ],
            }),
          },
          userRoles: {
            create: jest.fn().mockResolvedValue({ id: '1', role: 'collaborateur' }),
          },
        };
        return await callback(mockTx);
      });

      const result = await service.create(createUserDto, adminSecurityContext);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
    });
  });

  describe('update', () => {
    it('should update a user email', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      // Mock findFirst for security conditions check
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        userRoles: [{ id: 'role1', role: 'admin' }],
      });
      
      // Mock findUnique for email uniqueness check
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock update
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: updateUserDto.email,
        userRoles: [{ id: 'role1', role: 'admin' }],
      });

      const result = await service.update(mockUser.id, updateUserDto, adminSecurityContext);

      expect(result.email).toBe(updateUserDto.email);
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const updateUserDto: UpdateUserDto = { email: 'newemail@example.com' };

      await expect(
        service.update(mockUser.id, updateUserDto, userSecurityContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const updateUserDto: UpdateUserDto = { email: 'newemail@example.com' };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateUserDto, adminSecurityContext),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      // Mock findFirst for findOne method
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        userRoles: [{ id: 'role1', role: 'collaborateur' }],
      });
      
      (prisma.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.remove(mockUser.id, adminSecurityContext);

      expect(result.message).toContain('supprimé');
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it('should throw BadRequestException if trying to delete last admin', async () => {
      // Mock findFirst for findOne method - return admin user
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockAdmin,
        userRoles: [{ id: 'role1', role: 'admin' }],
      });
      
      (prisma.userRoles.count as jest.Mock).mockResolvedValue(1);

      await expect(service.remove(mockAdmin.id, adminSecurityContext)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      await expect(service.remove(mockUser.id, userSecurityContext)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      // Mock findFirst for findOne method
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        userRoles: [{ id: '1', role: 'collaborateur' }],
      });
      
      (prisma.userRoles.findFirst as jest.Mock).mockResolvedValue(null); // Role doesn't exist
      (prisma.userRoles.create as jest.Mock).mockResolvedValue({
        id: '3',
        role: 'admin',
      });

      await service.assignRole(mockUser.id, AppRole.admin, adminSecurityContext);

      expect(prisma.userRoles.create).toHaveBeenCalledWith({
        data: { userId: mockUser.id, role: 'admin' },
      });
    });

    it('should throw BadRequestException if user already has role', async () => {
      // Mock findFirst for findOne method
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        userRoles: [{ id: '1', role: 'collaborateur' }],
      });
      
      (prisma.userRoles.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'collaborateur',
      });

      await expect(
        service.assignRole(mockUser.id, AppRole.collaborateur, adminSecurityContext),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      await expect(
        service.assignRole(mockUser.id, AppRole.admin, userSecurityContext),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a user', async () => {
      // Mock findFirst for findOne method
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        userRoles: [{ id: '1', role: 'collaborateur' }],
      });
      
      (prisma.userRoles.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'collaborateur',
      });
      (prisma.userRoles.delete as jest.Mock).mockResolvedValue({
        id: '1',
        role: 'collaborateur',
      });

      await service.removeRole(mockUser.id, AppRole.collaborateur, adminSecurityContext);

      expect(prisma.userRoles.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user does not have role', async () => {
      // Mock findFirst for findOne method
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        userRoles: [], // No roles
      });
      
      (prisma.userRoles.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.removeRole(mockUser.id, AppRole.admin, adminSecurityContext),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if trying to remove last admin role', async () => {
      // Mock findFirst for findOne method
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockAdmin,
        userRoles: [{ id: '2', role: 'admin' }],
      });
      
      (prisma.userRoles.findFirst as jest.Mock).mockResolvedValue({
        id: '2',
        role: 'admin',
      });
      (prisma.userRoles.count as jest.Mock).mockResolvedValue(1); // Only one admin

      await expect(
        service.removeRole(mockAdmin.id, AppRole.admin, adminSecurityContext),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRoles', () => {
    it('should get user roles', async () => {
      // Mock findFirst for findOne method
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        userRoles: [{ id: '1', role: 'collaborateur' }],
      });

      const roles = await service.getRoles(mockUser.id, adminSecurityContext);

      expect(roles).toEqual(['collaborateur']);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getRoles('non-existent-id', adminSecurityContext)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUsersByRole', () => {
    it('should get users by role', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser, mockUser]);
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      const query = { page: 1, limit: 20, search: '', sortBy: undefined, sortOrder: 'desc' };
      const result = await service.getUsersByRole(
        AppRole.collaborateur,
        query as any,
        adminSecurityContext,
      );

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const query = { page: 1, limit: 20, search: '', sortBy: undefined, sortOrder: 'desc' };
      await expect(
        service.getUsersByRole(AppRole.collaborateur, query as any, userSecurityContext),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
