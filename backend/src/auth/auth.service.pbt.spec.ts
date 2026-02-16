import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/services/prisma.service';
import { AppRole } from '@prisma/client';
import * as fc from 'fast-check';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Property-Based Tests for Authentication Service
 * **Property 11: Migrated User Authentication Security**
 * **Validates: Requirements 2.6, 2.8**
 */
describe('AuthService - Property-Based Tests', () => {
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
            $transaction: jest.fn(),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 11.1: Authentication Security for Migrated Users', () => {
    /**
     * Property: Migrated users should authenticate successfully with valid credentials
     * and maintain security properties
     */
    it('should authenticate migrated users securely', async () => {
      const migratedUserGenerator = fc.record({
        id: fc.uuid(),
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8, maxLength: 20 }),
        migrationSource: fc.constant('supabase'),
        emailVerified: fc.boolean(),
        resetToken: fc.option(fc.string(), { nil: null }),
        resetExpiry: fc.option(fc.date({ min: new Date() }), { nil: null }),
        userRoles: fc.array(
          fc.record({
            role: fc.constantFrom('admin', 'collaborateur', 'compta'),
          }),
          { minLength: 1, maxLength: 2 }
        ),
      });

      await fc.assert(
        fc.asyncProperty(
          migratedUserGenerator,
          async (userData) => {
            // Hash the password for storage
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            
            const mockUser = {
              ...userData,
              password: hashedPassword,
              lastSignIn: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Mock database responses
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

            // Test authentication
            const result = await service.login({
              email: userData.email,
              password: userData.password,
            });

            // Verify authentication response structure
            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('requiresPasswordReset');

            // Verify user data integrity
            expect(result.user.id).toBe(userData.id);
            expect(result.user.email).toBe(userData.email);
            expect(result.user.migrationSource).toBe('supabase');
            expect(result.user.roles).toEqual(userData.userRoles.map(r => r.role));

            // Verify password reset requirement logic
            const hasActiveResetToken = userData.resetToken && userData.resetExpiry && userData.resetExpiry > new Date();
            expect(result.requiresPasswordReset).toBe(!!hasActiveResetToken);

            // Verify JWT token generation
            expect(jwtService.sign).toHaveBeenCalledWith({
              email: userData.email,
              sub: userData.id,
              roles: userData.userRoles.map(r => r.role),
              migrationSource: 'supabase',
            });

            // Verify last sign-in update
            expect(prismaService.user.update).toHaveBeenCalledWith({
              where: { id: userData.id },
              data: { lastSignIn: expect.any(Date) },
            });
          }
        ),
        { numRuns: 3, timeout: 15000 }
      );
    }, 20000);
  });

  describe('Property 11.2: Password Reset Security for Migrated Users', () => {
    /**
     * Property: Password reset should be secure and work correctly for migrated users
     */
    it('should handle password reset securely for migrated users', async () => {
      const passwordResetGenerator = fc.record({
        id: fc.uuid(),
        email: fc.emailAddress(),
        migrationSource: fc.constant('supabase'),
        currentPassword: fc.string({ minLength: 8, maxLength: 20 }),
        newPassword: fc.string({ minLength: 8, maxLength: 20 }),
      });

      await fc.assert(
        fc.asyncProperty(
          passwordResetGenerator,
          async (userData) => {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedResetToken = await bcrypt.hash(resetToken, 10);
            const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const mockUser = {
              id: userData.id,
              email: userData.email,
              password: await bcrypt.hash(userData.currentPassword, 12),
              migrationSource: userData.migrationSource,
              resetToken: hashedResetToken,
              resetExpiry,
              emailVerified: false,
            };

            // Mock database responses for reset request
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

            // Test password reset request
            const resetRequest = await service.requestPasswordReset({
              email: userData.email,
            });

            expect(resetRequest.message).toBe('If the email exists, a reset link has been sent');

            // Verify reset token was saved
            expect(prismaService.user.update).toHaveBeenCalledWith({
              where: { id: userData.id },
              data: {
                resetToken: expect.any(String),
                resetExpiry: expect.any(Date),
              },
            });

            // Mock for password reset execution
            (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

            // Test password reset execution
            const resetResult = await service.resetPassword({
              token: resetToken,
              newPassword: userData.newPassword,
            });

            expect(resetResult.message).toBe('Password reset successful');

            // Verify password was updated and tokens cleared
            expect(prismaService.user.update).toHaveBeenCalledWith({
              where: { id: userData.id },
              data: {
                password: expect.any(String),
                resetToken: null,
                resetExpiry: null,
                emailVerified: true,
              },
            });
          }
        ),
        { numRuns: 3, timeout: 15000 }
      );
    }, 20000);
  });

  describe('Property 11.3: Role-Based Access Control for Migrated Users', () => {
    /**
     * Property: Migrated users should maintain their role assignments correctly
     */
    it('should preserve and validate roles for migrated users', async () => {
      const roleTestGenerator = fc.record({
        id: fc.uuid(),
        email: fc.emailAddress(),
        migrationSource: fc.constant('supabase'),
        roles: fc.array(
          fc.constantFrom('admin', 'collaborateur', 'compta'),
          { minLength: 1, maxLength: 3 }
        ).map(roles => [...new Set(roles)]), // Remove duplicates
      });

      await fc.assert(
        fc.asyncProperty(
          roleTestGenerator,
          async (userData) => {
            const mockUser = {
              id: userData.id,
              email: userData.email,
              password: await bcrypt.hash('password123', 12),
              migrationSource: userData.migrationSource,
              emailVerified: true,
              resetToken: null,
              resetExpiry: null,
              lastSignIn: null,
              userRoles: userData.roles.map(role => ({ role: role as AppRole })),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Mock database response
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

            // Test profile retrieval
            const profile = await service.getProfile(userData.id);

            // Verify role preservation
            expect(profile.roles).toEqual(userData.roles);
            expect(profile.migrationSource).toBe('supabase');
            expect(profile.id).toBe(userData.id);
            expect(profile.email).toBe(userData.email);

            // Test migration status check
            const isMigrated = await service.isMigratedUser(userData.id);
            expect(isMigrated).toBe(true);

            // Verify each role is valid
            for (const role of userData.roles) {
              expect(['admin', 'collaborateur', 'compta']).toContain(role);
            }
          }
        ),
        { numRuns: 3, timeout: 15000 }
      );
    }, 20000);
  });

  describe('Property 11.4: Authentication Failure Security', () => {
    /**
     * Property: Invalid authentication attempts should fail securely without information leakage
     */
    it('should handle authentication failures securely', async () => {
      const failureTestGenerator = fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 1, maxLength: 50 }),
        scenario: fc.constantFrom('user_not_found', 'wrong_password', 'expired_reset'),
      });

      await fc.assert(
        fc.asyncProperty(
          failureTestGenerator,
          async (testData) => {
            // Setup different failure scenarios
            switch (testData.scenario) {
              case 'user_not_found':
                (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
                break;
              
              case 'wrong_password':
                const mockUser = {
                  id: 'test-id',
                  email: testData.email,
                  password: await bcrypt.hash('different-password', 12),
                  migrationSource: 'supabase',
                  userRoles: [{ role: 'collaborateur' }],
                };
                (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
                break;
              
              case 'expired_reset':
                const expiredUser = {
                  id: 'test-id',
                  email: testData.email,
                  resetToken: 'expired-token',
                  resetExpiry: new Date(Date.now() - 1000), // Expired
                };
                (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
                break;
            }

            // Test authentication failure
            if (testData.scenario !== 'expired_reset') {
              await expect(
                service.login({
                  email: testData.email,
                  password: testData.password,
                })
              ).rejects.toThrow(UnauthorizedException);
            }

            // Test password reset with invalid token
            if (testData.scenario === 'expired_reset') {
              await expect(
                service.resetPassword({
                  token: 'invalid-token',
                  newPassword: 'newpassword123',
                })
              ).rejects.toThrow(BadRequestException);
            }

            // Verify no sensitive information is leaked in error messages
            try {
              await service.login({
                email: testData.email,
                password: testData.password,
              });
            } catch (error) {
              expect(error.message).not.toContain(testData.email);
              expect(error.message).not.toContain('user');
              expect(error.message).toBe('Invalid credentials');
            }
          }
        ),
        { numRuns: 3, timeout: 15000 }
      );
    }, 20000);
  });

  describe('Property 11.5: Migration Statistics Accuracy', () => {
    /**
     * Property: Migration statistics should accurately reflect the state of migrated users
     */
    it('should provide accurate migration statistics', async () => {
      const statsGenerator = fc.record({
        totalUsers: fc.integer({ min: 1, max: 100 }),
        migratedUsers: fc.integer({ min: 0, max: 50 }),
        usersRequiringReset: fc.integer({ min: 0, max: 25 }),
      }).filter(data => data.migratedUsers <= data.totalUsers && data.usersRequiringReset <= data.totalUsers);

      await fc.assert(
        fc.asyncProperty(
          statsGenerator,
          async (testData) => {
            // Mock database counts
            (prismaService.user.count as jest.Mock)
              .mockResolvedValueOnce(testData.totalUsers) // Total users
              .mockResolvedValueOnce(testData.migratedUsers) // Migrated users
              .mockResolvedValueOnce(testData.usersRequiringReset); // Users requiring reset

            // Mock last migrated user
            const lastMigratedDate = new Date();
            (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
              createdAt: lastMigratedDate,
            });

            // Get migration statistics
            const stats = await service.getMigrationStats();

            // Verify statistics accuracy
            expect(stats.totalUsers).toBe(testData.totalUsers);
            expect(stats.migratedUsers).toBe(testData.migratedUsers);
            expect(stats.usersRequiringPasswordReset).toBe(testData.usersRequiringReset);
            expect(stats.lastMigrationDate).toEqual(lastMigratedDate);

            // Verify logical constraints
            expect(stats.migratedUsers).toBeLessThanOrEqual(stats.totalUsers);
            expect(stats.usersRequiringPasswordReset).toBeLessThanOrEqual(stats.totalUsers);
            expect(stats.migratedUsers).toBeGreaterThanOrEqual(0);
            expect(stats.usersRequiringPasswordReset).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 3, timeout: 15000 }
      );
    }, 20000);
  });
});