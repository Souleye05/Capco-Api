import { Test, TestingModule } from '@nestjs/testing';
import { MigrationLoggerService, MigrationPhase, LogLevel } from './migration-logger.service';
import { MigrationMonitorService } from './migration-monitor.service';
import { MigrationAlertService, AlertSeverity, AlertType } from './migration-alert.service';
import { PrismaService } from '../../common/services/prisma.service';

/**
 * Integration tests for the complete monitoring and logging system
 * Validates Requirements 4.5, 4.6, 4.7:
 * - Detailed error logging with stack traces and remediation steps
 * - Real-time progress reporting with ETA calculations
 * - Comprehensive audit trail and migration reports
 */

describe('Migration Monitoring and Logging Integration', () => {
  let loggerService: MigrationLoggerService;
  let monitorService: MigrationMonitorService;
  let alertService: MigrationAlertService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    migrationLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditTrail: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    migrationMetrics: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    migrationAlert: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
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
   * Requirement 4.5: Detailed error logging with stack traces and remediation steps
   */
  describe('Detailed Error Logging (Requirement 4.5)', () => {
    it('should log detailed error information with stack traces and remediation steps', async () => {
      const error = new Error('Test migration error');
      const context = { table: 'users', recordId: '123', operation: 'insert' };
      const remediationSteps = [
        'Check database connectivity',
        'Verify data integrity',
        'Review foreign key constraints'
      ];

      loggerService.setCurrentPhase(MigrationPhase.DATA_MIGRATION);
      loggerService.logError('data_insert_failed', 'Failed to insert user record', error, context, remediationSteps);

      // Verify database call was made with correct structure
      expect(mockPrismaService.migrationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          level: LogLevel.ERROR,
          phase: MigrationPhase.DATA_MIGRATION,
          operation: 'data_insert_failed',
          message: 'Failed to insert user record',
          context: expect.objectContaining({
            table: 'users',
            recordId: '123',
            operation: 'insert',
            errorName: 'Error',
            errorMessage: 'Test migration error'
          }),
          stackTrace: expect.stringContaining('Error: Test migration error'),
          remediationSteps: remediationSteps
        })
      });
    });

    it('should log critical errors with immediate attention flags', async () => {
      const criticalError = new Error('Database connection lost');
      const context = { connectionPool: 'primary', activeConnections: 0 };

      loggerService.logCritical('database_connection_lost', 'Critical database failure', criticalError, context);

      expect(mockPrismaService.migrationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          level: LogLevel.CRITICAL,
          operation: 'database_connection_lost',
          message: 'Critical database failure',
          stackTrace: expect.stringContaining('Error: Database connection lost'),
          context: expect.objectContaining({
            connectionPool: 'primary',
            activeConnections: 0,
            errorName: 'Error',
            errorMessage: 'Database connection lost'
          })
        })
      });
    });

    it('should provide contextual information for troubleshooting', async () => {
      const operationId = 'user_migration_batch_5';
      loggerService.startOperation(operationId);
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = loggerService.endOperation(operationId);
      
      loggerService.logInfo('batch_completed', 'User migration batch completed', {
        batchId: 5,
        recordsProcessed: 100,
        duration: duration,
        memoryUsage: process.memoryUsage().heapUsed
      });

      expect(mockPrismaService.migrationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          level: LogLevel.INFO,
          operation: 'batch_completed',
          message: 'User migration batch completed',
          context: expect.objectContaining({
            batchId: 5,
            recordsProcessed: 100,
            duration: expect.any(Number),
            memoryUsage: expect.any(Number)
          })
        })
      });
    });
  });

  /**
   * Requirement 4.6: Real-time progress reporting with ETA calculations
   */
  describe('Real-time Progress Reporting (Requirement 4.6)', () => {
    it('should provide real-time progress updates with detailed status', () => {
      const migrationId = 'test_migration_001';
      monitorService.startMigration(migrationId, 10000, 50, 500, 1000000000);

      // Simulate progress updates
      monitorService.updateProgress({
        recordsProcessed: 1000,
        tablesProcessed: 5,
        filesProcessed: 50,
        bytesProcessed: 100000000
      });

      const metrics = monitorService.getCurrentMetrics();

      expect(metrics).not.toBeNull();
      expect(metrics!.migrationId).toBe(migrationId);
      expect(metrics!.recordsProcessed).toBe(1000);
      expect(metrics!.tablesProcessed).toBe(5);
      expect(metrics!.filesProcessed).toBe(50);
      expect(metrics!.bytesProcessed).toBe(100000000);
      expect(metrics!.progressPercentage).toBe(10); // 1000/10000 * 100
      expect(metrics!.recordsPerSecond).toBeGreaterThanOrEqual(0);
    });

    it('should calculate ETA with confidence metrics', async () => {
      const migrationId = 'test_migration_002';
      monitorService.startMigration(migrationId, 5000);

      // Simulate consistent processing rate
      for (let i = 0; i < 3; i++) {
        monitorService.updateProgress({ recordsProcessed: 100 });
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for rate calculation
      }

      const eta = monitorService.getETA();
      const metrics = monitorService.getCurrentMetrics();

      expect(metrics!.recordsPerSecond).toBeGreaterThan(0);
      
      if (eta.eta) {
        expect(eta.eta.getTime()).toBeGreaterThan(Date.now());
        expect(eta.confidence).toBeGreaterThanOrEqual(0);
        expect(eta.confidence).toBeLessThanOrEqual(100);
      }

      expect(metrics!.estimatedRemainingTime).toBeDefined();
      if (metrics!.estimatedRemainingTime) {
        expect(metrics!.estimatedRemainingTime).toBeGreaterThan(0);
      }
    });

    it('should track phase-based progress with timing', () => {
      const migrationId = 'test_migration_003';
      monitorService.startMigration(migrationId);

      // Test phase progression
      monitorService.startPhase(MigrationPhase.SCHEMA_EXTRACTION);
      monitorService.updateProgress({ recordsProcessed: 50, tablesProcessed: 2 });
      monitorService.endPhase(MigrationPhase.SCHEMA_EXTRACTION, 'completed');

      monitorService.startPhase(MigrationPhase.DATA_MIGRATION);
      monitorService.updateProgress({ recordsProcessed: 200, errorsCount: 2 });
      monitorService.endPhase(MigrationPhase.DATA_MIGRATION, 'completed');

      const phaseMetrics = monitorService.getPhaseMetrics();

      expect(phaseMetrics).toHaveLength(2);
      
      const schemaPhase = phaseMetrics.find(p => p.phase === MigrationPhase.SCHEMA_EXTRACTION);
      const dataPhase = phaseMetrics.find(p => p.phase === MigrationPhase.DATA_MIGRATION);

      expect(schemaPhase).toBeDefined();
      expect(schemaPhase!.status).toBe('completed');
      expect(schemaPhase!.duration).toBeGreaterThanOrEqual(0);

      expect(dataPhase).toBeDefined();
      expect(dataPhase!.status).toBe('completed');
      expect(dataPhase!.errorsCount).toBe(2);
    });

    it('should generate comprehensive status reports', () => {
      const migrationId = 'test_migration_004';
      monitorService.startMigration(migrationId, 1000);
      
      monitorService.updateProgress({
        recordsProcessed: 100,
        errorsCount: 5,
        warningsCount: 10
      });

      const statusReport = monitorService.generateStatusReport();

      expect(statusReport).toHaveProperty('migration');
      expect(statusReport).toHaveProperty('phases');
      expect(statusReport).toHaveProperty('eta');
      expect(statusReport).toHaveProperty('alerts');
      expect(statusReport).toHaveProperty('recommendations');

      expect(statusReport.migration!.recordsProcessed).toBe(100);
      expect(statusReport.migration!.errorsCount).toBe(5);
      expect(statusReport.alerts.length).toBeGreaterThan(0); // Should have alerts for errors
      expect(Array.isArray(statusReport.recommendations)).toBe(true);
    });
  });

  /**
   * Requirement 4.7: Comprehensive audit trail and migration reports
   */
  describe('Comprehensive Audit Trail (Requirement 4.7)', () => {
    it('should create detailed audit entries for all operations', async () => {
      const auditData = {
        userId: 'admin_123',
        resourceId: 'migration_001',
        oldValues: { status: 'pending', recordsProcessed: 0 },
        newValues: { status: 'in_progress', recordsProcessed: 500 },
        ipAddress: '192.168.1.100',
        userAgent: 'Migration-System/1.0',
        sessionId: 'session_456',
        additionalDetails: {
          migrationPhase: MigrationPhase.DATA_MIGRATION,
          batchSize: 100,
          processingRate: 50.5
        }
      };

      await loggerService.createAuditEntry(
        'migration_progress_update',
        'migration_system',
        'success',
        auditData
      );

      expect(mockPrismaService.auditTrail.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'migration_progress_update',
          resource: 'migration_system',
          result: 'success',
          userId: 'admin_123',
          resourceId: 'migration_001',
          oldValues: { status: 'pending', recordsProcessed: 0 },
          newValues: { status: 'in_progress', recordsProcessed: 500 },
          ipAddress: '192.168.1.100',
          userAgent: 'Migration-System/1.0',
          sessionId: 'session_456',
          details: {
            migrationPhase: MigrationPhase.DATA_MIGRATION,
            batchSize: 100,
            processingRate: 50.5
          }
        })
      });
    });

    it('should track complete migration statistics', async () => {
      const migrationId = 'audit_test_migration';
      
      // Start migration with audit
      await loggerService.createAuditEntry(
        'migration_started',
        'migration_system',
        'success',
        {
          userId: 'system',
          additionalDetails: {
            migrationId,
            totalRecords: 10000,
            totalTables: 25,
            totalFiles: 500,
            estimatedDuration: 7200000 // 2 hours in ms
          }
        }
      );

      monitorService.startMigration(migrationId, 10000, 25, 500);
      
      // Simulate migration progress with audit trail
      const phases = [
        MigrationPhase.SCHEMA_EXTRACTION,
        MigrationPhase.DATA_MIGRATION,
        MigrationPhase.USER_MIGRATION
      ];

      for (const phase of phases) {
        await loggerService.createAuditEntry(
          'phase_started',
          'migration_phase',
          'success',
          {
            userId: 'system',
            additionalDetails: { phase, migrationId }
          }
        );

        monitorService.startPhase(phase);
        monitorService.updateProgress({
          recordsProcessed: 1000,
          tablesProcessed: 3,
          filesProcessed: 50
        });
        monitorService.endPhase(phase, 'completed');

        await loggerService.createAuditEntry(
          'phase_completed',
          'migration_phase',
          'success',
          {
            userId: 'system',
            additionalDetails: {
              phase,
              migrationId,
              recordsProcessed: 1000,
              duration: 300000 // 5 minutes
            }
          }
        );
      }

      // Complete migration with final audit
      const finalMetrics = monitorService.getCurrentMetrics();
      await loggerService.createAuditEntry(
        'migration_completed',
        'migration_system',
        'success',
        {
          userId: 'system',
          additionalDetails: {
            migrationId,
            totalDuration: finalMetrics!.elapsedTime,
            recordsProcessed: finalMetrics!.recordsProcessed,
            errorsCount: finalMetrics!.errorsCount,
            phasesCompleted: phases.length
          }
        }
      );

      monitorService.endMigration('completed');

      // Verify comprehensive audit trail was created
      expect(mockPrismaService.auditTrail.create).toHaveBeenCalledTimes(8); // 1 start + 3 phases * 2 + 1 complete
    });

    it('should provide audit trail querying capabilities', async () => {
      const mockAuditEntries = [
        {
          id: 'audit_1',
          userId: 'user_123',
          action: 'migration_started',
          resource: 'migration_system',
          resourceId: 'migration_001',
          oldValues: {},
          newValues: { status: 'started' },
          ipAddress: '192.168.1.100',
          userAgent: 'Migration-System/1.0',
          sessionId: 'session_456',
          result: 'success',
          details: { migrationId: 'migration_001' },
          timestamp: new Date()
        }
      ];

      mockPrismaService.auditTrail.findMany.mockResolvedValue(mockAuditEntries);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const auditTrail = await loggerService.getAuditTrail(startDate, endDate, 'user_123', 'migration_started');

      expect(mockPrismaService.auditTrail.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          userId: 'user_123',
          action: 'migration_started'
        },
        orderBy: { timestamp: 'desc' },
        take: 1000
      });

      expect(auditTrail).toHaveLength(1);
      expect(auditTrail[0].action).toBe('migration_started');
      expect(auditTrail[0].userId).toBe('user_123');
    });
  });

  /**
   * Integration test: Complete monitoring workflow
   */
  describe('Complete Monitoring Workflow Integration', () => {
    it('should handle complete migration monitoring lifecycle', async () => {
      const migrationId = 'integration_test_migration';
      
      // Setup alert monitoring
      let alertsTriggered: any[] = [];
      alertService.on('alert_triggered', (alert) => {
        alertsTriggered.push(alert);
      });

      // Start comprehensive monitoring
      loggerService.setCurrentPhase(MigrationPhase.INITIALIZATION);
      monitorService.startMigration(migrationId, 5000, 20, 200, 500000000);

      await loggerService.createAuditEntry(
        'migration_started',
        'migration_system',
        'success',
        { userId: 'admin', additionalDetails: { migrationId } }
      );

      // Simulate migration with various scenarios
      const phases = [
        { phase: MigrationPhase.SCHEMA_EXTRACTION, records: 0, errors: 0 },
        { phase: MigrationPhase.DATA_MIGRATION, records: 2000, errors: 5 }, // Some errors
        { phase: MigrationPhase.USER_MIGRATION, records: 1500, errors: 0 },
        { phase: MigrationPhase.FILE_MIGRATION, records: 800, errors: 2 },
        { phase: MigrationPhase.VALIDATION, records: 500, errors: 0 }
      ];

      for (const { phase, records, errors } of phases) {
        loggerService.setCurrentPhase(phase);
        monitorService.startPhase(phase);

        // Simulate progress with potential issues
        monitorService.updateProgress({
          recordsProcessed: records,
          errorsCount: errors,
          tablesProcessed: 4,
          filesProcessed: 40
        });

        if (errors > 0) {
          loggerService.logError(
            'phase_errors',
            `Errors encountered in ${phase}`,
            new Error(`${errors} errors in phase`),
            { phase, errorCount: errors }
          );
        }

        monitorService.endPhase(phase, errors > 0 ? 'completed' : 'completed');

        await loggerService.createAuditEntry(
          'phase_completed',
          'migration_phase',
          errors > 0 ? 'partial' : 'success',
          {
            userId: 'system',
            additionalDetails: { phase, records, errors }
          }
        );

        // Small delay to allow alert processing
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Complete migration
      const finalMetrics = monitorService.getCurrentMetrics();
      monitorService.endMigration('completed');

      await loggerService.createAuditEntry(
        'migration_completed',
        'migration_system',
        'success',
        {
          userId: 'admin',
          additionalDetails: {
            migrationId,
            finalMetrics: {
              recordsProcessed: finalMetrics!.recordsProcessed,
              errorsCount: finalMetrics!.errorsCount,
              duration: finalMetrics!.elapsedTime
            }
          }
        }
      );

      // Verify comprehensive monitoring occurred
      expect(finalMetrics!.recordsProcessed).toBe(4800); // Sum of all records
      expect(finalMetrics!.errorsCount).toBe(7); // Sum of all errors
      expect(finalMetrics!.progressPercentage).toBe(96); // 4800/5000 * 100

      // Verify phase tracking
      const phaseMetrics = monitorService.getPhaseMetrics();
      expect(phaseMetrics).toHaveLength(5);
      expect(phaseMetrics.every(p => p.status === 'completed')).toBe(true);

      // Verify alerts were triggered for errors
      expect(alertsTriggered.length).toBeGreaterThan(0);

      // Verify audit trail was comprehensive
      expect(mockPrismaService.auditTrail.create).toHaveBeenCalledTimes(7); // 1 start + 5 phases + 1 complete

      // Verify logging occurred
      expect(mockPrismaService.migrationLog.create).toHaveBeenCalled();
    });
  });
});