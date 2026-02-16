export interface CheckpointInfo {
  id: string;
  name: string;
  description?: string;
  phase: MigrationPhase;
  status: CheckpointStatus;
  createdAt: Date;
  databaseBackup: string;
  storageBackup: string;
  configBackup: string;
  metadata: CheckpointMetadata;
  validationResults?: ValidationResult[];
}

export interface CheckpointMetadata {
  version: string;
  migrationStep: string;
  dataIntegrity: {
    recordCounts: Record<string, number>;
    checksums: Record<string, string>;
  };
  userCounts: {
    totalUsers: number;
    migratedUsers: number;
  };
  fileCounts: {
    totalFiles: number;
    migratedFiles: number;
    totalSize: number;
  };
}

export interface ValidationResult {
  component: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
}

export enum MigrationPhase {
  INITIAL = 'initial',
  SCHEMA_EXTRACTED = 'schema_extracted',
  DATA_MIGRATED = 'data_migrated',
  USERS_MIGRATED = 'users_migrated',
  FILES_MIGRATED = 'files_migrated',
  VALIDATION_COMPLETE = 'validation_complete',
  PRODUCTION_READY = 'production_ready'
}

export enum CheckpointStatus {
  CREATED = 'created',
  VALIDATED = 'validated',
  ACTIVE = 'active',
  SUPERSEDED = 'superseded',
  FAILED = 'failed'
}

export interface RollbackToCheckpointResult {
  success: boolean;
  checkpointId: string;
  checkpointName: string;
  rollbackStartTime: Date;
  rollbackEndTime?: Date;
  componentsRolledBack: string[];
  errors: string[];
  validationResults: ValidationResult[];
}

export interface CreateCheckpointRequest {
  name: string;
  phase: MigrationPhase;
  description?: string;
}

export interface CheckpointListResponse {
  checkpoints: CheckpointInfo[];
  total: number;
}

export interface CheckpointValidationRequest {
  phase: MigrationPhase;
}

export interface CheckpointValidationResponse {
  valid: boolean;
  checkpoint?: CheckpointInfo;
  validationResults: ValidationResult[];
}

// Re-export types from checkpoint-validation.types.ts for convenience
export * from './checkpoint-validation.types';