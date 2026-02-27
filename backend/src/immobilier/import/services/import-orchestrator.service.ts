import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ImportConfig } from '../config/import.config';
import { ImportProgressService } from './import-progress.service';
import { BatchProcessorService } from './batch-processor.service';
import { EntityValidatorsService } from '../validators/entity-validators.service';
import { ExcelParserService } from './excel-parser.service';
import { ImportResultDto, EntityType, ImportErrorDto } from '../dto';
import { AuditService } from '../../../audit/audit.service';
import { $Enums } from '@prisma/client';

@Injectable()
export class ImportOrchestratorService {
  private readonly logger = new Logger(ImportOrchestratorService.name);

  constructor(
    private readonly config: ImportConfig,
    private readonly progressService: ImportProgressService,
    private readonly batchProcessor: BatchProcessorService,
    private readonly validators: EntityValidatorsService,
    private readonly excelParser: ExcelParserService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Orchestrer un import simple (un seul type d'entité)
   */
  async orchestrateSimpleImport(
    file: Express.Multer.File,
    entityType: EntityType,
    userId?: string
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    this.logger.log(`Début de l'import ${entityType} - Fichier: ${file.originalname}`);
    
    try {
      // 1. Parser le fichier
      const data = await this.excelParser.parseExcelFile(file);
      
      // 2. Créer le suivi de progression
      const progress = this.progressService.createImportProgress(data.length);
      
      // 3. Valider les données
      const validationResult = await this.validateImportData(data, entityType);
      
      // 4. Vérifier les erreurs critiques
      const criticalErrors = validationResult.errors.filter(e => e.severity === 'ERROR');
      if (criticalErrors.length > 0) {
        this.progressService.updateImportProgress(progress.importId, { 
          status: 'FAILED',
          errors: validationResult.errors 
        });
        return this.createImportResult(startTime, data.length, 0, validationResult.errors, progress.importId, file, userId);
      }

      // 5. Traiter par batch avec timeout
      const result = await this.processWithTimeout(progress.importId, async () => {
        return this.processBatches(data, entityType, progress.importId, userId);
      });

      // 6. Audit
      if (userId) {
        await this.auditService.log({
          action: 'IMPORT',
          entityType: entityType,
          entityId: progress.importId,
          entityReference: `Import Excel: ${file.originalname} - ${result.successfulRows}/${data.length} ${entityType} créés`,
          userId,
          userEmail: 'user@capco.com',
          module: 'immobilier'
        });
      }
      
      return result;
      
    } catch (error) {
      this.logger.error(`Erreur lors de l'import ${entityType}:`, error);
      throw new BadRequestException(`Erreur lors de l'import: ${error.message}`);
    }
  }

  /**
   * Orchestrer un import complet (multi-entités)
   */
  async orchestrateCompleteImport(
    file: Express.Multer.File,
    userId?: string
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    this.logger.log(`Début de l'import complet - Fichier: ${file.originalname}`);

    try {
      // 1. Parser le fichier multi-feuilles
      const sheetsData = this.excelParser.parseMultiSheetExcel(file);
      
      const totalRows = Object.values(sheetsData).reduce((sum, data) => sum + data.length, 0);
      if (totalRows === 0) {
        throw new Error('Aucune donnée valide trouvée dans le fichier.');
      }

      // 2. Créer le suivi de progression
      const progress = this.progressService.createImportProgress(totalRows);
      
      // 3. Traiter avec timeout
      const result = await this.processWithTimeout(progress.importId, async () => {
        return this.processCompleteImport(sheetsData, progress.importId, userId);
      });

      return result;

    } catch (error) {
      this.logger.error('Erreur import complet:', error);
      throw new BadRequestException(`Erreur: ${error.message}`);
    }
  }

  private async validateImportData(data: any[], entityType: EntityType) {
    const errors: ImportErrorDto[] = [];
    let validRows = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = row._rowNumber || i + 2;

      const rowErrors = await this.validators.validateRow(row, entityType, rowNumber);
      errors.push(...rowErrors);
      
      const hasErrors = rowErrors.some(e => e.severity === 'ERROR');
      if (!hasErrors) {
        validRows++;
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'ERROR').length === 0,
      totalRows: data.length,
      validRows,
      invalidRows: data.length - validRows,
      errors
    };
  }

  private async processBatches(
    data: any[],
    entityType: EntityType,
    importId: string,
    userId?: string
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const errors: ImportErrorDto[] = [];
    let successfulRows = 0;

    const context = {
      userId: userId || 'import-system',
      importId,
      entityType
    };

    const batchSize = this.config.batchSize;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      let batchResult;
      switch (entityType) {
        case EntityType.PROPRIETAIRES:
          batchResult = await this.batchProcessor.processProprietairesBatch(batch, context);
          break;
        case EntityType.IMMEUBLES:
          batchResult = await this.batchProcessor.processImmeublesBatch(batch, context);
          break;
        case EntityType.LOCATAIRES:
          batchResult = await this.batchProcessor.processLocatairesBatch(batch, context);
          break;
        case EntityType.LOTS:
          batchResult = await this.batchProcessor.processLotsBatch(batch, context);
          break;
        default:
          throw new Error(`Type d'entité non supporté: ${entityType}`);
      }
      
      successfulRows += batchResult.successfulRows;
      errors.push(...batchResult.errors);
      
      this.progressService.updateImportProgress(importId, { 
        processedRows: i + batch.length,
        successfulRows,
        failedRows: errors.length
      });
    }

    return this.createImportResult(startTime, data.length, successfulRows, errors, importId);
  }

