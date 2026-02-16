import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { BackupService } from './backup.service';
import { RollbackService } from './rollback.service';
import { RollbackStatus } from '../types/rollback.types';
import {
  CheckpointInfo,
  CheckpointMetadata,
  ValidationResult,
  MigrationPhase,
  CheckpointStatus,
  RollbackToCheckpointResult,
} from '../types/checkpoint.types';
import { MigrationPhase as PrismaMigrationPhase, CheckpointStatus as PrismaCheckpointStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CheckpointService {
  private readonly logger = new Logger(CheckpointService.name);

  // Helper functions to convert between our enums and Prisma enums
  private toPrismaPhase(phase: MigrationPhase): PrismaMigrationPhase {
    return phase as unknown as PrismaMigrationPhase;
  }

  private fromPrismaPhase(phase: PrismaMigrationPhase): MigrationPhase {
    return phase as unknown as MigrationPhase;
  }

  private toPrismaStatus(status: CheckpointStatus): PrismaCheckpointStatus {
    return status as unknown as PrismaCheckpointStatus;
  }

  private fromPrismaStatus(status: PrismaCheckpointStatus): CheckpointStatus {
    return status as unknown as CheckpointStatus;
  }
  private readonly checkpointDir = process.env.CHECKPOINT_DIR || './migration-checkpoints';

  constructor(
    private readonly prisma: PrismaService,
    private readonly backupService: BackupService,
    private readonly rollbackService: RollbackService,
  ) {}

  async createCheckpoint(
    name: string,
    phase: MigrationPhase,
    description?: string,
  ): Promise<CheckpointInfo> {
    this.logger.log(`Creating checkpoint: ${name} for phase: ${phase}`);

    const checkpointId = this.generateCheckpointId();
    const timestamp = new Date();

    try {
      // Ensure checkpoint directory exists
      await this.ensureCheckpointDirectory();

      // Create comprehensive backups
      const completeBackup = await this.backupService.createCompleteBackup(
        `Checkpoint backup for ${name}`
      );
      
      const databaseBackup = completeBackup.database.filePath;
      const storageBackup = completeBackup.storage.backupPath;
      const configBackup = `${completeBackup.backupId}/metadata.json`;

      // Collect metadata about current state
      const metadata = await this.collectCheckpointMetadata(phase);

      // Validate checkpoint integrity
      const validationResults = await this.validateCheckpointIntegrity(metadata);

      const checkpoint: CheckpointInfo = {
        id: checkpointId,
        name,
        description,
        phase,
        status: CheckpointStatus.CREATED,
        createdAt: timestamp,
        databaseBackup,
        storageBackup,
        configBackup,
        metadata,
        validationResults,
      };

      // Save checkpoint to database
      await this.saveCheckpointToDatabase(checkpoint);

      // Save checkpoint metadata to file
      await this.saveCheckpointToFile(checkpoint);

      // Mark previous checkpoints as superseded if this one is valid
      if (validationResults.every(r => r.status !== 'failed')) {
        await this.markPreviousCheckpointsSuperseded(phase);
        checkpoint.status = CheckpointStatus.VALIDATED;
        await this.updateCheckpointStatus(checkpointId, CheckpointStatus.VALIDATED);
      }

      this.logger.log(`Checkpoint created successfully: ${checkpointId}`);
      return checkpoint;

    } catch (error) {
      this.logger.error(`Failed to create checkpoint: ${error.message}`, error.stack);
      throw new Error(`Checkpoint creation failed: ${error.message}`);
    }
  }

  async validateCheckpointBeforeProgression(
    currentPhase: MigrationPhase,
  ): Promise<boolean> {
    this.logger.log(`Validating checkpoint before progressing from phase: ${currentPhase}`);

    try {
      const activeCheckpoint = await this.getActiveCheckpointForPhase(currentPhase);
      
      if (!activeCheckpoint) {
        this.logger.warn(`No active checkpoint found for phase: ${currentPhase}`);
        return false;
      }

      // Validate checkpoint integrity
      const validationResults = await this.validateCheckpointIntegrity(
        activeCheckpoint.metadata
      );

      const hasFailures = validationResults.some(r => r.status === 'failed');
      
      if (hasFailures) {
        this.logger.error(`Checkpoint validation failed for phase: ${currentPhase}`);
        await this.updateCheckpointStatus(activeCheckpoint.id, CheckpointStatus.FAILED);
        return false;
      }

      // Mark checkpoint as active
      await this.updateCheckpointStatus(activeCheckpoint.id, CheckpointStatus.ACTIVE);
      
      this.logger.log(`Checkpoint validation passed for phase: ${currentPhase}`);
      return true;

    } catch (error) {
      this.logger.error(`Checkpoint validation error: ${error.message}`, error.stack);
      return false;
    }
  }

  async rollbackToCheckpoint(checkpointId: string): Promise<RollbackToCheckpointResult> {
    this.logger.log(`Starting rollback to checkpoint: ${checkpointId}`);

    const result: RollbackToCheckpointResult = {
      success: false,
      checkpointId,
      checkpointName: '',
      rollbackStartTime: new Date(),
      componentsRolledBack: [],
      errors: [],
      validationResults: [],
    };

    try {
      const checkpoint = await this.getCheckpointById(checkpointId);
      
      if (!checkpoint) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }

      result.checkpointName = checkpoint.name;

      // Rollback database
      try {
        // For now, we'll use the rollback service to handle the restoration
        const rollbackResult = await this.rollbackService.rollbackToBackup(
          checkpoint.databaseBackup.split('/')[0] // Extract backup ID from path
        );
        
        if (rollbackResult.overallStatus === RollbackStatus.COMPLETED) {
          result.componentsRolledBack.push('database');
          result.componentsRolledBack.push('storage');
          result.componentsRolledBack.push('configuration');
          this.logger.log('Complete rollback completed');
        } else {
          if (rollbackResult.error) {
            result.errors.push(`Rollback failed: ${rollbackResult.error}`);
          }
          if (rollbackResult.database.error) {
            result.errors.push(`Database rollback failed: ${rollbackResult.database.error}`);
          }
          if (rollbackResult.storage.error) {
            result.errors.push(`Storage rollback failed: ${rollbackResult.storage.error}`);
          }
        }
      } catch (error) {
        result.errors.push(`Rollback failed: ${error.message}`);
      }

      // Validate rollback success
      result.validationResults = await this.validateRollbackSuccess(checkpoint);
      
      result.success = result.errors.length === 0 && 
                      result.validationResults.every(r => r.status !== 'failed');

      result.rollbackEndTime = new Date();

      if (result.success) {
        this.logger.log(`Rollback to checkpoint ${checkpointId} completed successfully`);
      } else {
        this.logger.error(`Rollback to checkpoint ${checkpointId} completed with errors`);
      }

      return result;

    } catch (error) {
      result.errors.push(error.message);
      result.rollbackEndTime = new Date();
      this.logger.error(`Rollback failed: ${error.message}`, error.stack);
      return result;
    }
  }

  async listCheckpoints(phase?: MigrationPhase): Promise<CheckpointInfo[]> {
    try {
      const whereClause = phase ? { phase: this.toPrismaPhase(phase) } : {};
      
      const checkpoints = await this.prisma.migrationCheckpoint.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      return checkpoints.map(cp => ({
        id: cp.id,
        name: cp.name,
        description: cp.description,
        phase: cp.phase as MigrationPhase,
        status: cp.status as CheckpointStatus,
        createdAt: cp.createdAt,
        databaseBackup: cp.databaseBackup,
        storageBackup: cp.storageBackup,
        configBackup: cp.configBackup,
        metadata: cp.metadata as unknown as CheckpointMetadata,
        validationResults: cp.validationResults as unknown as ValidationResult[],
      }));

    } catch (error) {
      this.logger.error(`Failed to list checkpoints: ${error.message}`, error.stack);
      throw new Error(`Failed to list checkpoints: ${error.message}`);
    }
  }

  async getActiveCheckpointForPhase(phase: MigrationPhase): Promise<CheckpointInfo | null> {
    try {
      const checkpoint = await this.prisma.migrationCheckpoint.findFirst({
        where: {
          phase: this.toPrismaPhase(phase),
          status: { in: [this.toPrismaStatus(CheckpointStatus.VALIDATED), this.toPrismaStatus(CheckpointStatus.ACTIVE)] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!checkpoint) {
        return null;
      }

      return {
        id: checkpoint.id,
        name: checkpoint.name,
        description: checkpoint.description,
        phase: checkpoint.phase as MigrationPhase,
        status: checkpoint.status as CheckpointStatus,
        createdAt: checkpoint.createdAt,
        databaseBackup: checkpoint.databaseBackup,
        storageBackup: checkpoint.storageBackup,
        configBackup: checkpoint.configBackup,
        metadata: checkpoint.metadata as unknown as CheckpointMetadata,
        validationResults: checkpoint.validationResults as unknown as ValidationResult[],
      };

    } catch (error) {
      this.logger.error(`Failed to get active checkpoint: ${error.message}`, error.stack);
      return null;
    }
  }

  private async collectCheckpointMetadata(phase: MigrationPhase): Promise<CheckpointMetadata> {
    const metadata: CheckpointMetadata = {
      version: '1.0.0',
      migrationStep: phase,
      dataIntegrity: {
        recordCounts: {},
        checksums: {},
      },
      userCounts: {
        totalUsers: 0,
        migratedUsers: 0,
      },
      fileCounts: {
        totalFiles: 0,
        migratedFiles: 0,
        totalSize: 0,
      },
    };

    try {
      // Collect table record counts
      const tables = await this.getPublicTables();
      for (const table of tables) {
        const count = await this.getTableRecordCount(table);
        metadata.dataIntegrity.recordCounts[table] = count;
      }

      // Collect user counts
      const userCount = await this.prisma.user.count();
      metadata.userCounts.totalUsers = userCount;
      metadata.userCounts.migratedUsers = await this.prisma.user.count({
        where: { migrationSource: 'supabase' },
      });

      // Collect file counts
      const fileStats = await this.getFileStatistics();
      metadata.fileCounts = fileStats;

      // Generate checksums for critical data
      metadata.dataIntegrity.checksums = await this.generateDataChecksums();

    } catch (error) {
      this.logger.warn(`Failed to collect some metadata: ${error.message}`);
    }

    return metadata;
  }

  private async validateCheckpointIntegrity(metadata: CheckpointMetadata): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate data integrity
    try {
      const currentCounts = await this.getCurrentRecordCounts();
      for (const [table, expectedCount] of Object.entries(metadata.dataIntegrity.recordCounts)) {
        const currentCount = currentCounts[table] || 0;
        if (currentCount !== expectedCount) {
          results.push({
            component: `table_${table}`,
            status: 'failed',
            message: `Record count mismatch for table ${table}`,
            details: { expected: expectedCount, actual: currentCount },
          });
        } else {
          results.push({
            component: `table_${table}`,
            status: 'passed',
            message: `Record count validated for table ${table}`,
          });
        }
      }
    } catch (error) {
      results.push({
        component: 'data_integrity',
        status: 'failed',
        message: `Data integrity validation failed: ${error.message}`,
      });
    }

    // Validate user migration status
    try {
      const currentUserCount = await this.prisma.user.count();
      if (currentUserCount !== metadata.userCounts.totalUsers) {
        results.push({
          component: 'user_migration',
          status: 'warning',
          message: 'User count has changed since checkpoint creation',
          details: { 
            expected: metadata.userCounts.totalUsers, 
            actual: currentUserCount 
          },
        });
      } else {
        results.push({
          component: 'user_migration',
          status: 'passed',
          message: 'User migration status validated',
        });
      }
    } catch (error) {
      results.push({
        component: 'user_migration',
        status: 'failed',
        message: `User validation failed: ${error.message}`,
      });
    }

    // Validate file migration status
    try {
      const currentFileStats = await this.getFileStatistics();
      if (currentFileStats.totalFiles !== metadata.fileCounts.totalFiles) {
        results.push({
          component: 'file_migration',
          status: 'warning',
          message: 'File count has changed since checkpoint creation',
          details: { 
            expected: metadata.fileCounts.totalFiles, 
            actual: currentFileStats.totalFiles 
          },
        });
      } else {
        results.push({
          component: 'file_migration',
          status: 'passed',
          message: 'File migration status validated',
        });
      }
    } catch (error) {
      results.push({
        component: 'file_migration',
        status: 'failed',
        message: `File validation failed: ${error.message}`,
      });
    }

    return results;
  }

  private async validateRollbackSuccess(checkpoint: CheckpointInfo): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate database connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      results.push({
        component: 'database',
        status: 'passed',
        message: 'Database connectivity restored',
      });
    } catch (error) {
      results.push({
        component: 'database',
        status: 'failed',
        message: `Database connectivity failed: ${error.message}`,
      });
    }

    // Validate data integrity against checkpoint
    try {
      const currentCounts = await this.getCurrentRecordCounts();
      let allTablesValid = true;
      
      for (const [table, expectedCount] of Object.entries(checkpoint.metadata.dataIntegrity.recordCounts)) {
        const currentCount = currentCounts[table] || 0;
        if (currentCount !== expectedCount) {
          allTablesValid = false;
          break;
        }
      }

      if (allTablesValid) {
        results.push({
          component: 'data_integrity',
          status: 'passed',
          message: 'Data integrity matches checkpoint state',
        });
      } else {
        results.push({
          component: 'data_integrity',
          status: 'failed',
          message: 'Data integrity does not match checkpoint state',
        });
      }
    } catch (error) {
      results.push({
        component: 'data_integrity',
        status: 'failed',
        message: `Data integrity validation failed: ${error.message}`,
      });
    }

    return results;
  }

  private generateCheckpointId(): string {
    return `cp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private async ensureCheckpointDirectory(): Promise<void> {
    try {
      await fs.access(this.checkpointDir);
    } catch {
      await fs.mkdir(this.checkpointDir, { recursive: true });
    }
  }

  private async saveCheckpointToDatabase(checkpoint: CheckpointInfo): Promise<void> {
    await this.prisma.migrationCheckpoint.create({
      data: {
        id: checkpoint.id,
        name: checkpoint.name,
        description: checkpoint.description,
        phase: this.toPrismaPhase(checkpoint.phase),
        status: this.toPrismaStatus(checkpoint.status),
        createdAt: checkpoint.createdAt,
        databaseBackup: checkpoint.databaseBackup,
        storageBackup: checkpoint.storageBackup,
        configBackup: checkpoint.configBackup,
        metadata: checkpoint.metadata as any,
        validationResults: checkpoint.validationResults as any,
      },
    });
  }

  private async saveCheckpointToFile(checkpoint: CheckpointInfo): Promise<void> {
    const filePath = path.join(this.checkpointDir, `${checkpoint.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2));
  }

  private async markPreviousCheckpointsSuperseded(phase: MigrationPhase): Promise<void> {
    await this.prisma.migrationCheckpoint.updateMany({
      where: {
        phase: this.toPrismaPhase(phase),
        status: { in: [this.toPrismaStatus(CheckpointStatus.VALIDATED), this.toPrismaStatus(CheckpointStatus.ACTIVE)] },
      },
      data: {
        status: this.toPrismaStatus(CheckpointStatus.SUPERSEDED),
      },
    });
  }

  private async updateCheckpointStatus(checkpointId: string, status: CheckpointStatus): Promise<void> {
    await this.prisma.migrationCheckpoint.update({
      where: { id: checkpointId },
      data: { status: this.toPrismaStatus(status) },
    });
  }

  private async getCheckpointById(checkpointId: string): Promise<CheckpointInfo | null> {
    const checkpoint = await this.prisma.migrationCheckpoint.findUnique({
      where: { id: checkpointId },
    });

    if (!checkpoint) {
      return null;
    }

    return {
      id: checkpoint.id,
      name: checkpoint.name,
      description: checkpoint.description,
      phase: checkpoint.phase as MigrationPhase,
      status: checkpoint.status as CheckpointStatus,
      createdAt: checkpoint.createdAt,
      databaseBackup: checkpoint.databaseBackup,
      storageBackup: checkpoint.storageBackup,
      configBackup: checkpoint.configBackup,
      metadata: checkpoint.metadata as unknown as CheckpointMetadata,
      validationResults: checkpoint.validationResults as unknown as ValidationResult[],
    };
  }

  private async getPublicTables(): Promise<string[]> {
    // This would typically query the database schema
    // For now, return the known tables from the migration
    return [
      'users', 'user_roles', 'affaires', 'audiences', 'dossiers_recouvrement',
      'actions_recouvrement', 'immeubles', 'locataires', 'files'
    ];
  }

  private async getTableRecordCount(tableName: string): Promise<number> {
    try {
      const result = await this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM ${tableName}`
      ) as any[];
      return parseInt(result[0].count);
    } catch (error) {
      this.logger.warn(`Failed to get count for table ${tableName}: ${error.message}`);
      return 0;
    }
  }

  private async getCurrentRecordCounts(): Promise<Record<string, number>> {
    const tables = await this.getPublicTables();
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      counts[table] = await this.getTableRecordCount(table);
    }
    
    return counts;
  }

  private async getFileStatistics(): Promise<{ totalFiles: number; migratedFiles: number; totalSize: number }> {
    try {
      const totalFiles = await this.prisma.file.count();
      const migratedFiles = await this.prisma.file.count({
        where: { migrationSource: 'supabase' },
      });
      
      const sizeResult = await this.prisma.file.aggregate({
        _sum: { size: true },
      });
      
      return {
        totalFiles,
        migratedFiles,
        totalSize: sizeResult._sum.size || 0,
      };
    } catch (error) {
      this.logger.warn(`Failed to get file statistics: ${error.message}`);
      return { totalFiles: 0, migratedFiles: 0, totalSize: 0 };
    }
  }

  private async generateDataChecksums(): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {};
    
    try {
      // Generate checksums for critical tables
      const criticalTables = ['users', 'affaires', 'files'];
      
      for (const table of criticalTables) {
        const data = await this.prisma.$queryRawUnsafe(
          `SELECT * FROM ${table} ORDER BY id`
        );
        
        const dataString = JSON.stringify(data);
        const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
        checksums[table] = checksum;
      }
    } catch (error) {
      this.logger.warn(`Failed to generate checksums: ${error.message}`);
    }
    
    return checksums;
  }
}