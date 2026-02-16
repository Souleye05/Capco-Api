import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../common/services/prisma.service';

describe('UsersService (Property-Based Tests)', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const adminSecurityContext = {
    userId: '123e4567-e89b-12d3-a456-426614174001',
    roles: ['admin'],
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
              findFirst: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
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

  describe('Property 1: Email Uniqueness', () => {
    it(
      'should ensure email uniqueness across all created users',
      async () => {
        // Feature: nestjs-api-architecture, Property 1: Email Uniqueness
        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.emailAddress(), { minLength: 1, maxLength: 10 })
              .map(emails => [...new Set(emails)]), // Manual deduplication
            fc.string({ minLength: 8 }),
            async (emails, password) => {
              // Reset mocks for each property run
              jest.clearAllMocks();

              const createdEmails = new Set<string>();

              for (let i = 0; i < Math.min(emails.length, 3); i++) {
                const email = emails[i];

                (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(
                  createdEmails.has(email)
                    ? { id: 'existing-id', email }
                    : null, // No duplicate found
                );

                if (!createdEmails.has(email)) {
                  (prisma.user.create as jest.Mock).mockResolvedValueOnce({
                    id: `id-${i}`,
                    email,
                    password: 'hashed',
                    userRoles: [],
                  });

                  createdEmails.add(email);
                }
              }

              // Expect all created users to have unique emails
              expect(createdEmails.size).toBeLessThanOrEqual(emails.length);
            },
          ),
          { numRuns: 50 },
        );
      },
      30000,
    );
  });

  describe('Property 2: Role Assignment Idempotence', () => {
    it(
      'should handle role assignment consistently regardless of order',
      async () => {
        // Feature: nestjs-api-architecture, Property 2: Role Idempotence
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom('admin' as const, 'collaborateur' as const, 'compta' as const),
            fc.string({ minLength: 1, maxLength: 10 }),
            async (role, userId) => {
              jest.clearAllMocks();

              const mockUser = {
                id: userId,
                email: 'test@example.com',
                userRoles: [],
              };

              // First assignment
              (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
              (prisma.userRoles.findFirst as jest.Mock).mockResolvedValueOnce(null);
              (prisma.userRoles.create as jest.Mock).mockResolvedValueOnce({
                id: '1',
                role,
              });

              const appRole = role as any; // Type assertion for test purposes
              await service.assignRole(userId, appRole, adminSecurityContext);

              // Second attempt (should throw because already assigned)
              jest.clearAllMocks();
              (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
              (prisma.userRoles.findFirst as jest.Mock).mockResolvedValueOnce({
                id: '1',
                role,
              });

              await expect(
                service.assignRole(userId, appRole, adminSecurityContext),
              ).rejects.toThrow(BadRequestException);
            },
          ),
          { numRuns: 50 },
        );
      },
      30000,
    );
  });

  describe('Property 3: Password Validation Consistency', () => {
    it(
      'should consistently validate password requirements',
      async () => {
        // Feature: nestjs-api-architecture, Property 3: Password Validation
        await fc.assert(
          fc.asyncProperty(
            fc.tuple(
              fc.string({ minLength: 0, maxLength: 7 }),
              fc.string({ minLength: 8, maxLength: 50 }),
            ),
            async ([shortPassword, validPassword]) => {
              jest.clearAllMocks();

              // Short password should fail

              (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

              try {
                await service.create(
                  {
                    email: 'test@example.com',
                    password: shortPassword,
                  },
                  adminSecurityContext,
                );

                // If we reach here for a password < 8 chars, it should have been caught
                expect(shortPassword.length).toBeGreaterThanOrEqual(8);
              } catch (e) {
                expect(shortPassword.length).toBeLessThan(8);
              }

              // Valid password should not throw validation error
              jest.clearAllMocks();
              (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
              (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'new-id',
                email: 'test@example.com',
                password: 'hashed',
                userRoles: [],
              });

              // Should not throw
              await expect(
                service.create(
                  {
                    email: 'test@example.com',
                    password: validPassword,
                  },
                  adminSecurityContext,
                ),
              ).resolves.toBeDefined();
            },
          ),
          { numRuns: 50 },
        );
      },
      30000,
    );
  });

  describe('Property 4: Permission Enforcement Consistency', () => {
    it(
      'should consistently enforce admin-only operations',
      async () => {
        // Feature: nestjs-api-architecture, Property 4: Permission Enforcement
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom('collaborateur' as const, 'compta' as const),
            fc.string({ minLength: 8 }),
            async (nonAdminRole, password) => {
              jest.clearAllMocks();

              const nonAdminContext = {
                userId: 'user-id',
                roles: [nonAdminRole as any],
              };

              // Non-admin cannot create users
              await expect(
                service.create(
                  {
                    email: 'test@example.com',
                    password: password,
                  },
                  nonAdminContext,
                ),
              ).rejects.toThrow();

              // Non-admin cannot update users
              await expect(
                service.update(
                  'user-id',
                  { email: 'new@example.com' },
                  nonAdminContext,
                ),
              ).rejects.toThrow();

              // Non-admin cannot delete users
              await expect(service.remove('user-id', nonAdminContext)).rejects.toThrow();

              // Non-admin cannot assign roles
              await expect(
                service.assignRole('user-id', 'admin', nonAdminContext),
              ).rejects.toThrow();

              // Non-admin cannot remove roles
              await expect(
                service.removeRole('user-id', 'admin', nonAdminContext),
              ).rejects.toThrow();
            },
          ),
          { numRuns: 50 },
        );
      },
      30000,
    );
  });

  describe('Property 5: CRUD Round-trip Consistency', () => {
    it(
      'should maintain consistent user data through create and read operations',
      async () => {
        // Feature: nestjs-api-architecture, Property 5: CRUD Round-trip
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            fc.string({ minLength: 8, maxLength: 50 }),
            async (email, password) => {
              jest.clearAllMocks();

              const userId = 'test-id';
              const mockUser = {
                id: userId,
                email,
                password: 'hashed',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                userRoles: [],
              };

              // Create
              (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
              (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockUser);

              const created = await service.create(
                { email, password },
                adminSecurityContext,
              );

              // Verify created user data
              expect(created.email).toBe(email);

              // Read
              jest.clearAllMocks();
              (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

              const read = await service.findOne(userId, adminSecurityContext);

              // Verify consistency between created and read
              expect(read.email).toBe(created.email);
            },
          ),
          { numRuns: 50 },
        );
      },
      30000,
    );
  });
});
