import { Injectable } from '@nestjs/common';
import { ImportErrorDto } from '../dto';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  DUPLICATE = 'DUPLICATE',
  CONSTRAINT = 'CONSTRAINT',
  REFERENCE = 'REFERENCE',
  SYSTEM = 'SYSTEM',
  TIMEOUT = 'TIMEOUT'
}

@Injectable()
export class ErrorClassifierService {
  
  classifyError(error: any, row: number, field?: string, value?: any): ImportErrorDto {
    const errorType = this.determineErrorType(error);
    const severity = this.determineSeverity(errorType);
    const message = this.formatErrorMessage(error, errorType);

    return {
      row,
      field: field || 'general',
      value,
      error: message,
      severity,
      errorType,
      code: error.code || 'UNKNOWN'
    };
  }

  private determineErrorType(error: any): ErrorType {
    // Erreurs Prisma
    if (error.code) {
      switch (error.code) {
        case 'P2002': // Contrainte unique
          return ErrorType.DUPLICATE;
        case 'P2003': // Contrainte de clé étrangère
          return ErrorType.REFERENCE;
        case 'P2025': // Enregistrement non trouvé
          return ErrorType.REFERENCE;
        default:
          return ErrorType.CONSTRAINT;
      }
    }

    // Erreurs de validation
    if (error.message?.includes('validation') || 
        error.message?.includes('obligatoire') ||
        error.message?.includes('format') ||
        error.message?.includes('invalide')) {
      return ErrorType.VALIDATION;
    }

    // Erreurs de timeout
    if (error.message?.includes('timeout') || 
        error.message?.includes('trop long')) {
      return ErrorType.TIMEOUT;
    }

    // Erreurs de doublon
    if (error.message?.includes('déjà existant') ||
        error.message?.includes('duplicate') ||
        error.message?.includes('doublon')) {
      return ErrorType.DUPLICATE;
    }

    return ErrorType.SYSTEM;
  }

  private determineSeverity(errorType: ErrorType): 'ERROR' | 'WARNING' {
    switch (errorType) {
      case ErrorType.DUPLICATE:
        return 'WARNING';
      case ErrorType.VALIDATION:
      case ErrorType.CONSTRAINT:
      case ErrorType.REFERENCE:
      case ErrorType.SYSTEM:
      case ErrorType.TIMEOUT:
        return 'ERROR';
      default:
        return 'ERROR';
    }
  }

  private formatErrorMessage(error: any, errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.DUPLICATE:
        return this.extractDuplicateField(error) || 'Enregistrement déjà existant';
      case ErrorType.VALIDATION:
        return error.message || 'Erreur de validation des données';
      case ErrorType.CONSTRAINT:
        return 'Violation de contrainte de base de données';
      case ErrorType.REFERENCE:
        return 'Référence vers un enregistrement inexistant';
      case ErrorType.TIMEOUT:
        return 'Timeout lors du traitement';
      case ErrorType.SYSTEM:
      default:
        return error.message || 'Erreur système inconnue';
    }
  }

  private extractDuplicateField(error: any): string | null {
    if (error.meta?.target) {
      const fields = Array.isArray(error.meta.target) ? error.meta.target : [error.meta.target];
      return `Doublon détecté sur: ${fields.join(', ')}`;
    }
    return null;
  }

  getErrorStatistics(errors: ImportErrorDto[]) {
    const stats = {
      total: errors.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {
        ERROR: 0,
        WARNING: 0
      },
      byField: {} as Record<string, number>
    };

    // Initialiser les compteurs par type
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });

    errors.forEach(error => {
      // Compter par type
      if (error.errorType) {
        stats.byType[error.errorType as ErrorType]++;
      }

      // Compter par sévérité
      stats.bySeverity[error.severity]++;

      // Compter par champ
      stats.byField[error.field] = (stats.byField[error.field] || 0) + 1;
    });

    return stats;
  }
}