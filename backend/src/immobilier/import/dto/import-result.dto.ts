import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportErrorDto {
  @ApiProperty({ description: 'Numéro de ligne dans le fichier Excel' })
  row: number;

  @ApiProperty({ description: 'Nom du champ concerné' })
  field: string;

  @ApiProperty({ description: 'Valeur qui a causé l\'erreur' })
  value: any;

  @ApiProperty({ description: 'Message d\'erreur détaillé' })
  error: string;

  @ApiProperty({ 
    enum: ['ERROR', 'WARNING'], 
    description: 'Sévérité de l\'erreur' 
  })
  severity: 'ERROR' | 'WARNING';
}

export class ImportResultDto {
  @ApiProperty({ description: 'Indique si l\'import s\'est bien déroulé' })
  success: boolean;

  @ApiProperty({ description: 'Nombre total de lignes dans le fichier' })
  totalRows: number;

  @ApiProperty({ description: 'Nombre de lignes traitées avec succès' })
  successfulRows: number;

  @ApiProperty({ description: 'Nombre de lignes en erreur' })
  failedRows: number;

  @ApiProperty({ 
    type: [ImportErrorDto], 
    description: 'Liste des erreurs rencontrées' 
  })
  errors: ImportErrorDto[];

  @ApiProperty({ description: 'Résumé textuel de l\'import' })
  summary: string;

  @ApiProperty({ description: 'Temps de traitement en millisecondes' })
  processingTimeMs: number;

  @ApiPropertyOptional({ description: 'Identifiant de l\'import pour suivi' })
  importId?: string;

  @ApiPropertyOptional({ description: 'Statistiques détaillées par type d\'erreur' })
  errorStatistics?: {
    criticalErrors: number;
    warnings: number;
    duplicates: number;
    validationErrors: number;
  };

  @ApiPropertyOptional({ description: 'Informations d\'audit' })
  auditInfo?: {
    userId: string;
    timestamp: Date;
    fileName: string;
    fileSize: number;
  };

  @ApiPropertyOptional({ description: 'Métriques de performance' })
  performanceMetrics?: {
    avgProcessingTimePerRow: number;
    peakMemoryUsage?: number;
    transactionCount: number;
  };
}

export class ValidationResultDto {
  @ApiProperty({ description: 'Indique si les données sont valides' })
  isValid: boolean;

  @ApiProperty({ description: 'Nombre total de lignes' })
  totalRows: number;

  @ApiProperty({ description: 'Nombre de lignes valides' })
  validRows: number;

  @ApiProperty({ description: 'Nombre de lignes invalides' })
  invalidRows: number;

  @ApiProperty({ 
    type: [ImportErrorDto], 
    description: 'Liste des erreurs de validation' 
  })
  errors: ImportErrorDto[];
}

export enum EntityType {
  PROPRIETAIRES = 'proprietaires',
  IMMEUBLES = 'immeubles',
  LOCATAIRES = 'locataires',
  LOTS = 'lots'
}
export class ImportProgressDto {
  @ApiProperty({ description: 'Identifiant unique de l\'import' })
  importId: string;

  @ApiProperty({ description: 'Nombre total de lignes à traiter' })
  totalRows: number;

  @ApiProperty({ description: 'Nombre de lignes traitées' })
  processedRows: number;

  @ApiProperty({ description: 'Nombre de lignes réussies' })
  successfulRows: number;

  @ApiProperty({ description: 'Nombre de lignes échouées' })
  failedRows: number;

  @ApiProperty({ description: 'Pourcentage de progression (0-100)' })
  progressPercentage: number;

  @ApiProperty({ 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'TIMEOUT'],
    description: 'Statut de l\'import' 
  })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

  @ApiPropertyOptional({ description: 'Temps de traitement estimé restant en ms' })
  estimatedTimeRemainingMs?: number;

  @ApiProperty({ description: 'Erreurs rencontrées', type: [ImportErrorDto] })
  errors: ImportErrorDto[];

  @ApiProperty({ description: 'Timestamp de début' })
  startTime: Date;

  @ApiProperty({ description: 'Timestamp de dernière mise à jour' })
  lastUpdate: Date;
}