import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImportExcelService } from './import-excel.service';
import { ImportExcelController } from './import-excel.controller';
import { ImportConfig } from './config/import.config';
import { EntityCacheService } from './services/entity-cache.service';
import { ErrorClassifierService } from './services/error-classifier.service';
import { BatchProcessorService } from './services/batch-processor.service';
import { EntityValidatorsService } from './validators/entity-validators.service';
import { ExcelParserService } from './services/excel-parser.service';
import { ImportProgressService } from './services/import-progress.service';
import { TemplateGeneratorService } from './services/template-generator.service';
import { ImportOrchestratorService } from './services/import-orchestrator.service';
import { CommonModule } from '../../common/common.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    AuditModule
  ],
  controllers: [ImportExcelController],
  providers: [
    ImportExcelService,
    ImportConfig,
    EntityCacheService,
    ErrorClassifierService,
    BatchProcessorService,
    EntityValidatorsService,
    ExcelParserService,
    ImportProgressService,
    TemplateGeneratorService,
    ImportOrchestratorService
  ],
  exports: [ImportExcelService]
})
export class ImportExcelModule {}