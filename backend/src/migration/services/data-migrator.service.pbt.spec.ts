import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';
import { DataMigratorService } from './data-migrator.service';
import { SchemaExtractorService } from './schema-extractor.service';
import { MigrationLoggerService } from './migration-logger.service';
import { MigrationData, MigrationReport } from '../types/data-migration.types';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Data Migration Service
 * **Property 7: Data Migration Integrity and Completeness**
 * **Validates: Requirements 1.5, 1.6, 1.7, 1.8, 1.9**
 */
describe('DataMigratorService - Property-Based Tests', () => {
  let service: DataMigratorService;
  let prismaService: PrismaService;
  let mockSupabaseClient: any;
  let mockSchemaExtractor: any;
  let mockMigrationLogger: any;

  beforeEach(async () => {
    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
      rpc: jest.fn(),
    };

    // Mock schema extractor
    mockSchemaExtractor = {
      extractCompleteSchema: jest.fn().mockResolvedValue({
        tables: [
          {
            name: 'test_table',
            columns: [
              { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, nullable: false },
              { name: 'name', type: 'text', isPrimaryKey: false, isForeignKey: false, nullable: false },
              { name: 'created_at', type: 'timestamp', isPrimaryKey: false, isForeignKey: false, nullable: false },
            ],
            constraints: [],
            indexes: [],
            policies: [],
            triggers: [],
          },
        ],
        enums: [],
        functions: [],
        migrationFiles: [],
        extractedAt: new Date(),
      }),
    };

    // Mock migration logger
    mockMigrationLogger = {
      logInfo: jest.fn(),
      logError: jest.fn(),
      createAuditEntry: jest.fn(),
    };

    // Mock Prisma service
    const mockPrismaService = {
      $transaction: jest.fn(),
      $executeRawUnsafe: jest.fn(),
      $queryRawUnsafe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataMigratorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'SUPABASE_URL':
                  return 'https://test.supabase.co';
                case 'SUPABASE_SERVICE_ROLE_KEY':
                  return 'test-service-key';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SchemaExtractorService,
          useValue: mockSchemaExtractor,
        },
        {
          provide: MigrationLoggerService,
          useValue: mockMigrationLogger,
        },
      ],
    }).compile();

    service = module.get<DataMigratorService>(DataMigratorService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Mock the Supabase client creation
    (service as any).supabaseClient = mockSupabaseClient;
  });

  describe('Property 7.1: Data Export Completeness', () => {
    /**
     * Property: For any valid table with records, export should return all records
     * with preserved UUIDs and timestamps
     */
    it('should export all records with preserved data integrity', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (testRecords) => {
            // Setup mock to return test records
            mockSupabaseClient.from.mockReturnValue({
              select: jest.fn().mockReturnValue({
                range: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: testRecords,
                    error: null,
                  }),
                }),
              }),
            });

            // Initialize currentProgress to avoid null reference
            (service as any).currentProgress = {
              migrationId: 'test-migration',
              currentPhase: 'EXPORT',
              totalTables: 1,
              processedTables: 0,
              overallProgress: 0,
              startTime: new Date(),
            };

            // Execute export
            const exportedData = await service.exportAllData({
              includeTables: ['test_table'],
              batchSize: 10,
            });

            // Verify completeness
            expect(exportedData).toHaveProperty('test_table');
            expect(exportedData.test_table).toHaveLength(testRecords.length);

            // Verify data integrity
            for (let i = 0; i < testRecords.length; i++) {
              const original = testRecords[i];
              const exported = exportedData.test_table[i];

              // UUID preservation
              expect(exported.id).toBe(original.id);
              expect(exported.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

              // Timestamp preservation
              expect(new Date(exported.created_at)).toEqual(original.created_at);
              expect(new Date(exported.updated_at)).toEqual(original.updated_at);

              // Data preservation
              expect(exported.name).toBe(original.name);
            }
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    });

    /**
     * Property: Export should handle empty tables gracefully
     */
    it('should handle empty tables without errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            // Setup mock to return empty data
            mockSupabaseClient.from.mockReturnValue({
              select: jest.fn().mockReturnValue({
                range: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            });

            const exportedData = await service.exportAllData({
              includeTables: ['test_table'],
            });

            expect(exportedData).toHaveProperty('test_table');
            expect(exportedData.test_table).toHaveLength(0);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 7.2: Data Import Integrity', () => {
    /**
     * Property: Import should preserve all data characteristics and maintain referential integrity
     */
    it('should import data with complete integrity preservation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
              updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (testRecords) => {
            const migrationData: MigrationData = {
              test_table: testRecords,
            };

            // Mock successful import
            (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
              return await callback({
                $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
              });
            });

            // Mock record count query
            (prismaService.$queryRawUnsafe as jest.Mock).mockResolvedValue([{ count: testRecords.length.toString() }]);

            const results = await service.importAllData(migrationData, {
              batchSize: 5,
              transactional: true,
              preserveIds: true,
            });

            // Verify import results
            expect(results).toHaveLength(1);
            const tableResult = results[0];
            
            expect(tableResult.tableName).toBe('test_table');
            expect(tableResult.totalRecords).toBe(testRecords.length);
            expect(tableResult.migratedRecords).toBe(testRecords.length);
            expect(tableResult.failedRecords).toBe(0);
            expect(tableResult.errors).toHaveLength(0);
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    });

    /**
     * Property: Import should handle batch processing correctly
     */
    it('should process batches correctly regardless of batch size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                created_at: fc.date().map(d => d.toISOString()),
              }),
              { minLength: 5, maxLength: 25 }
            ),
            fc.integer({ min: 1, max: 10 })
          ),
          async ([testRecords, batchSize]) => {
            const migrationData: MigrationData = {
              test_table: testRecords,
            };

            // Mock successful batch processing
            (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
              return await callback({
                $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
              });
            });

            const results = await service.importAllData(migrationData, {
              batchSize,
              transactional: true,
            });

            // Verify all records processed regardless of batch size
            expect(results[0].migratedRecords).toBe(testRecords.length);
            expect(results[0].failedRecords).toBe(0);

            // Verify correct number of batch calls
            const expectedBatches = Math.ceil(testRecords.length / batchSize);
            expect(prismaService.$transaction).toHaveBeenCalledTimes(expectedBatches);
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    });
  });

  describe('Property 7.3: Migration Validation Completeness', () => {
    /**
     * Property: Validation should detect all data integrity issues
     */
    it('should detect record count mismatches accurately', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 1, max: 100 })
          ).filter(([source, target]) => source !== target),
          async ([sourceCount, targetCount]) => {
            const migrationData: MigrationData = {
              test_table: Array(sourceCount).fill(null).map((_, i) => ({
                id: `test-id-${i}`,
                name: `Test Record ${i}`,
                created_at: new Date().toISOString(),
              })),
            };

            // Mock target count to be different
            (prismaService.$queryRawUnsafe as jest.Mock).mockResolvedValue([{ count: targetCount.toString() }]);

            const validationResults = await service.validateMigrationIntegrity(migrationData);

            // Should detect the mismatch
            expect(validationResults.failedChecks).toBeGreaterThan(0);
            expect(validationResults.errors).toContain(
              expect.stringContaining(`Record count mismatch for test_table: expected ${sourceCount}, got ${targetCount}`)
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property: Validation should pass when data matches exactly
     */
    it('should pass validation when source and target data match', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              created_at: fc.date().map(d => d.toISOString()),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (testRecords) => {
            const migrationData: MigrationData = {
              test_table: testRecords,
            };

            // Mock matching record count
            (prismaService.$queryRawUnsafe as jest.Mock)
              .mockResolvedValueOnce([{ count: testRecords.length.toString() }]) // Count query
              .mockImplementation((query, id) => {
                // Individual record queries
                if (query.includes('WHERE id =')) {
                  const record = testRecords.find(r => r.id === id);
                  return Promise.resolve(record ? [record] : []);
                }
                return Promise.resolve([]);
              });

            const validationResults = await service.validateMigrationIntegrity(migrationData);

            // Should pass all checks
            expect(validationResults.errors).toHaveLength(0);
            expect(validationResults.passedChecks).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    });
  });

  describe('Property 7.4: Migration Progress Tracking', () => {
    /**
     * Property: Progress tracking should accurately reflect migration state
     */
    it('should track progress accurately throughout migration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 5, maxLength: 15 }
          ),
          async (testRecords) => {
            const migrationData: MigrationData = {
              test_table: testRecords,
            };

            // Setup mocks
            mockSupabaseClient.from.mockReturnValue({
              select: jest.fn().mockReturnValue({
                range: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: testRecords,
                    error: null,
                  }),
                }),
              }),
            });

            (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
              return await callback({
                $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
              });
            });

            (prismaService.$queryRawUnsafe as jest.Mock).mockResolvedValue([{ count: testRecords.length.toString() }]);

            // Start migration and track progress
            const migrationPromise = service.migrateAllData();
            
            // Check initial progress
            let progress = service.getMigrationProgress();
            expect(progress).toBeTruthy();
            expect(progress!.currentPhase).toBe('IMPORT');
            expect(progress!.totalTables).toBe(1);

            const report = await migrationPromise;

            // Check final progress
            progress = service.getMigrationProgress();
            expect(progress!.currentPhase).toBe('COMPLETE');
            expect(progress!.overallProgress).toBe(100);
            expect(report.status).toBe('COMPLETED');
          }
        ),
        { numRuns: 5, timeout: 30000 }
      );
    });
  });

  describe('Property 7.5: Error Handling and Recovery', () => {
    /**
     * Property: Migration should handle errors gracefully and provide detailed reporting
     */
    it('should handle import errors gracefully and provide detailed error information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 3, maxLength: 10 }
          ),
          async (testRecords) => {
            const migrationData: MigrationData = {
              test_table: testRecords,
            };

            // Mock import failure
            (prismaService.$transaction as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            const results = await service.importAllData(migrationData, {
              continueOnError: true,
            });

            // Should report failures correctly
            expect(results).toHaveLength(1);
            const tableResult = results[0];
            
            expect(tableResult.failedRecords).toBe(testRecords.length);
            expect(tableResult.migratedRecords).toBe(0);
            expect(tableResult.errors).toContain(expect.stringContaining('Database connection failed'));
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 7.6: UUID and Timestamp Preservation', () => {
    /**
     * Property: All UUIDs and timestamps must be preserved exactly during migration
     */
    it('should preserve UUIDs and timestamps with perfect fidelity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              parent_id: fc.option(fc.uuid(), { nil: null }),
              created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              deleted_at: fc.option(fc.date(), { nil: null }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (testRecords) => {
            // Setup export mock
            mockSupabaseClient.from.mockReturnValue({
              select: jest.fn().mockReturnValue({
                range: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: testRecords,
                    error: null,
                  }),
                }),
              }),
            });

            const exportedData = await service.exportAllData({
              includeTables: ['test_table'],
              preserveTimestamps: true,
            });

            const exported = exportedData.test_table;

            // Verify UUID preservation
            for (let i = 0; i < testRecords.length; i++) {
              const original = testRecords[i];
              const exportedRecord = exported[i];

              // Primary UUID
              expect(exportedRecord.id).toBe(original.id);
              expect(exportedRecord.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

              // Foreign key UUID
              if (original.parent_id) {
                expect(exportedRecord.parent_id).toBe(original.parent_id);
                expect(exportedRecord.parent_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
              }

              // Timestamp preservation
              expect(new Date(exportedRecord.created_at).getTime()).toBe(original.created_at.getTime());
              expect(new Date(exportedRecord.updated_at).getTime()).toBe(original.updated_at.getTime());
              
              if (original.deleted_at) {
                expect(new Date(exportedRecord.deleted_at).getTime()).toBe(original.deleted_at.getTime());
              }
            }
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    });
  });
});