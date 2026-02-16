import { Test, TestingModule } from '@nestjs/testing';
import { CheckpointService } from './checkpoint.service';
import { PrismaService } from '../../common/services/prisma.service';
import { BackupService } from './backup.service';
import { RollbackService } from './rollback.service';
import { MigrationPhase, CheckpointStatus } from '../types/checkpoint.types';

describe('CheckpointService', () => {
  let service: CheckpointService;
  let prismaService: PrismaService;
  let backupService: BackupService;
  let rollbackService: RollbackService;

  const mockPrismaService = {
    migrationCheckpoint: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    file: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
  };

  const mockBackupService = {
    createCompleteBackup: jest.fn(),
    getBackupDetails: jest.fn(),
    listBackups: jest.fn(),
    deleteBackup: jest.fn(),
  };

  const mockRollbackService = {
    rollbackToBackup: jest.fn(),
    validateBackupIntegrity: jest.fn(),
    listRollbacks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckpointService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BackupService,
          useValue: mockBackupService,
        },
        {
          provide: RollbackService,
          useValue: mockRollbackService,
        },
      ],
    }).compile();

    service = module.get<CheckpointService>(CheckpointService);
    prismaService = module.get<PrismaService>(PrismaService);
    backupService = module.get<BackupService>(BackupService);
    rollbackService = module.get<RollbackService>(RollbackService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckpoint', () => {
    it('should create a checkpoint successfully', async () => {
      const checkpointName = 'test-checkpoint';
      const phase = MigrationPhase.INITIAL;
      const description = 'Test checkpoint';

      // Mock backup service responses
      mockBackupService.createCompleteBackup.mockResolvedValue({
        backupId: 'backup-123',
        timestamp: new Date(),
        database: { filePath: 'db-backup-path' },
        storage: { backupPath: 'storage-backup-path' },
        overallStatus: 'COMPLETED',
        totalSize: 1000,
        overallChecksum: 'checksum123',
        metadata: { id: 'backup-123' },
      });

      // Mock metadata collection
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.file.count.mockResolvedValue(5);
      mockPrismaService.file.aggregate.mockResolvedValue({ _sum: { size: 1000 } });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ count: '100' }]);

      // Mock database save
      mockPrismaService.migrationCheckpoint.create.mockResolvedValue({
        id: 'checkpoint-id',
        name: checkpointName,
        description,
        phase,
        status: CheckpointStatus.CREATED,
        createdAt: new Date(),
        databaseBackup: 'db-backup-path',
        storageBackup: 'storage-backup-path',
        configBackup: 'backup-123/metadata.json',
        metadata: {},
        validationResults: [],
      });

      const result = await service.createCheckpoint(checkpointName, phase, description);

      expect(result).toBeDefined();
      expect(result.name).toBe(checkpointName);
      expect(result.phase).toBe(phase);
      expect(result.description).toBe(description);
      expect(mockBackupService.createCompleteBackup).toHaveBeenCalled();
      expect(mockPrismaService.migrationCheckpoint.create).toHaveBeenCalled();
    });

    it('should handle checkpoint creation failure', async () => {
      const checkpointName = 'test-checkpoint';
      const phase = MigrationPhase.INITIAL;

      mockBackupService.createCompleteBackup.mockRejectedValue(new Error('Backup failed'));

      await expect(service.createCheckpoint(checkpointName, phase)).rejects.toThrow(
        'Checkpoint creation failed: Backup failed'
      );
    });
  });

  describe('validateCheckpointBeforeProgression', () => {
    it('should validate checkpoint successfully', async () => {
      const phase = MigrationPhase.INITIAL;

      const mockCheckpoint = {
        id: 'checkpoint-id',
        name: 'test-checkpoint',
        phase,
        status: CheckpointStatus.VALIDATED,
        metadata: {
          version: '1.0.0',
          migrationStep: phase,
          dataIntegrity: { recordCounts: {}, checksums: {} },
          userCounts: { totalUsers: 10, migratedUsers: 5 },
          fileCounts: { totalFiles: 5, migratedFiles: 3, totalSize: 1000 },
        },
        validationResults: [],
        createdAt: new Date(),
        databaseBackup: 'db-backup',
        storageBackup: 'storage-backup',
        configBackup: 'config-backup',
      };

      mockPrismaService.migrationCheckpoint.findFirst.mockResolvedValue(mockCheckpoint);
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.file.count.mockResolvedValue(5);
      mockPrismaService.file.aggregate.mockResolvedValue({ _sum: { size: 1000 } });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ count: '0' }]);
      mockPrismaService.migrationCheckpoint.update.mockResolvedValue(mockCheckpoint);

      const result = await service.validateCheckpointBeforeProgression(phase);

      expect(result).toBe(true);
      expect(mockPrismaService.migrationCheckpoint.findFirst).toHaveBeenCalledWith({
        where: {
          phase,
          status: { in: [CheckpointStatus.VALIDATED, CheckpointStatus.ACTIVE] },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return false when no checkpoint exists', async () => {
      const phase = MigrationPhase.INITIAL;

      mockPrismaService.migrationCheckpoint.findFirst.mockResolvedValue(null);

      const result = await service.validateCheckpointBeforeProgression(phase);

      expect(result).toBe(false);
    });
  });

  describe('rollbackToCheckpoint', () => {
    it('should rollback to checkpoint successfully', async () => {
      const checkpointId = 'checkpoint-id';
      const mockCheckpoint = {
        id: checkpointId,
        name: 'test-checkpoint',
        phase: MigrationPhase.INITIAL,
        status: CheckpointStatus.VALIDATED,
        databaseBackup: 'db-backup-path',
        storageBackup: 'storage-backup-path',
        configBackup: 'config-backup-path',
        metadata: {
          version: '1.0.0',
          migrationStep: MigrationPhase.INITIAL,
          dataIntegrity: { recordCounts: {}, checksums: {} },
          userCounts: { totalUsers: 10, migratedUsers: 5 },
          fileCounts: { totalFiles: 5, migratedFiles: 3, totalSize: 1000 },
        },
        validationResults: [],
        createdAt: new Date(),
        description: null,
      };

      mockPrismaService.migrationCheckpoint.findUnique.mockResolvedValue(mockCheckpoint);
      mockRollbackService.rollbackToBackup.mockResolvedValue({
        rollbackId: 'rollback-123',
        backupId: 'backup-123',
        startTime: new Date(),
        database: { status: 'COMPLETED' },
        users: { status: 'COMPLETED' },
        storage: { status: 'COMPLETED' },
        overallStatus: 'COMPLETED',
      });
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.rollbackToCheckpoint(checkpointId);

      expect(result.success).toBe(true);
      expect(result.checkpointId).toBe(checkpointId);
      expect(result.checkpointName).toBe('test-checkpoint');
      expect(result.componentsRolledBack).toContain('database');
      expect(result.componentsRolledBack).toContain('storage');
      expect(result.componentsRolledBack).toContain('configuration');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle rollback failure', async () => {
      const checkpointId = 'checkpoint-id';

      mockPrismaService.migrationCheckpoint.findUnique.mockResolvedValue(null);

      const result = await service.rollbackToCheckpoint(checkpointId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Checkpoint not found: checkpoint-id');
    });
  });

  describe('listCheckpoints', () => {
    it('should list all checkpoints', async () => {
      const mockCheckpoints = [
        {
          id: 'checkpoint-1',
          name: 'checkpoint-1',
          description: null,
          phase: MigrationPhase.INITIAL,
          status: CheckpointStatus.VALIDATED,
          createdAt: new Date(),
          databaseBackup: 'db-backup-1',
          storageBackup: 'storage-backup-1',
          configBackup: 'config-backup-1',
          metadata: {},
          validationResults: [],
        },
        {
          id: 'checkpoint-2',
          name: 'checkpoint-2',
          description: null,
          phase: MigrationPhase.DATA_MIGRATED,
          status: CheckpointStatus.ACTIVE,
          createdAt: new Date(),
          databaseBackup: 'db-backup-2',
          storageBackup: 'storage-backup-2',
          configBackup: 'config-backup-2',
          metadata: {},
          validationResults: [],
        },
      ];

      mockPrismaService.migrationCheckpoint.findMany.mockResolvedValue(mockCheckpoints);

      const result = await service.listCheckpoints();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('checkpoint-1');
      expect(result[1].id).toBe('checkpoint-2');
    });

    it('should filter checkpoints by phase', async () => {
      const phase = MigrationPhase.INITIAL;
      const mockCheckpoints = [
        {
          id: 'checkpoint-1',
          name: 'checkpoint-1',
          description: null,
          phase: MigrationPhase.INITIAL,
          status: CheckpointStatus.VALIDATED,
          createdAt: new Date(),
          databaseBackup: 'db-backup-1',
          storageBackup: 'storage-backup-1',
          configBackup: 'config-backup-1',
          metadata: {},
          validationResults: [],
        },
      ];

      mockPrismaService.migrationCheckpoint.findMany.mockResolvedValue(mockCheckpoints);

      const result = await service.listCheckpoints(phase);

      expect(result).toHaveLength(1);
      expect(result[0].phase).toBe(phase);
      expect(mockPrismaService.migrationCheckpoint.findMany).toHaveBeenCalledWith({
        where: { phase },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});