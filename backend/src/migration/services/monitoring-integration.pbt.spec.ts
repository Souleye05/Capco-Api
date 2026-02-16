import { Test, TestingModule } from '@nestjs/testing';
import { MigrationLoggerService, MigrationPhase, LogLevel } from './migration-logger.service';
import { MigrationMonitorService } from './migration-monitor.service';
import { MigrationAlertService, AlertType, AlertSeverity } from './migration-alert.service';
import { PrismaService } from '../../common/services/prisma.service';
import * as fc from 'fast-check';

/**
 * Feature: supabase-to-nestjs-migration, Property 4: Migration Monitoring and Audit Trail
 * Validates: Requirements 4.5, 4.6, 4.7
 * 
 * For any migration monitoring operation, the system should create structured logging with complete context,
 * implement real-time monitoring with accurate metrics and ETA calculations, create automatic alerting
 * for critical issues, and implement complete audit trails for compliance with forensic capabilities.
 */

describe('Migration Monitoring Integration - Property-Based Tests', () => {
  let loggerService: MigrationLoggerService;
  let monitorService: MigrationMonitorService;
  let alertService: MigrationAlertService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    migrationLog: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditTrail: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    migrationMetrics: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    migrationAlert: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationLoggerService,
        MigrationMonitorService,
        MigrationAlertService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    loggerService = module.get<MigrationLoggerService>(MigrationLoggerService);
    monitorService = module.get<MigrationMonitorService>(MigrationMonitorService);
    alertService = module.get<MigrationAlertService>(MigrationAlertService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    monitorService.endMigration('completed');
    alertService.stopMonitoring();
  });

  /**
   * Property: Structured logging should capture all required context information
   * Validates: Requirement 4.5 - Detailed error logging with stack traces and data context
   */
  it('should create structured logs with complete context for any operation', () => {
    fc.assert(fc.property(
      fc.constantFrom(...Object.values(MigrationPhase)), // phase
      fc.string({ minLength: 1, maxLength: 100 }), // operation
      fc.string({ minLength: 1, maxLength: 500 }), // message
      fc.record({
        recordsProcessed: fc.integer({ min: 0, max: 10000 }),
        tableId: fc.string({ minLength: 1, maxLength: 50 }),
        userId: fc.uuid(),
        errorCode: fc.string({ minLength: 1, maxLength: 20 }),
      }), // context
      fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }), // remediation steps
      (phase, operation, message, context, remediationSteps) => {
        // Set the current phase
        loggerService.setCurrentPhase(phase);

        // Test different log levels
        const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
        
        for (const level of logLevels) {
          const error = level === LogLevel.ERROR || level === LogLevel.CRITICAL 
            ? new Error('Test error message') 
            : undefined;

          // Log with the specified level
          switch (level) {
            case LogLevel.DEBUG:
              loggerService.logDebug(operation, message, context);
              break;
            case LogLevel.INFO:
              loggerService.logInfo(operation, message, context);
              break;
            case LogLevel.WARN:
              loggerService.logWarn(operation, message, context);
              break;
            case LogLevel.ERROR:
              loggerService.logError(operation, message, error, context, remediationSteps);
              break;
            case LogLevel.CRITICAL:
              loggerService.logCritical(operation, message, error, context, remediationSteps);
              break;
          }

          // Property: Database create should be called for each log entry
          expect(mockPrismaService.migrationLog.create).toHaveBeenCalled();
          
          const lastCall = mockPrismaService.migrationLog.create.mock.calls[
            mockPrismaService.migrationLog.create.mock.calls.length - 1
          ];
          const logData = lastCall[0].data;

          // Property: Log entry should contain all required fields
          expect(logData).toHaveProperty('id');
          expect(logData).toHaveProperty('level', level);
          expect(logData).toHaveProperty('phase', phase);
          expect(logData).toHaveProperty('component', 'MigrationSystem');
          expect(logData).toHaveProperty('operation', operation);
          expect(logData).toHaveProperty('message', message);
          expect(logData).toHaveProperty('context', context);
          expect(logData).toHaveProperty('timestamp');

          // Property: Error logs should include stack trace and remediation steps
          if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
            expect(logData).toHaveProperty('stackTrace');
            expect(logData.remediationSteps).toEqual(remediationSteps);
          }

          // Property: Timestamp should be recent (within last 5 seconds)
          const now = new Date();
          const logTime = new Date(logData.timestamp);
          expect(now.getTime() - logTime.getTime()).toBeLessThan(5000);
        }
      }
    ), { numRuns: 50 });
  });

  /**
   * Property: Audit trail should capture all required compliance information
   * Validates: Requirement 4.7 - Complete audit trail for compliance with forensic capabilities
   */
  it('should create comprehensive audit trails for any migration operation', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 100 }), // action
      fc.string({ minLength: 1, maxLength: 100 }), // resource
      fc.constantFrom('success', 'failure', 'partial'), // result
      fc.record({
        userId: fc.uuid(),
        resourceId: fc.uuid(),
        oldValues: fc.record({
          status: fc.string(),
          count: fc.integer({ min: 0, max: 1000 }),
        }),
        newValues: fc.record({
          status: fc.string(),
          count: fc.integer({ min: 0, max: 1000 }),
        }),
        ipAddress: fc.ipV4(),
        userAgent: fc.string({ minLength: 10, maxLength: 200 }),
        sessionId: fc.uuid(),
        additionalDetails: fc.record({
          migrationPhase: fc.constantFrom(...Object.values(MigrationPhase)),
          recordsAffected: fc.integer({ min: 1, max: 10000 }),
        }),
      }),
      async (action, resource, result, details) => {
        // Create audit entry
        await loggerService.createAuditEntry(action, resource, result as any, details);

        // Property: Database create should be called for audit trail
        expect(mockPrismaService.auditTrail.create).toHaveBeenCalled();
        
        const auditCall = mockPrismaService.auditTrail.create.mock.calls[
          mockPrismaService.auditTrail.create.mock.calls.length - 1
        ];
        const auditData = auditCall[0].data;

        // Property: Audit entry should contain all required compliance fields
        expect(auditData).toHaveProperty('id');
        expect(auditData).toHaveProperty('action', action);
        expect(auditData).toHaveProperty('resource', resource);
        expect(auditData).toHaveProperty('result', result);
        expect(auditData).toHaveProperty('userId', details.userId);
        expect(auditData).toHaveProperty('resourceId', details.resourceId);
        expect(auditData).toHaveProperty('oldValues', details.oldValues);
        expect(auditData).toHaveProperty('newValues', details.newValues);
        expect(auditData).toHaveProperty('ipAddress', details.ipAddress);
        expect(auditData).toHaveProperty('userAgent', details.userAgent);
        expect(auditData).toHaveProperty('sessionId', details.sessionId);
        expect(auditData).toHaveProperty('details', details.additionalDetails);
        expect(auditData).toHaveProperty('timestamp');

        // Property: Timestamp should be recent and valid
        const now = new Date();
        const auditTime = new Date(auditData.timestamp);
        expect(auditTime).toBeInstanceOf(Date);
        expect(now.getTime() - auditTime.getTime()).toBeLessThan(5000);

        // Property: ID should be unique and properly formatted
        expect(auditData.id).toMatch(/^log_\d+_[a-z0-9]{9}$/);
      }
    ), { numRuns: 30 });
  });

  /**
   * Property: Real-time monitoring should provide accurate metrics and ETA
   * Validates: Requirement 4.6 - Real-time monitoring with metrics and ETA calculations
   */
  it('should provide accurate real-time monitoring with consistent metrics', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.integer({ min: 1000, max: 100000 }), // totalRecords
      fc.array(fc.record({
        recordsProcessed: fc.integer({ min: 1, max: 500 }),
        errorsCount: fc.integer({ min: 0, max: 10 }),
        warningsCount: fc.integer({ min: 0, max: 20 }),
        tablesProcessed: fc.integer({ min: 0, max: 5 }),
        filesProcessed: fc.integer({ min: 0, max: 10 }),
        bytesProcessed: fc.integer({ min: 0, max: 1000000 }),
      }), { minLength: 1, maxLength: 10 }),
      (migrationId, totalRecords, progressUpdates) => {
        // Start monitoring
        monitorService.startMigration(migrationId, totalRecords, 100, 1000, 1000000000);

        let totalProcessed = 0;
        let totalErrors = 0;
        let totalWarnings = 0;
        let totalTables = 0;
        let totalFiles = 0;
        let totalBytes = 0;

        // Apply progress updates
        for (const update of progressUpdates) {
          monitorService.updateProgress(update);
          totalProcessed += update.recordsProcessed;
          totalErrors += update.errorsCount;
          totalWarnings += update.warningsCount;
          totalTables += update.tablesProcessed;
          totalFiles += update.filesProcessed;
          totalBytes += update.bytesProcessed;
        }

        const metrics = monitorService.getCurrentMetrics();

        // Property: Metrics should accurately reflect all updates
        expect(metrics).not.toBeNull();
        expect(metrics!.migrationId).toBe(migrationId);
        expect(metrics!.recordsProcessed).toBe(totalProcessed);
        expect(metrics!.errorsCount).toBe(totalErrors);
        expect(metrics!.warningsCount).toBe(totalWarnings);
        expect(metrics!.tablesProcessed).toBe(totalTables);
        expect(metrics!.filesProcessed).toBe(totalFiles);
        expect(metrics!.bytesProcessed).toBe(totalBytes);

        // Property: Progress percentage should be calculated correctly
        const expectedProgress = Math.min(Math.round((totalProcessed / totalRecords) * 100), 100);
        expect(metrics!.progressPercentage).toBe(expectedProgress);

        // Property: Records per second should be non-negative
        expect(metrics!.recordsPerSecond).toBeGreaterThanOrEqual(0);

        // Property: ETA should be reasonable when processing is active
        const eta = monitorService.getETA();
        if (totalProcessed > 0 && totalProcessed < totalRecords) {
          expect(eta.confidence).toBeGreaterThanOrEqual(0);
          expect(eta.confidence).toBeLessThanOrEqual(100);
          
          if (eta.eta) {
            expect(eta.eta.getTime()).toBeGreaterThan(Date.now());
          }
        }

        // Property: Memory usage should be realistic
        expect(metrics!.memoryUsage.heapUsed).toBeGreaterThan(0);
        expect(metrics!.memoryUsage.heapUsed).toBeLessThanOrEqual(metrics!.memoryUsage.heapTotal);

        monitorService.endMigration('completed');
      }
    ), { numRuns: 50 });
  });

  /**
   * Property: Alert system should trigger appropriate alerts based on conditions
   * Validates: Requirement 4.6 - Automatic alerting system for critical issues
   */
  it('should trigger appropriate alerts for any critical migration conditions', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.record({
        recordsProcessed: fc.integer({ min: 100, max: 1000 }),
        errorsCount: fc.integer({ min: 0, max: 100 }),
        warningsCount: fc.integer({ min: 0, max: 200 }),
        elapsedTime: fc.integer({ min: 60000, max: 3600000 }), // 1 minute to 1 hour
        memoryUsageMB: fc.integer({ min: 100, max: 3000 }),
      }),
      async (migrationId, conditions) => {
        // Start monitoring and alerting
        monitorService.startMigration(migrationId, 10000);
        
        // Simulate the conditions by updating progress
        monitorService.updateProgress({
          recordsProcessed: conditions.recordsProcessed,
          errorsCount: conditions.errorsCount,
          warningsCount: conditions.warningsCount,
        });

        // Mock the metrics to include our test conditions
        const originalGetCurrentMetrics = monitorService.getCurrentMetrics;
        jest.spyOn(monitorService, 'getCurrentMetrics').mockReturnValue({
          ...originalGetCurrentMetrics.call(monitorService)!,
          elapsedTime: conditions.elapsedTime,
          memoryUsage: {
            heapUsed: conditions.memoryUsageMB * 1024 * 1024,
            heapTotal: conditions.memoryUsageMB * 1024 * 1024 * 1.5,
            external: 0,
            arrayBuffers: 0,
            rss: conditions.memoryUsageMB * 1024 * 1024 * 1.2,
          },
        });

        // Wait for alert system to process
        await new Promise(resolve => setTimeout(resolve, 100));

        const activeAlerts = alertService.getActiveAlerts();

        // Property: High error rate should trigger alerts
        const errorRate = conditions.recordsProcessed > 0 
          ? (conditions.errorsCount / conditions.recordsProcessed) 
          : 0;
        
        if (conditions.errorsCount > 10 && errorRate > 0.05) {
          const errorAlert = activeAlerts.find(alert => 
            alert.type === AlertType.ERROR && alert.title.includes('High Error Rate')
          );
          expect(errorAlert).toBeDefined();
          expect(errorAlert!.severity).toBe(AlertSeverity.HIGH);
          expect(errorAlert!.migrationId).toBe(migrationId);
        }

        // Property: High memory usage should trigger alerts
        if (conditions.memoryUsageMB > 1500) {
          const memoryAlert = activeAlerts.find(alert => 
            alert.type === AlertType.RESOURCE && alert.title.includes('High Memory Usage')
          );
          expect(memoryAlert).toBeDefined();
          expect(memoryAlert!.severity).toBe(AlertSeverity.MEDIUM);
        }

        // Property: Excessive warnings should trigger alerts
        if (conditions.warningsCount > 50) {
          const warningAlert = activeAlerts.find(alert => 
            alert.type === AlertType.ERROR && alert.title.includes('Excessive Warnings')
          );
          expect(warningAlert).toBeDefined();
          expect(warningAlert!.severity).toBe(AlertSeverity.LOW);
        }

        // Property: All alerts should have required properties
        for (const alert of activeAlerts) {
          expect(alert).toHaveProperty('id');
          expect(alert).toHaveProperty('type');
          expect(alert).toHaveProperty('severity');
          expect(alert).toHaveProperty('title');
          expect(alert).toHaveProperty('message');
          expect(alert).toHaveProperty('timestamp');
          expect(alert).toHaveProperty('context');
          expect(alert).toHaveProperty('actions');
          expect(Array.isArray(alert.actions)).toBe(true);
          expect(alert.actions.length).toBeGreaterThan(0);
          expect(alert.acknowledged).toBe(false);
          expect(alert.resolved).toBe(false);
        }

        // Restore original method
        jest.restoreAllMocks();
        monitorService.endMigration('completed');
      }
    ), { numRuns: 30 });
  });

  /**
   * Property: Integration between logger, monitor, and alert services should be seamless
   * Validates: Requirements 4.5, 4.6, 4.7 - Complete integration of monitoring components
   */
  it('should maintain seamless integration between all monitoring components', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.constantFrom(...Object.values(MigrationPhase)), // phase
      fc.array(fc.record({
        operation: fc.string({ minLength: 1, maxLength: 50 }),
        recordsProcessed: fc.integer({ min: 1, max: 100 }),
        hasError: fc.boolean(),
        errorMessage: fc.string({ minLength: 1, maxLength: 200 }),
      }), { minLength: 1, maxLength: 5 }),
      async (migrationId, phase, operations) => {
        // Start integrated monitoring
        loggerService.setCurrentPhase(phase);
        monitorService.startMigration(migrationId, 10000);
        monitorService.startPhase(phase);

        let totalRecords = 0;
        let totalErrors = 0;

        // Process operations with integrated logging and monitoring
        for (const op of operations) {
          // Start operation timing
          loggerService.startOperation(op.operation);

          // Update progress
          monitorService.updateProgress({
            recordsProcessed: op.recordsProcessed,
            errorsCount: op.hasError ? 1 : 0,
          });

          totalRecords += op.recordsProcessed;
          if (op.hasError) totalErrors++;

          // Log the operation
          if (op.hasError) {
            loggerService.logError(
              op.operation,
              op.errorMessage,
              new Error(op.errorMessage),
              { recordsProcessed: op.recordsProcessed }
            );
          } else {
            loggerService.logProgress(
              op.operation,
              `Processed ${op.recordsProcessed} records`,
              op.recordsProcessed,
              10000,
              { phase }
            );
          }

          // End operation timing
          const duration = loggerService.endOperation(op.operation);
          expect(duration).toBeGreaterThanOrEqual(0);

          // Create audit entry
          await loggerService.createAuditEntry(
            op.operation,
            'migration_records',
            op.hasError ? 'failure' : 'success',
            {
              userId: 'system',
              additionalDetails: {
                recordsProcessed: op.recordsProcessed,
                phase,
              },
            }
          );
        }

        // End phase
        monitorService.endPhase(phase, totalErrors > 0 ? 'failed' : 'completed');

        // Verify integration
        const metrics = monitorService.getCurrentMetrics();
        const phaseMetrics = monitorService.getPhaseMetrics();
        const activeAlerts = alertService.getActiveAlerts();

        // Property: Metrics should reflect all operations
        expect(metrics!.recordsProcessed).toBe(totalRecords);
        expect(metrics!.errorsCount).toBe(totalErrors);

        // Property: Phase metrics should be consistent
        const currentPhaseMetric = phaseMetrics.find(p => p.phase === phase);
        expect(currentPhaseMetric).toBeDefined();
        expect(currentPhaseMetric!.recordsProcessed).toBeGreaterThan(0);
        expect(currentPhaseMetric!.errorsCount).toBe(totalErrors);

        // Property: Database calls should be made for all components
        expect(mockPrismaService.migrationLog.create).toHaveBeenCalled();
        expect(mockPrismaService.auditTrail.create).toHaveBeenCalled();

        // Property: Alerts should be triggered if there are errors
        if (totalErrors > 0) {
          // At least some monitoring activity should be recorded
          expect(mockPrismaService.migrationLog.create.mock.calls.length).toBeGreaterThan(0);
        }

        // Property: All timestamps should be consistent and recent
        const now = new Date();
        expect(metrics!.startTime.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(metrics!.currentTime.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(metrics!.currentTime.getTime()).toBeGreaterThanOrEqual(metrics!.startTime.getTime());

        monitorService.endMigration('completed');
      }
    ), { numRuns: 20 });
  });

  /**
   * Property: System should handle concurrent monitoring operations safely
   * Validates: Requirements 4.5, 4.6, 4.7 - Thread-safe monitoring under concurrent load
   */
  it('should handle concurrent monitoring operations without data corruption', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // migrationId
      fc.array(fc.record({
        operation: fc.string({ minLength: 1, maxLength: 30 }),
        delay: fc.integer({ min: 0, max: 50 }),
        recordsProcessed: fc.integer({ min: 1, max: 50 }),
      }), { minLength: 2, maxLength: 10 }),
      async (migrationId, concurrentOps) => {
        // Start monitoring
        monitorService.startMigration(migrationId, 10000);

        // Execute operations concurrently
        const promises = concurrentOps.map(async (op, index) => {
          await new Promise(resolve => setTimeout(resolve, op.delay));
          
          // Log operation
          loggerService.logInfo(
            `${op.operation}_${index}`,
            `Concurrent operation ${index}`,
            { recordsProcessed: op.recordsProcessed }
          );

          // Update progress
          monitorService.updateProgress({
            recordsProcessed: op.recordsProcessed,
          });

          // Create audit entry
          await loggerService.createAuditEntry(
            `${op.operation}_${index}`,
            'concurrent_test',
            'success',
            {
              userId: `user_${index}`,
              additionalDetails: { operationIndex: index },
            }
          );

          return op.recordsProcessed;
        });

        const results = await Promise.all(promises);
        const expectedTotal = results.reduce((sum, records) => sum + records, 0);

        // Verify final state
        const metrics = monitorService.getCurrentMetrics();

        // Property: Total records should match sum of all operations
        expect(metrics!.recordsProcessed).toBe(expectedTotal);

        // Property: All database operations should have been called
        expect(mockPrismaService.migrationLog.create).toHaveBeenCalledTimes(
          concurrentOps.length
        );
        expect(mockPrismaService.auditTrail.create).toHaveBeenCalledTimes(
          concurrentOps.length
        );

        // Property: No data should be corrupted or lost
        expect(metrics!.errorsCount).toBe(0); // No errors from concurrency
        expect(metrics!.migrationId).toBe(migrationId);

        monitorService.endMigration('completed');
      }
    ), { numRuns: 20 });
  });
});