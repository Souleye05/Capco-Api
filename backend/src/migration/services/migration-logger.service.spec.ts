import { Test, TestingModule } from '@nestjs/testing';
import { MigrationLoggerService, LogLevel, MigrationPhase } from './migration-logger.service';
import { PrismaService } from '../../common/services/prisma.service';

describe('MigrationLoggerService', () => {
  let service: MigrationLoggerService;
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationLoggerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MigrationLoggerService>(MigrationLoggerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setCurrentPhase', () => {
    it('should set the current phase and log the change', () => {
      const logInfoSpy = jest.spyOn(service, 'logInfo').mockImplementation();
      
      service.setCurrentPhase(MigrationPhase.DATA_MIGRATION);
      
      expect(logInfoSpy).toHaveBeenCalledWith(
        'phase_change',
        'Migration phase changed to: data_migration',
        expect.any(Object)
      );
    });
  });

  describe('operation timing', () => {
    it('should track operation duration', () => {
      const operationId = 'test-operation';
      
      service.startOperation(operationId);
      const duration = service.endOperation(operationId);
      
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for unknown operation', () => {
      const duration = service.endOperation('unknown-operation');
      expect(duration).toBe(0);
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      // Mock the private log method
      jest.spyOn(service as any, 'log').mockImplementation();
    });

    it('should log debug messages', () => {
      service.logDebug('test-operation', 'debug message', { key: 'value' });
      
      expect((service as any).log).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        'test-operation',
        'debug message',
        { key: 'value' }
      );
    });

    it('should log info messages', () => {
      service.logInfo('test-operation', 'info message');
      
      expect((service as any).log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'test-operation',
        'info message',
        undefined
      );
    });

    it('should log warnings', () => {
      service.logWarn('test-operation', 'warning message');
      
      expect((service as any).log).toHaveBeenCalledWith(
        LogLevel.WARN,
        'test-operation',
        'warning message',
        undefined
      );
    });

    it('should log errors with stack trace', () => {
      const error = new Error('test error');
      const remediationSteps = ['step 1', 'step 2'];
      
      service.logError('test-operation', 'error message', error, { key: 'value' }, remediationSteps);
      
      expect((service as any).log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'test-operation',
        'error message',
        expect.objectContaining({
          key: 'value',
          errorName: 'Error',
          errorMessage: 'test error'
        }),
        error.stack,
        undefined,
        remediationSteps
      );
    });

    it('should log critical errors', () => {
      const error = new Error('critical error');
      
      service.logCritical('test-operation', 'critical message', error);
      
      expect((service as any).log).toHaveBeenCalledWith(
        LogLevel.CRITICAL,
        'test-operation',
        'critical message',
        expect.objectContaining({
          errorName: 'Error',
          errorMessage: 'critical error'
        }),
        error.stack,
        undefined,
        undefined
      );
    });

    it('should log progress with metrics', () => {
      service.logProgress('test-operation', 'progress message', 100, 1000, { phase: 'data' });
      
      expect((service as any).log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'test-operation',
        'progress message',
        expect.objectContaining({
          phase: 'data',
          recordsProcessed: 100,
          totalRecords: 1000,
          progressPercentage: 10
        }),
        undefined,
        undefined,
        undefined,
        100
      );
    });
  });

  describe('createAuditEntry', () => {
    it('should create audit entry with all details', async () => {
      const auditData = {
        userId: 'user-123',
        resourceId: 'resource-456',
        oldValues: { status: 'old' },
        newValues: { status: 'new' },
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        sessionId: 'session-789',
        additionalDetails: { extra: 'data' }
      };

      await service.createAuditEntry('update', 'user', 'success', auditData);

      expect(mockPrismaService.auditTrail.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'update',
          resource: 'user',
          result: 'success',
          userId: 'user-123',
          resourceId: 'resource-456',
          oldValues: { status: 'old' },
          newValues: { status: 'new' },
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
          sessionId: 'session-789',
          details: { extra: 'data' }
        })
      });
    });

    it('should create minimal audit entry', async () => {
      await service.createAuditEntry('create', 'record', 'success');

      expect(mockPrismaService.auditTrail.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'create',
          resource: 'record',
          result: 'success',
          oldValues: {},
          newValues: {},
          details: {}
        })
      });
    });
  });

  describe('getLogsByPhase', () => {
    it('should retrieve logs by phase', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          level: LogLevel.INFO,
          phase: MigrationPhase.DATA_MIGRATION,
          component: 'test',
          operation: 'test-op',
          message: 'test message',
          context: {},
          stackTrace: null,
          duration: null,
          recordsProcessed: null,
          remediationSteps: [],
          timestamp: new Date()
        }
      ];

      mockPrismaService.migrationLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getLogsByPhase(MigrationPhase.DATA_MIGRATION, 50);

      expect(mockPrismaService.migrationLog.findMany).toHaveBeenCalledWith({
        where: { phase: MigrationPhase.DATA_MIGRATION },
        orderBy: { timestamp: 'desc' },
        take: 50
      });

      expect(result).toHaveLength(1);
      expect(result[0].phase).toBe(MigrationPhase.DATA_MIGRATION);
    });
  });

  describe('getErrorLogs', () => {
    it('should retrieve error logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          level: LogLevel.ERROR,
          phase: MigrationPhase.DATA_MIGRATION,
          component: 'test',
          operation: 'test-op',
          message: 'error message',
          context: {},
          stackTrace: 'stack trace',
          duration: null,
          recordsProcessed: null,
          remediationSteps: ['fix step'],
          timestamp: new Date()
        }
      ];

      mockPrismaService.migrationLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getErrorLogs(25);

      expect(mockPrismaService.migrationLog.findMany).toHaveBeenCalledWith({
        where: {
          level: {
            in: [LogLevel.ERROR, LogLevel.CRITICAL]
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 25
      });

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(LogLevel.ERROR);
    });
  });

  describe('getAuditTrail', () => {
    it('should retrieve audit trail with filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const userId = 'user-123';
      const action = 'update';

      const mockAuditEntries = [
        {
          id: 'audit-1',
          userId: 'user-123',
          action: 'update',
          resource: 'user',
          resourceId: 'resource-456',
          oldValues: {},
          newValues: {},
          ipAddress: null,
          userAgent: null,
          sessionId: null,
          result: 'success',
          details: {},
          timestamp: new Date()
        }
      ];

      mockPrismaService.auditTrail.findMany.mockResolvedValue(mockAuditEntries);

      const result = await service.getAuditTrail(startDate, endDate, userId, action, 500);

      expect(mockPrismaService.auditTrail.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          userId: 'user-123',
          action: 'update'
        },
        orderBy: { timestamp: 'desc' },
        take: 500
      });

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('update');
    });

    it('should retrieve audit trail without filters', async () => {
      mockPrismaService.auditTrail.findMany.mockResolvedValue([]);

      await service.getAuditTrail();

      expect(mockPrismaService.auditTrail.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        take: 1000
      });
    });
  });
});