  private async processCompleteImport(
    sheetsData: any,
    importId: string,
    userId?: string
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const allErrors: ImportErrorDto[] = [];
    let totalSuccessful = 0;
    let processedRows = 0;

    const context = { userId: userId || 'import-system', importId, entityType: EntityType.PROPRIETAIRES };

    // Traiter dans l'ordre : Propriétaires -> Immeubles -> Locataires -> Lots
    const processingOrder = [
      { data: sheetsData.proprietaires, type: EntityType.PROPRIETAIRES, processor: 'processProprietairesBatch' },
      { data: sheetsData.immeubles, type: EntityType.IMMEUBLES, processor: 'processImmeublesBatch' },
      { data: sheetsData.locataires, type: EntityType.LOCATAIRES, processor: 'processLocatairesBatch' },
      { data: sheetsData.lots, type: EntityType.LOTS, processor: 'processLotsBatch' }
    ];

    for (const { data, type, processor } of processingOrder) {
      if (data.length === 0) continue;

      context.entityType = type;
      const batchSize = this.config.batchSize;
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const batchResult = await (this.batchProcessor as any)[processor](batch, context);
        
        totalSuccessful += batchResult.successfulRows;
        allErrors.push(...batchResult.errors);
        processedRows += batch.length;
        
        this.progressService.updateImportProgress(importId, { 
          processedRows,
          successfulRows: totalSuccessful,
          failedRows: allErrors.length
        });
      }
    }

    const totalRows = Object.values(sheetsData).reduce((sum: number, data: any[]) => sum + data.length, 0) as number;
    return this.createImportResult(startTime, totalRows, totalSuccessful, allErrors, importId);
  }

  private async processWithTimeout<T>(
    importId: string,
    processor: () => Promise<T>
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        this.progressService.updateImportProgress(importId, { status: 'TIMEOUT' });
        reject(new Error('Import timeout - traitement trop long'));
      }, this.config.timeoutMs);
    });

    try {
      this.progressService.updateImportProgress(importId, { status: 'PROCESSING' });
      const result = await Promise.race([processor(), timeoutPromise]);
      this.progressService.updateImportProgress(importId, { status: 'COMPLETED' });
      return result;
    } catch (error) {
      this.progressService.updateImportProgress(importId, { status: 'FAILED' });
      throw error;
    } finally {
      setTimeout(() => this.progressService.cleanupImport(importId), 60000);
    }
  }

  private createImportResult(
    startTime: number,
    totalRows: number,
    successfulRows: number,
    errors: ImportErrorDto[],
    importId?: string,
    file?: Express.Multer.File,
    userId?: string
  ): ImportResultDto {
    const processingTimeMs = Date.now() - startTime;
    const failedRows = totalRows - successfulRows;
    
    const errorStatistics = {
      criticalErrors: errors.filter(e => e.severity === 'ERROR').length,
      warnings: errors.filter(e => e.severity === 'WARNING').length,
      duplicates: errors.filter(e => e.error.includes('déjà existant')).length,
      validationErrors: errors.filter(e => e.error.includes('validation') || e.error.includes('obligatoire')).length
    };

    const performanceMetrics = {
      avgProcessingTimePerRow: totalRows > 0 ? processingTimeMs / totalRows : 0,
      transactionCount: 1
    };

    const auditInfo = file && userId ? {
      userId,
      timestamp: new Date(),
      fileName: file.originalname,
      fileSize: file.size
    } : undefined;

    return {
      success: errorStatistics.criticalErrors === 0,
      totalRows,
      successfulRows,
      failedRows,
      errors,
      summary: this.generateSummary(totalRows, successfulRows, errorStatistics, processingTimeMs),
      processingTimeMs,
      importId,
      errorStatistics,
      auditInfo,
      performanceMetrics
    };
  }

  private generateSummary(
    totalRows: number,
    successfulRows: number,
    errorStats: any,
    processingTimeMs: number
  ): string {
    const successRate = totalRows > 0 ? ((successfulRows / totalRows) * 100).toFixed(1) : '0';
    const avgTimePerRow = totalRows > 0 ? (processingTimeMs / totalRows).toFixed(2) : '0';
    
    let summary = `Import terminé: ${successfulRows}/${totalRows} lignes traitées avec succès (${successRate}%)`;
    summary += ` en ${processingTimeMs}ms (${avgTimePerRow}ms/ligne)`;
    
    if (errorStats.criticalErrors > 0) {
      summary += `. ${errorStats.criticalErrors} erreur(s) critique(s)`;
    }
    
    if (errorStats.warnings > 0) {
      summary += `. ${errorStats.warnings} avertissement(s)`;
    }
    
    if (errorStats.duplicates > 0) {
      summary += `. ${errorStats.duplicates} doublon(s) détecté(s)`;
    }

    return summary;
  }
}