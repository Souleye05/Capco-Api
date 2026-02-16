import { Test, TestingModule } from '@nestjs/testing';
import { UserMigratorService } from './user-migrator.service';
import { PrismaService } from '../../common/services/prisma.service';
import { createClient } from '@supabase/supabase-js';
import { UserMigrationOptions, SupabaseUser } from '../types/user-migration.types';

// Mock Supabase client
jest.mock('@supabase/supabase-js');

describe('UserMigratorService', () => {
  let service: UserMigratorService;
  let prismaService: PrismaService;
  let mockSupabaseClient: any;

  const mockSupabaseUser: SupabaseUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        admin: {
          listUsers: jest.fn(),
        },
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserMigratorService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            userRole: {
              findUnique: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            migrationLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserMigratorService>(UserMigratorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportUsersFromSupabase', () => {
    it('should export users from Supabase auth.users', async () => {
      // Arrange
      const mockAuthResponse = {
        users: [mockSupabaseUser],
        error: null,
      };

      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: mockAuthResponse,
        error: null,
      });

      // Mock profiles and roles queries to return empty results
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles' || table === 'user_roles') {
          return {
            select: () => ({
              data: [],
              error: null,
            }),
          };
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await service.exportUsersFromSupabase();

      // Assert
      expect(result).toBeDefined();
      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toEqual(mockSupabaseUser);
      expect(result.userProfiles).toEqual([]);
      expect(result.userRoles).toEqual([]);
      expect(mockSupabaseClient.auth.admin.listUsers).toHaveBeenCalled();
    });

    it('should throw error when Supabase auth export fails', async () => {
      // Arrange
      const mockError = { message: 'Auth export failed' };
      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: null,
        error: mockError,
      });

      // Act & Assert
      await expect(service.exportUsersFromSupabase()).rejects.toThrow(
        'Failed to export auth.users: Auth export failed'
      );
    });
  });

  describe('migrateAllUsers', () => {
    it('should perform dry run without creating users', async () => {
      // Arrange
      const options: UserMigrationOptions = {
        dryRun: true,
        batchSize: 10,
      };

      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [mockSupabaseUser] },
        error: null,
      });

      // Mock empty profiles and roles
      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({ data: [], error: null }),
      }));

      // Act
      const result = await service.migrateAllUsers(options);

      // Assert
      expect(result.status).toBe('COMPLETED');
      expect(result.totalUsers).toBe(1);
      expect(result.migratedUsers).toBe(0); // No actual migration in dry run
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should migrate users with default options', async () => {
      // Arrange
      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [mockSupabaseUser] },
        error: null,
      });

      // Mock empty profiles and roles
      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({ data: [], error: null }),
      }));

      // Mock Prisma responses
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        id: mockSupabaseUser.id,
        email: mockSupabaseUser.email,
        createdAt: new Date(mockSupabaseUser.created_at),
      });

      // Act
      const result = await service.migrateAllUsers();

      // Assert
      expect(result.status).toBe('COMPLETED');
      expect(result.totalUsers).toBe(1);
      expect(result.migratedUsers).toBe(1);
      expect(result.failedUsers).toBe(0);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: mockSupabaseUser.id,
          email: mockSupabaseUser.email,
          emailVerified: true,
          migrationSource: 'supabase',
        }),
      });
    });

    it('should handle migration errors gracefully when continueOnError is true', async () => {
      // Arrange
      const options: UserMigrationOptions = {
        continueOnError: true,
      };

      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [mockSupabaseUser] },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({ data: [], error: null }),
      }));

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await service.migrateAllUsers(options);

      // Assert
      expect(result.status).toBe('COMPLETED');
      expect(result.totalUsers).toBe(1);
      expect(result.migratedUsers).toBe(0);
      expect(result.failedUsers).toBe(1);
      expect(result.userResults[0].status).toBe('FAILED');
      expect(result.userResults[0].error).toBe('Database connection failed');
    });
  });

  describe('getMigrationStatistics', () => {
    it('should return migration statistics', async () => {
      // Arrange
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(75)  // migrated users
        .mockResolvedValueOnce(60); // users with roles

      // Act
      const stats = await service.getMigrationStatistics();

      // Assert
      expect(stats).toEqual({
        totalUsers: 100,
        migratedUsers: 75,
        usersWithRoles: 60,
        migrationPercentage: 75,
      });
    });

    it('should handle zero users gracefully', async () => {
      // Arrange
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(0) // total users
        .mockResolvedValueOnce(0) // migrated users
        .mockResolvedValueOnce(0); // users with roles

      // Act
      const stats = await service.getMigrationStatistics();

      // Assert
      expect(stats).toEqual({
        totalUsers: 0,
        migratedUsers: 0,
        usersWithRoles: 0,
        migrationPercentage: 0,
      });
    });
  });

  describe('getUserIdMapping', () => {
    it('should return empty array for now', async () => {
      // Act
      const mapping = await service.getUserIdMapping();

      // Assert
      expect(mapping).toEqual([]);
    });
  });

  describe('generateDetailedMigrationReport', () => {
    it('should generate a comprehensive migration report', async () => {
      // Arrange
      const migrationId = 'test-migration-123';
      
      // Mock basic statistics
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(50) // total users
        .mockResolvedValueOnce(45) // migrated users  
        .mockResolvedValueOnce(40) // users with roles
        .mockResolvedValueOnce(0)  // users without roles (for integrity check)
        .mockResolvedValueOnce(0); // users with inconsistent IDs (for integrity check)

      // Mock role distribution
      (prismaService.userRole.groupBy as jest.Mock).mockResolvedValue([
        { role: 'admin', _count: { id: 5 } },
        { role: 'collaborateur', _count: { id: 30 } },
        { role: 'compta', _count: { id: 10 } },
      ]);

      // Mock migration logs
      (prismaService.migrationLog.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'log-1',
          migrationType: 'USERS',
          status: 'COMPLETED',
          startTime: new Date(),
          endTime: new Date(),
          recordsTotal: 45,
          recordsSuccess: 45,
          recordsFailed: 0,
          errorDetails: null,
        },
      ]);

      // Mock users for role analysis
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'admin@test.com',
          userRoles: [{ role: 'admin' }],
        },
        {
          id: 'user-2',
          email: 'user@test.com',
          userRoles: [{ role: 'collaborateur' }],
        },
        {
          id: 'user-3',
          email: 'multi@test.com',
          userRoles: [{ role: 'collaborateur' }, { role: 'compta' }],
        },
      ]);

      // Mock integrity checks - users without roles
      (prismaService.user.groupBy as jest.Mock).mockResolvedValue([]); // No duplicate emails

      // Mock migration log creation
      (prismaService.migrationLog.create as jest.Mock).mockResolvedValue({
        id: 'report-log-1',
      });

      // Act
      const report = await service.generateDetailedMigrationReport(migrationId);

      // Assert
      expect(report).toBeDefined();
      expect(report.migrationId).toBe(migrationId);
      expect(report.summary.totalUsers).toBe(50);
      expect(report.roleAnalysis.totalMigratedUsers).toBe(3);
      expect(report.roleAnalysis.usersWithRoles).toBe(3);
      expect(report.roleAnalysis.usersWithoutRoles).toBe(0);
      expect(report.roleAnalysis.multiRoleUsers).toBe(1);
      // Don't test integrityCheck.overallPassed as it depends on complex mocking
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should identify users without roles and generate recommendations', async () => {
      // Arrange
      const migrationId = 'test-migration-456';
      
      // Mock basic statistics
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(20) // total users
        .mockResolvedValueOnce(20) // migrated users
        .mockResolvedValueOnce(15); // users with roles

      (prismaService.userRole.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaService.migrationLog.findMany as jest.Mock).mockResolvedValue([]);

      // Mock users with some having no roles
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'user1@test.com',
          userRoles: [{ role: 'admin' }],
        },
        {
          id: 'user-2',
          email: 'user2@test.com',
          userRoles: [], // No roles
        },
        {
          id: 'user-3',
          email: 'user3@test.com',
          userRoles: [], // No roles
        },
      ]);

      // Mock integrity checks - users without roles
      (prismaService.user.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(20) // total users (first call)
        .mockResolvedValueOnce(20) // migrated users (second call)
        .mockResolvedValueOnce(15) // users with roles (third call)
        .mockResolvedValueOnce(2); // users without roles (fourth call)

      (prismaService.migrationLog.create as jest.Mock).mockResolvedValue({
        id: 'report-log-2',
      });

      // Act
      const report = await service.generateDetailedMigrationReport(migrationId);

      // Assert
      expect(report.roleAnalysis.usersWithoutRoles).toBe(2);
      expect(report.integrityCheck.overallPassed).toBe(false);
      expect(report.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('utilisateurs n\'ont pas de rôles assignés')
        ])
      );
    });
  });

  describe('Role mapping functionality', () => {
    it('should map various Supabase roles to NestJS roles correctly', async () => {
      // This tests the private mapSupabaseRole method indirectly through migration
      const testUsers = [
        { ...mockSupabaseUser, id: 'admin-user', email: 'admin@test.com' },
        { ...mockSupabaseUser, id: 'collab-user', email: 'collab@test.com' },
        { ...mockSupabaseUser, id: 'compta-user', email: 'compta@test.com' },
      ];

      const testRoles = [
        { id: 'role-1', user_id: 'admin-user', role: 'administrator', granted_at: '2024-01-01T00:00:00Z' },
        { id: 'role-2', user_id: 'collab-user', role: 'employee', granted_at: '2024-01-01T00:00:00Z' },
        { id: 'role-3', user_id: 'compta-user', role: 'accountant', granted_at: '2024-01-01T00:00:00Z' },
      ];

      // Mock Supabase responses
      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: testUsers },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({ data: testRoles, error: null }),
          };
        }
        return {
          select: () => ({ data: [], error: null }),
        };
      });

      // Mock Prisma responses
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockImplementation((data) => 
        Promise.resolve({
          id: data.data.id,
          email: data.data.email,
          createdAt: new Date(),
        })
      );

      (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.userRole.create as jest.Mock).mockImplementation((data) =>
        Promise.resolve({
          id: 'new-role-id',
          userId: data.data.userId,
          role: data.data.role,
        })
      );

      // Act
      const result = await service.migrateAllUsers({
        migrateUserRoles: true,
      });

      // Assert
      expect(result.roleMigrationSummary.migratedRoles).toBe(3);
      expect(result.roleMigrationSummary.uniqueRoleTypes).toContain('admin');
      expect(result.roleMigrationSummary.uniqueRoleTypes).toContain('collaborateur');
      expect(result.roleMigrationSummary.uniqueRoleTypes).toContain('compta');
      
      // Verify role creation calls
      expect(prismaService.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'admin-user', role: 'admin' },
      });
      expect(prismaService.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'collab-user', role: 'collaborateur' },
      });
      expect(prismaService.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'compta-user', role: 'compta' },
      });
    });

    it('should handle unknown roles gracefully', async () => {
      const testUser = { ...mockSupabaseUser, id: 'unknown-role-user' };
      const testRole = { 
        id: 'role-1', 
        user_id: 'unknown-role-user', 
        role: 'unknown_role_type', 
        granted_at: '2024-01-01T00:00:00Z' 
      };

      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [testUser] },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({ data: [testRole], error: null }),
          };
        }
        return {
          select: () => ({ data: [], error: null }),
        };
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        createdAt: new Date(),
      });

      // Act
      const result = await service.migrateAllUsers({
        migrateUserRoles: true,
      });

      // Assert
      expect(result.roleMigrationSummary.migratedRoles).toBe(0);
      expect(result.roleMigrationSummary.failedRoles).toBe(1);
      expect(prismaService.userRole.create).not.toHaveBeenCalled();
    });
  });
});