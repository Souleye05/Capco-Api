export interface RollbackMetadata {
  id: string;
  backupId: string;
  timestamp: Date;
  status: RollbackStatus;
  duration?: number;
  error?: string;
}

export enum RollbackStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export interface RollbackResult {
  rollbackId: string;
  backupId: string;
  startTime: Date;
  endTime?: Date;
  database: DatabaseRollbackResult;
  users: UserRollbackResult;
  storage: StorageRollbackResult;
  overallStatus: RollbackStatus;
  error?: string;
  validation?: any; // BackupValidationResult
}

export interface DatabaseRollbackResult {
  rollbackId: string;
  backupId: string;
  timestamp: Date;
  status: RollbackStatus;
  tablesRestored?: number;
  recordsRestored?: number;
  error?: string;
}

export interface UserRollbackResult {
  rollbackId: string;
  backupId: string;
  timestamp: Date;
  status: RollbackStatus;
  usersRestored?: number;
  error?: string;
  note?: string;
}

export interface StorageRollbackResult {
  rollbackId: string;
  backupId: string;
  timestamp: Date;
  status: RollbackStatus;
  bucketsRestored?: number;
  filesRestored?: number;
  totalSize?: number;
  error?: string;
}

export interface RollbackValidationResult {
  isValid: boolean;
  databaseIntact: boolean;
  usersRestored: boolean;
  storageRestored: boolean;
  errors: string[];
  validationTimestamp: Date;
}

export interface RollbackProgress {
  phase: RollbackPhase;
  currentStep: string;
  progress: number; // 0-100
  estimatedTimeRemaining?: number;
  currentTable?: string;
  currentBucket?: string;
  restoredRecords?: number;
  totalRecords?: number;
  restoredFiles?: number;
  totalFiles?: number;
}

export enum RollbackPhase {
  INITIALIZING = 'INITIALIZING',
  VALIDATING_BACKUP = 'VALIDATING_BACKUP',
  DATABASE_ROLLBACK = 'DATABASE_ROLLBACK',
  USER_ROLLBACK = 'USER_ROLLBACK',
  STORAGE_ROLLBACK = 'STORAGE_ROLLBACK',
  VALIDATION = 'VALIDATION',
  FINALIZATION = 'FINALIZATION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}