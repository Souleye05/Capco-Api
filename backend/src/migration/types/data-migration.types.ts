export interface MigrationData {
  [tableName: string]: any[];
}

export interface TableMigrationResult {
  tableName: string;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface MigrationReport {
  migrationId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  totalTables: number;
  successfulTables: number;
  failedTables: TableMigrationFailure[];
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  tableResults: TableMigrationResult[];
  validationResults?: ValidationSummary;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
}

export interface TableMigrationFailure {
  tableName: string;
  error: string;
  recordCount: number;
  failedAt: Date;
}

export interface ValidationSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warnings: string[];
  errors: string[];
}

export interface DataExportOptions {
  batchSize?: number;
  excludeTables?: string[];
  includeTables?: string[];
  preserveTimestamps?: boolean;
  validateIntegrity?: boolean;
}

export interface DataImportOptions {
  batchSize?: number;
  skipValidation?: boolean;
  continueOnError?: boolean;
  preserveIds?: boolean;
  transactional?: boolean;
}

export interface RecordValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TableImportProgress {
  tableName: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  currentBatch: number;
  totalBatches: number;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export interface MigrationProgress {
  migrationId: string;
  currentPhase: 'EXPORT' | 'IMPORT' | 'VALIDATION' | 'COMPLETE';
  totalTables: number;
  processedTables: number;
  currentTable?: TableImportProgress;
  overallProgress: number;
  startTime: Date;
  estimatedCompletion?: Date;
}

export interface DataIntegrityCheck {
  checkType: 'RECORD_COUNT' | 'CHECKSUM' | 'FOREIGN_KEY' | 'UNIQUE_CONSTRAINT' | 'DATA_TYPE';
  tableName: string;
  columnName?: string;
  expected: any;
  actual: any;
  passed: boolean;
  details?: string;
}

export interface MigrationCheckpoint {
  checkpointId: string;
  migrationId: string;
  phase: string;
  tableName?: string;
  recordsProcessed: number;
  timestamp: Date;
  metadata: Record<string, any>;
}