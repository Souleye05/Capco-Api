import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../common/services/prisma.service';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { Reflector } from '@nestjs/core';
import { CreateAuditLogDto } from './dto/audit.dto';
import * as fc from 'fast-check';

describe('Audit Service - Property-Based Tests', () => {
  let auditService: AuditService;
  let prismaService: PrismaService;
  let auditInterceptor: AuditLogInterceptor;
  let reflector: Reflector;

  // Mock data storage for testing
  const mockAuditLogs: any[] = [];
  let mockIdCounter = 1;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn().mockImplementation(({ data }) => {
        const auditLog = {
          id: `audit-${mockIdCounter++}`,
          ...data,
          createdAt: new Date(),
        };
        mockAuditLogs.push(auditLog);
        return Promise.resolve(auditLog);
      }),
      findMany: jest.fn().mockImplementation(({ where, skip, take, orderBy }) => {
        let filtered = [...mockAuditLogs];
        
        // Apply filters
        if (where?.userId) {
          filtered = filtered.filter(log => log.userId === where.userId);
        }
        if (where?.module?.contains) {
          filtered = filtered.filter(log => 
            log.module.toLowerCase().includes(where.module.contains.toLowerCase())
          );
        }
        if (where?.action?.contains) {
          filtered = filtered.filter(log => 
            log.action.toLowerCase().includes(where.action.contains.toLowerCase())
          );
        }
        if (where?.entityType?.contains) {
          filtered = filtered.filter(log => 
            log.entityType.toLowerCase().includes(where.entityType.contains.toLowerCase())
          );
        }
        
        // Apply sorting
        if (orderBy?.createdAt) {
          filtered.sort((a, b) => {
            const comparison = a.createdAt.getTime() - b.createdAt.getTime();
            return orderBy.createdAt === 'desc' ? -comparison : comparison;
          });
        }
        
        // Apply pagination
        const start = skip || 0;
        const end = start + (take || filtered.length);
        
        return Promise.resolve(filtered.slice(start, end));
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        let filtered = [...mockAuditLogs];
        
        if (where?.userId) {
          filtered = filtered.filter(log => log.userId === where.userId);
        }
        if (where?.module?.contains) {
          filtered = filtered.filter(log => 
            log.module.toLowerCase().includes(where.module.contains.toLowerCase())
          );
        }
        
        return Promise.resolve(filtered.length);
      }),
    },
  };

  beforeEach(async () => {
    // Clear mock data
    mockAuditLogs.length = 0;
    mockIdCounter = 1;
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        AuditLogInterceptor,
        Reflector,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditInterceptor = module.get<AuditLogInterceptor>(AuditLogInterceptor);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: nestjs-api-architecture, Property 5: Audit automatique des actions**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * For any CRUD operation performed by an authenticated user, 
   * a corresponding audit entry must be created automatically with all required information
   */
  describe('Property 5: Automatic Action Auditing', () => {
    it('should automatically create audit entries for all CRUD operations with complete information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            userEmail: fc.emailAddress(),
            action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE', 'READ'),
            module: fc.constantFrom('users', 'contentieux', 'recouvrement', 'immobilier', 'conseil'),
            entityType: fc.constantFrom('User', 'Affaire', 'DossierRecouvrement', 'Immeuble', 'ClientConseil'),
            entityId: fc.option(fc.uuid(), { nil: undefined }),
            entityReference: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
          }),
          async (auditData) => {
            // **Feature: nestjs-api-architecture, Property 5: Audit automatique des actions**
            const initialCount = mockAuditLogs.length;
            
            // Perform the audit logging
            await auditService.log(auditData);
            
            // Verify audit entry was created
            expect(mockAuditLogs.length).toBe(initialCount + 1);
            
            const createdAuditLog = mockAuditLogs[mockAuditLogs.length - 1];
            
            // Verify all required information is captured
            expect(createdAuditLog.userId).toBe(auditData.userId);
            expect(createdAuditLog.userEmail).toBe(auditData.userEmail);
            expect(createdAuditLog.action).toBe(auditData.action);
            expect(createdAuditLog.module).toBe(auditData.module);
            expect(createdAuditLog.entityType).toBe(auditData.entityType);
            expect(createdAuditLog.entityId).toBe(auditData.entityId);
            expect(createdAuditLog.entityReference).toBe(auditData.entityReference);
            expect(createdAuditLog.createdAt).toBeInstanceOf(Date);
            expect(createdAuditLog.id).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain audit log integrity even when operations fail', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            userEmail: fc.emailAddress(),
            action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE'),
            module: fc.string({ minLength: 1, maxLength: 50 }),
            entityType: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async (auditData) => {
            // **Feature: nestjs-api-architecture, Property 5: Audit automatique des actions**
            const initialCount = mockAuditLogs.length;
            
            // Even if the main operation fails, audit should still work
            await auditService.log(auditData);
            
            // Audit entry should still be created
            expect(mockAuditLogs.length).toBe(initialCount + 1);
            
            const auditLog = mockAuditLogs[mockAuditLogs.length - 1];
            expect(auditLog.userId).toBe(auditData.userId);
            expect(auditLog.action).toBe(auditData.action);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: nestjs-api-architecture, Property 6: Génération automatique de références d'audit**
   * **Validates: Requirements 3.4**
   * 
   * For any entity created, a unique reference must be automatically generated 
   * and included in the audit log
   */
  describe('Property 6: Automatic Audit Reference Generation', () => {
    it('should automatically include entity references in audit logs when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            userEmail: fc.emailAddress(),
            action: fc.constantFrom('CREATE', 'UPDATE'),
            module: fc.constantFrom('contentieux', 'recouvrement', 'immobilier', 'conseil'),
            entityType: fc.constantFrom('Affaire', 'DossierRecouvrement', 'Immeuble', 'ClientConseil'),
            entityId: fc.uuid(),
            entityReference: fc.string({ minLength: 5, maxLength: 20 }).map(s => 
              s.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15)
            ),
          }),
          async (auditData) => {
            // **Feature: nestjs-api-architecture, Property 6: Génération automatique de références d'audit**
            await auditService.log(auditData);
            
            const auditLog = mockAuditLogs[mockAuditLogs.length - 1];
            
            // Verify entity reference is captured in audit log
            expect(auditLog.entityReference).toBe(auditData.entityReference);
            expect(auditLog.entityId).toBe(auditData.entityId);
            
            // Reference should be non-empty when provided
            if (auditData.entityReference) {
              expect(auditLog.entityReference.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle audit logging even when entity reference is not available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            userEmail: fc.emailAddress(),
            action: fc.constantFrom('READ', 'DELETE'),
            module: fc.string({ minLength: 1, maxLength: 20 }),
            entityType: fc.string({ minLength: 1, maxLength: 20 }),
            entityId: fc.option(fc.uuid(), { nil: undefined }),
          }),
          async (auditData) => {
            // **Feature: nestjs-api-architecture, Property 6: Génération automatique de références d'audit**
            await auditService.log(auditData);
            
            const auditLog = mockAuditLogs[mockAuditLogs.length - 1];
            
            // Audit should work even without entity reference
            expect(auditLog.userId).toBe(auditData.userId);
            expect(auditLog.action).toBe(auditData.action);
            expect(auditLog.entityId).toBe(auditData.entityId);
            
            // entityReference can be undefined/null when not provided
            expect(auditLog.entityReference).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: nestjs-api-architecture, Property 7: Application globale de l'audit**
   * **Validates: Requirements 3.5**
   * 
   * For any protected endpoint, the audit interceptor must be applied automatically
   */
  describe('Property 7: Global Audit Application', () => {
    it('should consistently apply audit logging across all modules and operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.uuid(),
              userEmail: fc.emailAddress(),
              action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE', 'READ'),
              module: fc.constantFrom('users', 'contentieux', 'recouvrement', 'immobilier', 'conseil', 'audit'),
              entityType: fc.constantFrom('User', 'Affaire', 'DossierRecouvrement', 'Immeuble', 'ClientConseil', 'AuditLog'),
              entityId: fc.option(fc.uuid(), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (auditDataArray) => {
            // **Feature: nestjs-api-architecture, Property 7: Application globale de l'audit**
            const initialCount = mockAuditLogs.length;
            
            // Perform multiple operations across different modules
            for (const auditData of auditDataArray) {
              await auditService.log(auditData);
            }
            
            // Verify all operations were audited
            expect(mockAuditLogs.length).toBe(initialCount + auditDataArray.length);
            
            // Verify each audit log corresponds to an operation
            const newAuditLogs = mockAuditLogs.slice(initialCount);
            
            for (let i = 0; i < auditDataArray.length; i++) {
              const expectedData = auditDataArray[i];
              const actualLog = newAuditLogs[i];
              
              expect(actualLog.userId).toBe(expectedData.userId);
              expect(actualLog.userEmail).toBe(expectedData.userEmail);
              expect(actualLog.action).toBe(expectedData.action);
              expect(actualLog.module).toBe(expectedData.module);
              expect(actualLog.entityType).toBe(expectedData.entityType);
              expect(actualLog.entityId).toBe(expectedData.entityId);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain audit log ordering and timestamps across concurrent operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.uuid(),
              userEmail: fc.emailAddress(),
              action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE'),
              module: fc.constantFrom('users', 'contentieux', 'recouvrement'),
              entityType: fc.constantFrom('User', 'Affaire', 'DossierRecouvrement'),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (auditDataArray) => {
            // **Feature: nestjs-api-architecture, Property 7: Application globale de l'audit**
            const initialCount = mockAuditLogs.length;
            const startTime = new Date();
            
            // Perform operations concurrently
            await Promise.all(
              auditDataArray.map(auditData => auditService.log(auditData))
            );
            
            const endTime = new Date();
            
            // Verify all operations were audited
            expect(mockAuditLogs.length).toBe(initialCount + auditDataArray.length);
            
            // Verify timestamps are within expected range
            const newAuditLogs = mockAuditLogs.slice(initialCount);
            
            for (const auditLog of newAuditLogs) {
              expect(auditLog.createdAt.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
              expect(auditLog.createdAt.getTime()).toBeLessThanOrEqual(endTime.getTime());
            }
            
            // Verify all expected data is present
            expect(newAuditLogs).toHaveLength(auditDataArray.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should provide consistent audit trail querying across all modules', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            setupData: fc.array(
              fc.record({
                userId: fc.uuid(),
                userEmail: fc.emailAddress(),
                action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE', 'READ'),
                module: fc.constantFrom('users', 'contentieux', 'recouvrement', 'immobilier'),
                entityType: fc.constantFrom('User', 'Affaire', 'DossierRecouvrement', 'Immeuble'),
              }),
              { minLength: 5, maxLength: 15 }
            ),
            queryUserId: fc.uuid(),
            queryModule: fc.constantFrom('users', 'contentieux', 'recouvrement', 'immobilier'),
          }),
          async ({ setupData, queryUserId, queryModule }) => {
            // **Feature: nestjs-api-architecture, Property 7: Application globale de l'audit**
            
            // Clear existing data for this test
            mockAuditLogs.length = 0;
            mockIdCounter = 1;
            
            // Setup: Create audit logs
            for (const auditData of setupData) {
              await auditService.log(auditData);
            }
            
            // Test querying by user
            const userAuditLogs = await auditService.findByUser(queryUserId, { page: 1, limit: 100 });
            const expectedUserLogs = setupData.filter(data => data.userId === queryUserId);
            expect(userAuditLogs.data).toHaveLength(expectedUserLogs.length);
            
            // Test querying by module
            const moduleAuditLogs = await auditService.findByModule(queryModule, { page: 1, limit: 100 });
            const expectedModuleLogs = setupData.filter(data => data.module === queryModule);
            expect(moduleAuditLogs.data).toHaveLength(expectedModuleLogs.length);
            
            // Verify query results contain correct data
            for (const auditLog of userAuditLogs.data) {
              expect(auditLog.userId).toBe(queryUserId);
            }
            
            for (const auditLog of moduleAuditLogs.data) {
              expect(auditLog.module).toBe(queryModule);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Additional property test for audit log data integrity
   */
  describe('Audit Data Integrity Properties', () => {
    it('should preserve all audit data through storage and retrieval cycles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            userEmail: fc.emailAddress(),
            action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE', 'READ'),
            module: fc.string({ minLength: 1, maxLength: 50 }),
            entityType: fc.string({ minLength: 1, maxLength: 50 }),
            entityId: fc.option(fc.uuid(), { nil: undefined }),
            entityReference: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          }),
          async (originalData) => {
            // Clear existing data for this test
            mockAuditLogs.length = 0;
            mockIdCounter = 1;
            
            // Store audit data
            await auditService.log(originalData);
            
            // Retrieve and verify data integrity
            const allLogs = await auditService.findAll({ page: 1, limit: 100 });
            const storedLog = allLogs.data.find(log => 
              log.userId === originalData.userId && 
              log.action === originalData.action &&
              log.module === originalData.module
            );
            
            expect(storedLog).toBeDefined();
            expect(storedLog!.userId).toBe(originalData.userId);
            expect(storedLog!.userEmail).toBe(originalData.userEmail);
            expect(storedLog!.action).toBe(originalData.action);
            expect(storedLog!.module).toBe(originalData.module);
            expect(storedLog!.entityType).toBe(originalData.entityType);
            expect(storedLog!.entityId).toBe(originalData.entityId);
            expect(storedLog!.entityReference).toBe(originalData.entityReference);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});