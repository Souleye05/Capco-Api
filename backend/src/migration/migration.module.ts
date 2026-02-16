import { Module } from '@nestjs/common';
import { BackupService } from './services/backup.service';
import { RollbackService } from './services/rollback.service';
import { CheckpointService } from './services/checkpoint.service';
import { MigrationLoggerService } from './services/migration-logger.service';
import { MigrationMonitorService } from './services/migration-monitor.service';
import { MigrationAlertService } from './services/migration-alert.service';
import { SchemaExtractorService } from './services/schema-extractor.service';
import { PrismaSchemaGeneratorService } from './services/prisma-schema-generator.service';
import { DataMigratorService } from './services/data-migrator.service';
import { MigrationValidatorService } from './services/migration-validator.service';
import { CheckpointValidatorService } from './services/checkpoint-validator.service';
import { CheckpointPhase2ValidatorService } from './services/checkpoint-phase2-validator.service';
import { CheckpointUserInteractionService } from './services/checkpoint-user-interaction.service';
import { UserMigratorService } from './services/user-migrator.service';
import { MigrationController } from './controllers/migration.controller';
import { MonitoringController } from './controllers/monitoring.controller';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [
    MigrationController,
    MonitoringController
  ],
  providers: [
    BackupService,
    RollbackService,
    CheckpointService,
    MigrationLoggerService,
    MigrationMonitorService,
    MigrationAlertService,
    SchemaExtractorService,
    PrismaSchemaGeneratorService,
    DataMigratorService,
    MigrationValidatorService,
    CheckpointValidatorService,
    CheckpointPhase2ValidatorService,
    CheckpointUserInteractionService,
    UserMigratorService,
    PrismaService,
  ],
  exports: [
    BackupService, 
    RollbackService, 
    CheckpointService,
    MigrationLoggerService,
    MigrationMonitorService,
    MigrationAlertService,
    SchemaExtractorService,
    PrismaSchemaGeneratorService,
    DataMigratorService,
    MigrationValidatorService,
    CheckpointValidatorService,
    UserMigratorService
  ],
})
export class MigrationModule {}