export interface BackupMetadata {
  id: string;
  timestamp: Date;
  version: string;
  description?: string;
  size: number;
  checksum: string;
  status: BackupStatus;
}

export enum BackupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CORRUPTED = 'CORRUPTED',
}

export interface DatabaseBackupResult {
  backupId: string;
  timestamp: Date;
  filePath: string;
  size: number;
  checksum: string;
  tableCount: number;
  recordCount: number;
  status: BackupStatus;
  error?: string;
}

export interface UserBackupResult {
  backupId: string;
  timestamp: Date;
  filePath: string;
  size: number;
  checksum: string;
  userCount: number;
  status: BackupStatus;
  error?: string;
}

export interface StorageBackupResult {
  backupId: string;
  timestamp: Date;
  backupPath: string;
  totalFiles: number;
  totalSize: number;
  checksum: string;
  buckets: BucketBackupInfo[];
  status: BackupStatus;
  error?: string;
}

export interface BucketBackupInfo {
  bucketName: string;
  fileCount: number;
  totalSize: number;
  backupPath: string;
  checksum: string;
}

export interface CompleteBackupResult {
  backupId: string;
  timestamp: Date;
  database: DatabaseBackupResult;
  users: UserBackupResult;
  storage: StorageBackupResult;
  overallStatus: BackupStatus;
  totalSize: number;
  overallChecksum: string;
  metadata: BackupMetadata;
}

export interface BackupValidationResult {
  isValid: boolean;
  checksumMatch: boolean;
  filesIntact: boolean;
  databaseAccessible: boolean;
  errors: string[];
  validationTimestamp: Date;
}

export interface FileBackupInfo {
  fileName: string;
  originalPath: string;
  backupPath: string;
  size: number;
  checksum: string;
  mimetype?: string;
  uploadedAt?: Date;
}

export interface TableBackupInfo {
  tableName: string;
  recordCount: number;
  size: number;
  checksum: string;
  dependencies: string[];
}

export interface BackupProgress {
  phase: BackupPhase;
  currentStep: string;
  progress: number; // 0-100
  estimatedTimeRemaining?: number;
  currentTable?: string;
  currentBucket?: string;
  processedRecords?: number;
  totalRecords?: number;
  processedFiles?: number;
  totalFiles?: number;
}

export enum BackupPhase {
  INITIALIZING = 'INITIALIZING',
  DATABASE_BACKUP = 'DATABASE_BACKUP',
  USER_BACKUP = 'USER_BACKUP',
  STORAGE_BACKUP = 'STORAGE_BACKUP',
  VALIDATION = 'VALIDATION',
  FINALIZATION = 'FINALIZATION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}