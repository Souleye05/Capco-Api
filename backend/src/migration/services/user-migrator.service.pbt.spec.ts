import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/services/prisma.service';
import { UserMigratorService } from './user-migrator.service';
import { 
  UserMigrationOptions, 
  SupabaseUser, 
  UserMigrationStatus,
} from '../types/user-migration.types';
import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');

/**
 * Property-Based Tests for User Migration Service
 * **Property 9: User Migration Completeness and Security**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.9**
 */
describe('UserMigratorService - Property-Based Tests', () => {
  let service: UserMigratorService;
  let prismaService: PrismaService;
  let mockSupabaseClient: any;

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
    jest.clearAllTimers();
  });

  afterAll(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });
  describe('Property 9.1: User Export Completeness', () => {
    /**
     * Property: For any set of Supabase users, export should return all users
     * with preserved IDs, emails, and timestamps
     */
    it('should export all users with complete data preservation', async () => {
      // Fast-check generator for test data
      const supabaseUserGenerator = fc.record({
        id: fc.uuid(),
        email: fc.emailAddress(),
        created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
        updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
        last_sign_in_at: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
        email_confirmed_at: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(supabaseUserGenerator, { minLength: 1, maxLength: 3 }),
          async (testUsers) => {
            // Setup mock to return test users
            mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
              data: { users: testUsers },
              error: null,
            });

            // Mock empty profiles and roles
            mockSupabaseClient.from.mockImplementation(() => ({
              select: () => ({ data: [], error: null }),
            }));

            // Execute export
            const exportedData = await service.exportUsersFromSupabase();

            // Verify completeness
            expect(exportedData.users).toHaveLength(testUsers.length);

            // Verify data integrity for each user
            for (let i = 0; i < testUsers.length; i++) {
              const original = testUsers[i];
              const exported = exportedData.users[i];

              // ID preservation - relaxed UUID validation
              expect(exported.id).toBe(original.id);
              expect(exported.id).toHaveLength(36);
              expect(exported.id).toMatch(/^[0-9a-f-]+$/i);

              // Email preservation
              expect(exported.email).toBe(original.email);
              expect(exported.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

              // Timestamp preservation
              expect(exported.created_at).toBe(original.created_at);
              expect(exported.updated_at).toBe(original.updated_at);
            }
          }
        ),
        { numRuns: 2, timeout: 15000 }
      );
    }, 20000);
  });

  describe('Property 9.2: User Migration Integrity', () => {
    /**
     * Property: Migration should preserve user identity and create valid accounts
     */
    it('should migrate users with preserved identity and secure passwords', async () => {
      const supabaseUserGenerator = fc.record({
        id: fc.uuid(),
        email: fc.emailAddress(),
        created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
        updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(supabaseUserGenerator, { minLength: 1, maxLength: 3 }),
          async (testUsers) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();
            
            // Setup export mocks
            mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
              data: { users: testUsers },
              error: null,
            });

            mockSupabaseClient.from.mockImplementation(() => ({
              select: () => ({ data: [], error: null }),
            }));

            // Setup Prisma mocks
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.user.create as jest.Mock).mockImplementation((data) =>
              Promise.resolve({
                id: data.data.id,
                email: data.data.email,
                createdAt: new Date(data.data.createdAt || Date.now()),
                migrationSource: 'supabase',
              })
            );

            const report = await service.migrateAllUsers({
              preserveUserIds: true,
              passwordMigrationStrategy: 'TEMPORARY_ONLY',
            });

            // Verify migration completeness
            expect(report.totalUsers).toBe(testUsers.length);
            expect(report.migratedUsers).toBe(testUsers.length);
            expect(report.failedUsers).toBe(0);
            expect(report.status).toBe('COMPLETED');

            // Verify user creation calls
            expect(prismaService.user.create).toHaveBeenCalledTimes(testUsers.length);

            // Verify each user was created with correct data
            for (let i = 0; i < testUsers.length; i++) {
              const originalUser = testUsers[i];
              const createCall = (prismaService.user.create as jest.Mock).mock.calls[i][0];
              const userData = createCall.data;

              // ID preservation
              expect(userData.id).toBe(originalUser.id);
              
              // Email preservation
              expect(userData.email).toBe(originalUser.email);
              
              // Migration metadata
              expect(userData.migrationSource).toBe('supabase');
              
              // Password security (should be hashed)
              expect(userData.password).toBeDefined();
              expect(userData.password.length).toBeGreaterThan(10);
            }
          }
        ),
        { numRuns: 2, timeout: 15000 }
      );
    }, 20000);
  });
  describe('Property 9.3: Password Security', () => {
    /**
     * Property: All migrated users should have secure password handling
     */
    it('should generate secure temporary passwords for all users', async () => {
      const supabaseUserGenerator = fc.record({
        id: fc.uuid(),
        email: fc.emailAddress(),
        created_at: fc.date().map(d => d.toISOString()),
        updated_at: fc.date().map(d => d.toISOString()),
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(supabaseUserGenerator, { minLength: 1, maxLength: 3 }),
          async (testUsers) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();
            
            mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
              data: { users: testUsers },
              error: null,
            });

            mockSupabaseClient.from.mockImplementation(() => ({
              select: () => ({ data: [], error: null }),
            }));

            const createdUsers: any[] = [];
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.user.create as jest.Mock).mockImplementation((data) => {
              const user = {
                id: data.data.id,
                email: data.data.email,
                password: data.data.password,
                createdAt: new Date(),
              };
              createdUsers.push(user);
              return Promise.resolve(user);
            });

            await service.migrateAllUsers({
              passwordMigrationStrategy: 'TEMPORARY_ONLY',
            });

            // Verify all users have secure passwords
            expect(createdUsers).toHaveLength(testUsers.length);
            
            createdUsers.forEach(user => {
              // Password should be hashed (bcrypt hashes are typically 60 characters)
              expect(user.password).toBeDefined();
              expect(user.password.length).toBeGreaterThanOrEqual(50);
              expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
            });

            // All passwords should be unique (very high probability with proper random generation)
            const passwords = createdUsers.map(u => u.password);
            const uniquePasswords = new Set(passwords);
            expect(uniquePasswords.size).toBe(passwords.length);
          }
        ),
        { numRuns: 2, timeout: 15000 }
      );
    }, 20000);
  });

  describe('Property 9.4: Error Handling', () => {
    /**
     * Property: Migration should handle various error conditions gracefully
     */
    it('should handle database errors gracefully with proper error reporting', async () => {
      const supabaseUserGenerator = fc.record({
        id: fc.uuid(),
        email: fc.emailAddress(),
        created_at: fc.date().map(d => d.toISOString()),
        updated_at: fc.date().map(d => d.toISOString()),
      });

      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.array(supabaseUserGenerator, { minLength: 2, maxLength: 3 }),
            fc.integer({ min: 0, max: 1 }) // Number of users that will fail
          ),
          async ([testUsers, failureCount]) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();
            
            mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
              data: { users: testUsers },
              error: null,
            });

            mockSupabaseClient.from.mockImplementation(() => ({
              select: () => ({ data: [], error: null }),
            }));

            // Mock partial failures
            let createCallCount = 0;
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.user.create as jest.Mock).mockImplementation((data) => {
              createCallCount++;
              if (createCallCount <= failureCount) {
                return Promise.reject(new Error(`Database error for user ${createCallCount}`));
              }
              return Promise.resolve({
                id: data.data.id,
                email: data.data.email,
                createdAt: new Date(),
              });
            });

            const report = await service.migrateAllUsers({
              continueOnError: true,
            });

            // Verify error handling
            expect(report.totalUsers).toBe(testUsers.length);
            expect(report.failedUsers).toBe(failureCount);
            expect(report.migratedUsers).toBe(testUsers.length - failureCount);

            // Verify error details
            const failedResults = report.userResults.filter(r => r.status === UserMigrationStatus.FAILED);
            expect(failedResults).toHaveLength(failureCount);
            
            failedResults.forEach((result, index) => {
              expect(result.error).toContain(`Database error for user ${index + 1}`);
            });
          }
        ),
        { numRuns: 2, timeout: 15000 }
      );
    }, 20000);

    /**
     * Property: Migration should handle Supabase export errors appropriately
     */
    it('should handle Supabase export errors with proper error propagation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('Auth service unavailable'),
            fc.constant('Network timeout'),
            fc.constant('Invalid credentials')
          ),
          async (errorMessage) => {
            // Mock Supabase export failure
            mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
              data: null,
              error: { message: errorMessage },
            });

            // Should throw error with proper message - check for the full error message
            await expect(service.exportUsersFromSupabase()).rejects.toThrow(
              `Failed to export auth.users: ${errorMessage}`
            );
          }
        ),
        { numRuns: 2 }
      );
    }, 10000);
  });
});