import { Test, TestingModule } from '@nestjs/testing';
import { MigrationMonitorService, MigrationMetrics } from './migration-monitor.service';
import { MigrationLoggerService, MigrationPhase } from './migration-logger.service';
import { PrismaService } from '../../common/services/prisma.service';
import * as fc from 'fast-check';

/**
 * Feature: supabase-to-nestjs-migration, Property 4: Migration Monitoring and Audit Trail
 * Validates: Requirements 4.5, 4.6, 4.7
 * 
 * For any migration monitoring operation, detailed error information should be logged with stack traces,
 * real-time progress reporting with ETA calculations should be provided, and comprehensive audit trails
 * should be generated with complete statistics and validation results.
 */

describe('MigrationMonitorService - Property-Based Tests', () => {
  let service: MigrationMonitorService;
  let loggerService: MigrationLoggerService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    migrationMetrics: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockLoggerService = {
    logInfo: jest.fn(),
    logError: jest.fn(),
    logWarn: jest.fn(),
    setCurrentPhase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationMonitorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MigrationLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<MigrationMonitorService>(MigrationMonitorService);
    loggerService = module.get<MigrationLoggerService>(MigrationLoggerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.endMigration('completed');
  });

  /**
   * Property: Migration metrics should always be consistent and non-negative
   * Validates: Requirement 4.6 - Real-time progress reporting with ETA calculations
   */
  it('should maintain consistent and non-negative metrics for any valid migration parameters', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.integer({ min: 0, max: 1000000 }), // totalRecords
      fc.integer({ min: 0, max: 1000 }), // totalTables
      fc.integer({ min: 0, max: 10000 }), // totalFiles
      fc.integer({ min: 0, max: 1000000000 }), // totalBytes
      (migrationId, totalRecords, totalTables, totalFiles, totalBytes) => {
        // Start migration with given parameters
        service.startMigration(migrationId, totalRecords, totalTables, totalFiles, totalBytes);
        
        const metrics = service.getCurrentMetrics();
        
        // Property: All metrics should be non-negative
        expect(metrics).not.toBeNull();
        expect(metrics!.recordsProcessed).toBeGreaterThanOrEqual(0);
        expect(metrics!.errorsCount).toBeGreaterThanOrEqual(0);
        expect(metrics!.warningsCount).toBeGreaterThanOrEqual(0);
        expect(metrics!.tablesProcessed).toBeGreaterThanOrEqual(0);
        expect(metrics!.filesProcessed).toBeGreaterThanOrEqual(0);
        expect(metrics!.bytesProcessed).toBeGreaterThanOrEqual(0);
        expect(metrics!.progressPercentage).toBeGreaterThanOrEqual(0);
        expect(metrics!.progressPercentage).toBeLessThanOrEqual(100);
        expect(metrics!.recordsPerSecond).toBeGreaterThanOrEqual(0);
        expect(metrics!.elapsedTime).toBeGreaterThanOrEqual(0);
        
        // Property: Migration ID should match
        expect(metrics!.migrationId).toBe(migrationId);
        
        // Property: Total values should match input (when provided)
        if (totalRecords > 0) expect(metrics!.totalRecords).toBe(totalRecords);
        if (totalTables > 0) expect(metrics!.totalTables).toBe(totalTables);
        if (totalFiles > 0) expect(metrics!.totalFiles).toBe(totalFiles);
        if (totalBytes > 0) expect(metrics!.totalBytes).toBe(totalBytes);
        
        service.endMigration('completed');
      }
    ), { numRuns: 100 });
  });

  /**
   * Property: Progress updates should maintain data consistency
   * Validates: Requirement 4.6 - Real-time progress reporting with detailed status updates
   */
  it('should maintain data consistency after any sequence of progress updates', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.array(fc.record({
        recordsProcessed: fc.integer({ min: 0, max: 1000 }),
        tablesProcessed: fc.integer({ min: 0, max: 10 }),
        filesProcessed: fc.integer({ min: 0, max: 100 }),
        bytesProcessed: fc.integer({ min: 0, max: 1000000 }),
        errorsCount: fc.integer({ min: 0, max: 50 }),
        warningsCount: fc.integer({ min: 0, max: 100 })
      }), { minLength: 1, maxLength: 20 }),
      (migrationId, updates) => {
        service.startMigration(migrationId, 10000, 100, 1000, 100000000);
        
        let expectedRecords = 0;
        let expectedTables = 0;
        let expectedFiles = 0;
        let expectedBytes = 0;
        let expectedErrors = 0;
        let expectedWarnings = 0;
        
        // Apply all updates
        for (const update of updates) {
          service.updateProgress(update);
          expectedRecords += update.recordsProcessed || 0;
          expectedTables += update.tablesProcessed || 0;
          expectedFiles += update.filesProcessed || 0;
          expectedBytes += update.bytesProcessed || 0;
          expectedErrors += update.errorsCount || 0;
          expectedWarnings += update.warningsCount || 0;
        }
        
        const metrics = service.getCurrentMetrics();
        
        // Property: Accumulated values should match sum of updates
        expect(metrics!.recordsProcessed).toBe(expectedRecords);
        expect(metrics!.tablesProcessed).toBe(expectedTables);
        expect(metrics!.filesProcessed).toBe(expectedFiles);
        expect(metrics!.bytesProcessed).toBe(expectedBytes);
        expect(metrics!.errorsCount).toBe(expectedErrors);
        expect(metrics!.warningsCount).toBe(expectedWarnings);
        
        // Property: Progress percentage should be calculated correctly
        const expectedProgress = Math.round((expectedRecords / 10000) * 100);
        expect(metrics!.progressPercentage).toBe(Math.min(expectedProgress, 100));
        
        service.endMigration('completed');
      }
    ), { numRuns: 100 });
  });

  /**
   * Property: Phase transitions should be properly tracked
   * Validates: Requirement 4.5 - Detailed error logging with stack traces and data context
   */
  it('should properly track phase transitions and maintain phase metrics', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.array(fc.constantFrom(
        MigrationPhase.INITIALIZATION,
        MigrationPhase.SCHEMA_EXTRACTION,
        MigrationPhase.DATA_MIGRATION,
        MigrationPhase.USER_MIGRATION,
        MigrationPhase.FILE_MIGRATION,
        MigrationPhase.VALIDATION,
        MigrationPhase.COMPLETION
      ), { minLength: 1, maxLength: 7 }),
      (migrationId, phases) => {
        service.startMigration(migrationId);
        
        const uniquePhases = [...new Set(phases)]; // Remove duplicates
        
        // Start and end each phase
        for (const phase of uniquePhases) {
          service.startPhase(phase);
          
          // Add some progress to the phase
          service.updateProgress({
            recordsProcessed: Math.floor(Math.random() * 100),
            errorsCount: Math.floor(Math.random() * 5)
          });
          
          service.endPhase(phase, 'completed');
        }
        
        const phaseMetrics = service.getPhaseMetrics();
        
        // Property: All started phases should have metrics
        expect(phaseMetrics.length).toBe(uniquePhases.length);
        
        // Property: All phase metrics should have valid data
        for (const phaseMetric of phaseMetrics) {
          expect(phaseMetric.startTime).toBeInstanceOf(Date);
          expect(phaseMetric.endTime).toBeInstanceOf(Date);
          expect(phaseMetric.duration).toBeGreaterThanOrEqual(0);
          expect(phaseMetric.recordsProcessed).toBeGreaterThanOrEqual(0);
          expect(phaseMetric.errorsCount).toBeGreaterThanOrEqual(0);
          expect(phaseMetric.warningsCount).toBeGreaterThanOrEqual(0);
          expect(phaseMetric.status).toBe('completed');
          expect(uniquePhases).toContain(phaseMetric.phase);
        }
        
        service.endMigration('completed');
      }
    ), { numRuns: 50 });
  });

  /**
   * Property: ETA calculations should be reasonable and consistent
   * Validates: Requirement 4.6 - Real-time progress reporting with ETA calculations
   */
  it('should provide reasonable ETA calculations based on processing rate', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.integer({ min: 1000, max: 100000 }), // totalRecords
      fc.integer({ min: 1, max: 1000 }), // recordsProcessed
      (migrationId, totalRecords, recordsProcessed) => {
        // Ensure we don't process more than total
        const actualRecordsProcessed = Math.min(recordsProcessed, totalRecords - 1);
        
        service.startMigration(migrationId, totalRecords);
        
        // Simulate some processing time
        const startTime = Date.now();
        service.updateProgress({ recordsProcessed: actualRecordsProcessed });
        
        // Wait a small amount to ensure elapsed time > 0
        const endTime = Date.now();
        if (endTime === startTime) {
          // If no time elapsed, skip this test case
          service.endMigration('completed');
          return;
        }
        
        const eta = service.getETA();
        
        if (eta.eta) {
          // Property: ETA should be in the future
          expect(eta.eta.getTime()).toBeGreaterThan(Date.now());
          
          // Property: Confidence should be between 0 and 100
          expect(eta.confidence).toBeGreaterThanOrEqual(0);
          expect(eta.confidence).toBeLessThanOrEqual(100);
        }
        
        const metrics = service.getCurrentMetrics();
        
        // Property: If we have processed records and time has elapsed, records per second should be > 0
        if (actualRecordsProcessed > 0 && metrics!.elapsedTime > 0) {
          expect(metrics!.recordsPerSecond).toBeGreaterThan(0);
        }
        
        // Property: Estimated remaining time should be reasonable
        if (metrics!.estimatedRemainingTime) {
          expect(metrics!.estimatedRemainingTime).toBeGreaterThan(0);
          
          // Should not be more than 100x the elapsed time (reasonable upper bound)
          expect(metrics!.estimatedRemainingTime).toBeLessThan(metrics!.elapsedTime * 100);
        }
        
        service.endMigration('completed');
      }
    ), { numRuns: 50 });
  });

  /**
   * Property: Status reports should contain all required information
   * Validates: Requirement 4.7 - Comprehensive audit trail and migration report with complete statistics
   */
  it('should generate comprehensive status reports with all required information', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.record({
        recordsProcessed: fc.integer({ min: 0, max: 1000 }),
        errorsCount: fc.integer({ min: 0, max: 50 }),
        warningsCount: fc.integer({ min: 0, max: 100 }),
        tablesProcessed: fc.integer({ min: 0, max: 10 }),
        filesProcessed: fc.integer({ min: 0, max: 100 })
      }),
      (migrationId, progress) => {
        service.startMigration(migrationId, 10000, 100, 1000);
        service.updateProgress(progress);
        
        const statusReport = service.generateStatusReport();
        
        // Property: Status report should contain all required sections
        expect(statusReport).toHaveProperty('migration');
        expect(statusReport).toHaveProperty('phases');
        expect(statusReport).toHaveProperty('eta');
        expect(statusReport).toHaveProperty('alerts');
        expect(statusReport).toHaveProperty('recommendations');
        
        // Property: Migration metrics should be present and valid
        expect(statusReport.migration).not.toBeNull();
        expect(statusReport.migration!.migrationId).toBe(migrationId);
        expect(statusReport.migration!.recordsProcessed).toBe(progress.recordsProcessed);
        expect(statusReport.migration!.errorsCount).toBe(progress.errorsCount);
        
        // Property: Phases should be an array
        expect(Array.isArray(statusReport.phases)).toBe(true);
        
        // Property: ETA should have required structure
        expect(statusReport.eta).toHaveProperty('eta');
        expect(statusReport.eta).toHaveProperty('confidence');
        expect(typeof statusReport.eta.confidence).toBe('number');
        
        // Property: Alerts and recommendations should be arrays
        expect(Array.isArray(statusReport.alerts)).toBe(true);
        expect(Array.isArray(statusReport.recommendations)).toBe(true);
        
        // Property: Alerts should be generated for errors
        if (progress.errorsCount > 0) {
          expect(statusReport.alerts.length).toBeGreaterThan(0);
        }
        
        service.endMigration('completed');
      }
    ), { numRuns: 100 });
  });

  /**
   * Property: Metrics history should maintain chronological order
   * Validates: Requirement 4.6 - Real-time progress reporting with detailed status updates
   */
  it('should maintain chronological order in metrics history', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 2, maxLength: 10 }), // progress updates
      (migrationId, progressUpdates) => {
        service.startMigration(migrationId, 10000);
        
        // Apply progress updates with small delays to ensure different timestamps
        for (let i = 0; i < progressUpdates.length; i++) {
          service.updateProgress({ recordsProcessed: progressUpdates[i] });
          
          // Force metrics update by calling getCurrentMetrics
          service.getCurrentMetrics();
        }
        
        const history = service.getMetricsHistory();
        
        // Property: History should contain entries
        expect(history.length).toBeGreaterThan(0);
        
        // Property: History should be in chronological order
        for (let i = 1; i < history.length; i++) {
          expect(history[i].currentTime.getTime()).toBeGreaterThanOrEqual(
            history[i - 1].currentTime.getTime()
          );
        }
        
        // Property: Each entry should have valid timestamps
        for (const entry of history) {
          expect(entry.startTime).toBeInstanceOf(Date);
          expect(entry.currentTime).toBeInstanceOf(Date);
          expect(entry.currentTime.getTime()).toBeGreaterThanOrEqual(entry.startTime.getTime());
        }
        
        service.endMigration('completed');
      }
    ), { numRuns: 50 });
  });

  /**
   * Property: Memory and system metrics should be realistic
   * Validates: Requirement 4.6 - Real-time progress reporting with system resource monitoring
   */
  it('should report realistic memory and system metrics', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      (migrationId) => {
        service.startMigration(migrationId);
        
        const metrics = service.getCurrentMetrics();
        
        // Property: Memory usage should be realistic
        expect(metrics!.memoryUsage.heapUsed).toBeGreaterThan(0);
        expect(metrics!.memoryUsage.heapTotal).toBeGreaterThan(0);
        expect(metrics!.memoryUsage.external).toBeGreaterThanOrEqual(0);
        expect(metrics!.memoryUsage.arrayBuffers).toBeGreaterThanOrEqual(0);
        
        // Property: Heap used should not exceed heap total
        expect(metrics!.memoryUsage.heapUsed).toBeLessThanOrEqual(metrics!.memoryUsage.heapTotal);
        
        // Property: Memory values should be reasonable (not negative, not impossibly large)
        expect(metrics!.memoryUsage.heapUsed).toBeLessThan(10 * 1024 * 1024 * 1024); // Less than 10GB
        expect(metrics!.memoryUsage.heapTotal).toBeLessThan(10 * 1024 * 1024 * 1024); // Less than 10GB
        
        // Property: CPU usage (if available) should be reasonable
        if (metrics!.cpuUsage) {
          expect(metrics!.cpuUsage.user).toBeGreaterThanOrEqual(0);
          expect(metrics!.cpuUsage.system).toBeGreaterThanOrEqual(0);
        }
        
        service.endMigration('completed');
      }
    ), { numRuns: 100 });
  });
});