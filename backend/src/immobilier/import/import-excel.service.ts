import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { AuditService } from '../../audit/audit.service';
import * as XLSX from 'xlsx';
import { 
  ImportResultDto, 
  ValidationResultDto, 
  ImportErrorDto, 
  EntityType,
  ImportProgressDto
} from './dto';
import { FileValidationUtil } from './utils/file-validation.util';
import { EventEmitter } from 'events';

@Injectable()
export class ImportExcelService extends EventEmitter {
  private readonly logger = new Logger(ImportExcelService.name);
  private readonly IMPORT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly PROGRESS_UPDATE_INTERVAL = 100; // Update progress every 100 rows
  private activeImports = new Map<string, ImportProgressDto>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceGenerator: ReferenceGeneratorService,
    private readonly auditService: AuditService
  ) {
    super();
  }

  /**
   * Créer un nouvel import avec suivi de progression
   */
  private createImportProgress(totalRows: number): ImportProgressDto {
    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const progress: ImportProgressDto = {
      importId,
      totalRows,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      progressPercentage: 0,
      status: 'PENDING',
      errors: [],
      startTime: new Date(),
      lastUpdate: new Date()
    };
    
    this.activeImports.set(importId, progress);
    return progress;
  }
  /**
   * Mettre à jour la progression d'un import
   */
  private updateImportProgress(
    importId: string, 
    updates: Partial<ImportProgressDto>
  ): ImportProgressDto {
    const progress = this.activeImports.get(importId);
    if (!progress) {
      throw new Error(`Import ${importId} non trouvé`);
    }

    Object.assign(progress, updates, { lastUpdate: new Date() });
    
    // Calculer le pourcentage de progression
    if (progress.totalRows > 0) {
      progress.progressPercentage = Math.round((progress.processedRows / progress.totalRows) * 100);
    }

    // Estimer le temps restant
    if (progress.processedRows > 0 && progress.status === 'PROCESSING') {
      const elapsedTime = Date.now() - progress.startTime.getTime();
      const avgTimePerRow = elapsedTime / progress.processedRows;
      const remainingRows = progress.totalRows - progress.processedRows;
      progress.estimatedTimeRemainingMs = Math.round(remainingRows * avgTimePerRow);
    }

    this.activeImports.set(importId, progress);
    
    // Émettre un événement de progression
    this.emit('progress', progress);
    
    return progress;
  }

  /**
   * Obtenir la progression d'un import
   */
  getImportProgress(importId: string): ImportProgressDto | null {
    return this.activeImports.get(importId) || null;
  }

  /**
   * Nettoyer un import terminé
   */
  private cleanupImport(importId: string): void {
    this.activeImports.delete(importId);
  }

  /**
   * Traiter un import avec timeout et suivi de progression
   */
  private async processWithTimeout<T>(
    importId: string,
    processor: () => Promise<T>
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        this.updateImportProgress(importId, { status: 'TIMEOUT' });
        reject(new Error('Import timeout - traitement trop long'));
      }, this.IMPORT_TIMEOUT_MS);
    });

    try {
      this.updateImportProgress(importId, { status: 'PROCESSING' });
      const result = await Promise.race([processor(), timeoutPromise]);
      this.updateImportProgress(importId, { status: 'COMPLETED' });
      return result;
    } catch (error) {
      this.updateImportProgress(importId, { status: 'FAILED' });
      throw error;
    } finally {
      // Nettoyer après un délai pour permettre la consultation du statut final
      setTimeout(() => this.cleanupImport(importId), 60000); // 1 minute
    }
  }
  /**
   * Lit et parse un fichier Excel
   */
  async parseExcelFile(file: Express.Multer.File): Promise<any[]> {
    try {
      // Valider le fichier
      FileValidationUtil.validateExcelFile(file);

      // Lire le fichier Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      
      // Prendre la première feuille
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('Le fichier Excel ne contient aucune feuille');
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON avec les en-têtes de la première ligne
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false
      });

      if (data.length === 0) {
        throw new BadRequestException('Le fichier Excel est vide');
      }

      // Extraire les en-têtes (première ligne)
      const headers = data[0] as string[];
      if (!headers || headers.length === 0) {
        throw new BadRequestException('Aucun en-tête trouvé dans le fichier Excel');
      }

      // Convertir les données en objets avec les en-têtes comme clés
      const rows = data.slice(1).map((row: any[], index) => {
        const obj: any = { _rowNumber: index + 2 }; // +2 car ligne 1 = headers, index 0 = ligne 2
        headers.forEach((header, colIndex) => {
          if (header) {
            obj[header.toLowerCase().trim()] = row[colIndex] || null;
          }
        });
        return obj;
      });

      // Filtrer les lignes vides
      const filteredRows = rows.filter(row => {
        const values = Object.values(row).filter(v => v !== null && v !== undefined && v !== '');
        return values.length > 1; // Au moins une valeur en plus de _rowNumber
      });

      this.logger.log(`Fichier Excel parsé: ${filteredRows.length} lignes de données trouvées`);
      return filteredRows;

    } catch (error) {
      this.logger.error('Erreur lors du parsing du fichier Excel:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la lecture du fichier Excel: ${error.message}`);
    }
  }
  /**
   * Valider les données d'import
   */
  async validateImportData(data: any[], entityType: EntityType): Promise<ValidationResultDto> {
    const errors: ImportErrorDto[] = [];
    let validRows = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = row._rowNumber || i + 2;

      try {
        switch (entityType) {
          case EntityType.PROPRIETAIRES:
            await this.validateProprietaireRow(row, rowNumber);
            break;
          // Add other entity types as needed
        }
        validRows++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: error.field || 'general',
          value: error.value,
          error: error.message,
          severity: error.severity || 'ERROR'
        });
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

  /**
   * Valider une ligne de propriétaire
   */
  private async validateProprietaireRow(row: any, rowNumber: number): Promise<void> {
    const errors: ImportErrorDto[] = [];

    // Nom obligatoire
    if (!row.nom || typeof row.nom !== 'string' || row.nom.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'nom',
        value: row.nom,
        error: 'Le nom est obligatoire',
        severity: 'ERROR'
      });
    }

    // Validation email si fourni
    if (row.email && typeof row.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email.trim())) {
        errors.push({
          row: rowNumber,
          field: 'email',
          value: row.email,
          error: 'Format d\'email invalide',
          severity: 'WARNING'
        });
      }
    }

    if (errors.length > 0) {
      const error = new Error('Erreurs de validation');
      (error as any).field = errors[0].field;
      (error as any).value = errors[0].value;
      (error as any).severity = errors[0].severity;
      throw error;
    }
  }
  /**
   * Créer un résultat d'import avec rapports détaillés
   */
  protected createImportResult(
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
    
    // Calculer les statistiques d'erreurs
    const errorStatistics = {
      criticalErrors: errors.filter(e => e.severity === 'ERROR').length,
      warnings: errors.filter(e => e.severity === 'WARNING').length,
      duplicates: errors.filter(e => e.error.includes('déjà existant')).length,
      validationErrors: errors.filter(e => e.error.includes('validation') || e.error.includes('obligatoire')).length
    };

    // Calculer les métriques de performance
    const performanceMetrics = {
      avgProcessingTimePerRow: totalRows > 0 ? processingTimeMs / totalRows : 0,
      transactionCount: 1 // Une transaction principale pour l'import
    };

    // Informations d'audit si disponibles
    const auditInfo = file && userId ? {
      userId,
      timestamp: new Date(),
      fileName: file.originalname,
      fileSize: file.size
    } : undefined;

    const result: ImportResultDto = {
      success: errorStatistics.criticalErrors === 0,
      totalRows,
      successfulRows,
      failedRows,
      errors,
      summary: this.generateDetailedSummary(totalRows, successfulRows, errorStatistics, processingTimeMs),
      processingTimeMs,
      importId,
      errorStatistics,
      auditInfo,
      performanceMetrics
    };

    // Log détaillé pour audit
    this.logger.log(`Import terminé - ID: ${importId}, Succès: ${successfulRows}/${totalRows}, ` +
      `Erreurs critiques: ${errorStatistics.criticalErrors}, Warnings: ${errorStatistics.warnings}, ` +
      `Temps: ${processingTimeMs}ms`);

    return result;
  }

  /**
   * Générer un résumé détaillé de l'import
   */
  private generateDetailedSummary(
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

  /**
   * Importer des propriétaires avec suivi de progression
   */
  async importProprietaires(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    const startTime = Date.now();
    this.logger.log(`Début de l'import des propriétaires - Fichier: ${file.originalname}`);
    
    try {
      const data = await this.parseExcelFile(file);
      const errors: ImportErrorDto[] = [];
      let successfulRows = 0;

      // Créer le suivi de progression
      const progress = this.createImportProgress(data.length);
      this.logger.log(`Import ${progress.importId} créé pour ${data.length} lignes`);

      // Valider d'abord toutes les données
      const validationResult = await this.validateImportData(data, EntityType.PROPRIETAIRES);
      
      // Si des erreurs critiques, arrêter l'import
      const criticalErrors = validationResult.errors.filter(e => e.severity === 'ERROR');
      if (criticalErrors.length > 0) {
        this.logger.warn(`Import des propriétaires arrêté - ${criticalErrors.length} erreurs critiques détectées`);
        this.updateImportProgress(progress.importId, { 
          status: 'FAILED',
          errors: validationResult.errors 
        });
        return this.createImportResult(startTime, data.length, 0, validationResult.errors, progress.importId, file, userId);
      }

      // Traiter les lignes valides avec timeout et progression
      const result = await this.processWithTimeout(progress.importId, async () => {
        await this.prisma.$transaction(async (tx) => {
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            try {
              // Vérifier les doublons avant création
              const existingProprietaire = await tx.proprietaires.findFirst({
                where: {
                  AND: [
                    { nom: row.nom.trim() },
                    { telephone: row.telephone?.trim() || null }
                  ]
                }
              });

              if (existingProprietaire) {
                errors.push({
                  row: row._rowNumber,
                  field: 'nom',
                  value: `${row.nom} / ${row.telephone || 'N/A'}`,
                  error: 'Propriétaire déjà existant (nom + téléphone identiques)',
                  severity: 'WARNING'
                });
                this.updateImportProgress(progress.importId, { 
                  processedRows: i + 1,
                  failedRows: this.activeImports.get(progress.importId)!.failedRows + 1
                });
                continue;
              }

              const proprietaire = await tx.proprietaires.create({
                data: {
                  nom: row.nom.trim(),
                  telephone: row.telephone?.trim() || null,
                  email: row.email?.trim() || null,
                  adresse: row.adresse?.trim() || null,
                  createdBy: userId || 'import-system'
                }
              });

              // Créer un log d'audit pour chaque propriétaire créé
              await this.auditService.log({
                action: 'CREATE',
                entityType: 'Proprietaire',
                entityId: proprietaire.id,
                entityReference: `Propriétaire importé: ${proprietaire.nom} (Import ${progress.importId}, ligne ${row._rowNumber})`,
                userId: userId || 'import-system',
                userEmail: 'import-system@capco.com',
                module: 'immobilier'
              });

              successfulRows++;
              
              // Mettre à jour la progression
              this.updateImportProgress(progress.importId, { 
                processedRows: i + 1,
                successfulRows
              });

            } catch (error) {
              this.logger.error(`Erreur lors de la création du propriétaire ligne ${row._rowNumber}:`, error);
              errors.push({
                row: row._rowNumber,
                field: 'general',
                value: null,
                error: `Erreur lors de la création: ${error.message}`,
                severity: 'ERROR'
              });
              
              this.updateImportProgress(progress.importId, { 
                processedRows: i + 1,
                failedRows: this.activeImports.get(progress.importId)!.failedRows + 1
              });
            }
          }
        });

        return this.createImportResult(startTime, data.length, successfulRows, [...validationResult.errors, ...errors], progress.importId, file, userId);
      });

      this.logger.log(`Import des propriétaires terminé - ${successfulRows}/${data.length} lignes traitées avec succès`);
      
      // Créer un log d'audit global pour l'import
      if (userId) {
        await this.auditService.log({
          action: 'IMPORT',
          entityType: 'Proprietaire',
          entityId: progress.importId,
          entityReference: `Import Excel: ${file.originalname} - ${successfulRows}/${data.length} propriétaires créés`,
          userId,
          userEmail: 'user@capco.com', // TODO: Get actual user email
          module: 'immobilier'
        });
      }
      
      return result;
      
    } catch (error) {
      this.logger.error('Erreur lors de l\'import des propriétaires:', error);
      throw new BadRequestException(`Erreur lors de l'import: ${error.message}`);
    }
  }
  /**
   * Importer des immeubles (placeholder - à implémenter)
   */
  async importImmeubles(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    throw new BadRequestException('Import des immeubles non encore implémenté');
  }

  /**
   * Importer des locataires (placeholder - à implémenter)
   */
  async importLocataires(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    throw new BadRequestException('Import des locataires non encore implémenté');
  }

  /**
   * Importer des lots (placeholder - à implémenter)
   */
  async importLots(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    throw new BadRequestException('Import des lots non encore implémenté');
  }

  /**
   * Générer un template Excel
   */
  async generateTemplate(entityType: EntityType): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();
    
    let headers: string[] = [];
    let exampleData: any[] = [];

    switch (entityType) {
      case EntityType.PROPRIETAIRES:
        headers = ['nom', 'telephone', 'email', 'adresse'];
        exampleData = [
          ['Dupont Jean', '0123456789', 'jean.dupont@email.com', '123 Rue de la Paix, 75001 Paris'],
          ['Martin Marie', '0987654321', 'marie.martin@email.com', '456 Avenue des Champs, 69001 Lyon']
        ];
        break;
      case EntityType.IMMEUBLES:
        headers = ['nom', 'adresse', 'proprietaire_nom', 'taux_commission'];
        exampleData = [
          ['Résidence Les Jardins', '789 Boulevard Haussmann, 75008 Paris', 'Dupont Jean', '5'],
          ['Immeuble Central', '321 Place Bellecour, 69002 Lyon', 'Martin Marie', '4.5']
        ];
        break;
      case EntityType.LOCATAIRES:
        headers = ['nom', 'prenom', 'telephone', 'email', 'date_naissance'];
        exampleData = [
          ['Durand', 'Pierre', '0111111111', 'pierre.durand@email.com', '1985-03-15'],
          ['Moreau', 'Sophie', '0222222222', 'sophie.moreau@email.com', '1990-07-22']
        ];
        break;
      case EntityType.LOTS:
        headers = ['numero', 'immeuble_nom', 'type', 'loyer_mensuel_attendu', 'statut'];
        exampleData = [
          ['A101', 'Résidence Les Jardins', 'APPARTEMENT', '1200', 'LIBRE'],
          ['B205', 'Immeuble Central', 'STUDIO', '800', 'OCCUPE']
        ];
        break;
    }

    // Créer la feuille principale avec les données
    const worksheetData = [headers, ...exampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');

    // Générer le buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    this.logger.log(`Template Excel généré pour ${entityType}`);
    return buffer;
  }
}