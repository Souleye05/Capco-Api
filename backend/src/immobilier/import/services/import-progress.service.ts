import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ImportProgressDto } from '../dto';

@Injectable()
export class ImportProgressService extends EventEmitter {
  private readonly logger = new Logger(ImportProgressService.name);
  private activeImports = new Map<string, ImportProgressDto>();

  /**
   * Créer un nouvel import avec suivi de progression
   */
  createImportProgress(totalRows: number): ImportProgressDto {
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
  updateImportProgress(
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
  cleanupImport(importId: string): void {
    this.activeImports.delete(importId);
  }

  /**
   * Obtenir tous les imports actifs
   */
  getActiveImports(): ImportProgressDto[] {
    return Array.from(this.activeImports.values());
  }
}