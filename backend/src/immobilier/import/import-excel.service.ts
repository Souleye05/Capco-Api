import { Injectable, Logger } from '@nestjs/common';
import { 
  ImportResultDto, 
  ValidationResultDto, 
  EntityType,
  ImportProgressDto
} from './dto';
import { ExcelParserService } from './services/excel-parser.service';
import { ImportProgressService } from './services/import-progress.service';
import { TemplateGeneratorService } from './services/template-generator.service';
import { ImportOrchestratorService } from './services/import-orchestrator.service';
import { EntityValidatorsService } from './validators/entity-validators.service';

@Injectable()
export class ImportExcelService {
  private readonly logger = new Logger(ImportExcelService.name);

  constructor(
    private readonly excelParser: ExcelParserService,
    private readonly progressService: ImportProgressService,
    private readonly templateGenerator: TemplateGeneratorService,
    private readonly orchestrator: ImportOrchestratorService,
    private readonly validators: EntityValidatorsService
  ) {}

  /**
   * Parse un fichier Excel
   */
  async parseExcelFile(file: Express.Multer.File): Promise<any[]> {
    return this.excelParser.parseExcelFile(file);
  }

  /**
   * Valider les données d'import
   */
  async validateImportData(data: any[], entityType: EntityType): Promise<ValidationResultDto> {
    const errors = [];
    let validRows = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = row._rowNumber || i + 2;
      const rowErrors = await this.validators.validateRow(row, entityType, rowNumber);
      errors.push(...rowErrors);
      
      const hasErrors = rowErrors.some(e => e.severity === 'ERROR');
      if (!hasErrors) validRows++;
    }

    return {
      isValid: errors.filter(e => e.severity === 'ERROR').length === 0,
      totalRows: data.length,
      validRows,
      invalidRows: data.length - validRows,
      errors
    };
  }

  /**
   * Importer des propriétaires
   */
  async importProprietaires(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    return this.orchestrator.orchestrateSimpleImport(file, EntityType.PROPRIETAIRES, userId);
  }

  /**
   * Importer des immeubles
   */
  async importImmeubles(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    return this.orchestrator.orchestrateSimpleImport(file, EntityType.IMMEUBLES, userId);
  }

  /**
   * Importer des locataires
   */
  async importLocataires(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    return this.orchestrator.orchestrateSimpleImport(file, EntityType.LOCATAIRES, userId);
  }

  /**
   * Importer des lots
   */
  async importLots(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    return this.orchestrator.orchestrateSimpleImport(file, EntityType.LOTS, userId);
  }

  /**
   * Import complet multi-entités
   */
  async importAll(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    return this.orchestrator.orchestrateCompleteImport(file, userId);
  }

  /**
   * Obtenir la progression d'un import
   */
  getImportProgress(importId: string): ImportProgressDto | null {
    return this.progressService.getImportProgress(importId);
  }

  /**
   * Générer un template Excel
   */
  async generateTemplate(entityType: EntityType): Promise<Buffer> {
    return this.templateGenerator.generateTemplate(entityType);
  }

  /**
   * Générer un template multi-feuilles
   */
  async generateMultiSheetTemplate(): Promise<Buffer> {
    return this.templateGenerator.generateMultiSheetTemplate();
  }
}