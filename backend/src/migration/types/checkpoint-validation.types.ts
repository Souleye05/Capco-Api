/**
 * Types for Phase 2 checkpoint validation
 * Comprehensive validation of data migration completion and integrity
 */

export interface Phase2ValidationOptions {
  skipIntegrityValidation?: boolean;
  skipPerformanceAnalysis?: boolean;
  detailedReporting?: boolean;
  sampleSize?: number;
  generateReport?: boolean;
}

export interface Phase2ValidationResult {
  validationId: string;
  phase: 'data_migrated';
  status: ValidationStatus;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  overallScore: number;
  
  // Validation components
  dataMigrationValidation?: DataMigrationValidation;
  integrityValidation?: IntegrityValidation;
  performanceMetrics?: PerformanceMetrics;
  
  // Results summary
  summary?: Phase2ValidationSummary;
  criticalIssues: CriticalIssue[];
  warnings: ValidationWarning[];
  recommendations: ValidationRecommendation[];
  
  // Optional detailed report
  detailedReport?: string;
}

export interface Phase2ValidationSummary {
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  criticalIssuesCount: number;
  warningsCount: number;
  dataIntegrityScore: number;
  migrationCompleteness: number; // Percentage of records migrated
  recommendationsCount: number;
}

export interface DataMigrationValidation {
  migrationCompleted: boolean;
  totalTablesExpected: number;
  totalTablesMigrated: number;
  totalRecordsExpected: number;
  totalRecordsMigrated: number;
  failedTables: FailedTableInfo[];
  migrationReports: MigrationReportSummary[];
}

export interface IntegrityValidation {
  overallIntegrityScore: number;
  recordCountValidation: ValidationCheck;
  checksumValidation: ValidationCheck;
  referentialIntegrityValidation: ValidationCheck;
  constraintValidation: ValidationCheck;
  dataTypeValidation: ValidationCheck;
  sampleDataValidation: ValidationCheck;
}

export interface ValidationCheck {
  passed: boolean;
  details: Record<string, any>;
}

export interface PerformanceMetrics {
  migrationDuration: number; // milliseconds
  averageRecordsPerSecond: number;
  averageTablesPerSecond: number;
  peakMemoryUsage: number; // bytes
  databaseConnectionsUsed: number;
  errorRate: number; // percentage
  retryCount: number;
}

export interface CriticalIssue {
  type: CriticalIssueType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  details: Record<string, any>;
  affectedTables: string[];
  recommendedAction: string;
}

export interface ValidationWarning {
  type: ValidationWarningType;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  details?: Record<string, any>;
  table?: string;
  column?: string;
}

export interface ValidationRecommendation {
  type: RecommendationType;
  category: RecommendationCategory;
  title: string;
  description: string;
  action: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FailedTableInfo {
  tableName: string;
  error: string;
  recordCount: number;
  failedAt: Date;
}

export interface MigrationReportSummary {
  migrationId: string;
  startTime: Date;
  endTime?: Date;
  totalTables: number;
  successfulTables: number;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS';
  totalDuration?: number;
  failedTables: FailedTableInfo[];
}

// Enums and Union Types

export type ValidationStatus = 
  | 'PASSED' 
  | 'PASSED_WITH_WARNINGS' 
  | 'FAILED' 
  | 'IN_PROGRESS';

export type CriticalIssueType = 
  | 'MIGRATION_INCOMPLETE'
  | 'DATA_CORRUPTION'
  | 'MISSING_DATA'
  | 'REFERENCE_ERROR'
  | 'CONSTRAINT_VIOLATION'
  | 'VALIDATION_ERROR'
  | 'SYSTEM_ERROR';

export type ValidationWarningType = 
  | 'DATA_MISMATCH'
  | 'PERFORMANCE_ISSUE'
  | 'INTEGRITY_WARNING'
  | 'CONFIGURATION_WARNING'
  | 'COMPATIBILITY_WARNING';

export type RecommendationType = 
  | 'CRITICAL'
  | 'ERROR'
  | 'WARNING'
  | 'INFO';

export type RecommendationCategory = 
  | 'DATA_MIGRATION'
  | 'DATA_INTEGRITY'
  | 'PERFORMANCE'
  | 'SECURITY'
  | 'CONFIGURATION'
  | 'GENERAL';

// Checkpoint validation request/response types

export interface CheckpointValidationRequest {
  phase: 'data_migrated';
  options?: Phase2ValidationOptions;
}

export interface CheckpointValidationResponse {
  validationResult: Phase2ValidationResult;
  canProceedToNextPhase: boolean;
  nextPhase?: 'users_migrated';
  blockers: string[];
  recommendations: string[];
}

// User interaction types for checkpoint validation

export interface UserValidationPrompt {
  title: string;
  message: string;
  status: ValidationStatus;
  criticalIssues: CriticalIssue[];
  warnings: ValidationWarning[];
  recommendations: ValidationRecommendation[];
  options: UserValidationOption[];
}

export interface UserValidationOption {
  id: string;
  title: string;
  description: string;
  action: 'PROCEED' | 'RETRY' | 'INVESTIGATE' | 'ABORT';
  recommended?: boolean;
}

export interface UserValidationResponse {
  selectedOption: string;
  additionalNotes?: string;
  timestamp: Date;
}

// Extended validation types for comprehensive reporting

export interface DetailedValidationMetrics {
  tableValidationResults: TableValidationSummary[];
  systemResourceUsage: SystemResourceMetrics;
  migrationTimeline: MigrationTimelineEvent[];
  dataQualityMetrics: DataQualityMetrics;
}

export interface TableValidationSummary {
  tableName: string;
  recordCount: {
    source: number;
    target: number;
    matches: boolean;
  };
  dataIntegrity: {
    checksumMatch: boolean;
    sampleValidationScore: number;
  };
  constraints: {
    totalConstraints: number;
    validConstraints: number;
    violations: string[];
  };
  foreignKeys: {
    totalReferences: number;
    validReferences: number;
    brokenReferences: string[];
  };
  migrationMetrics: {
    duration: number;
    recordsPerSecond: number;
    errorCount: number;
  };
}

export interface SystemResourceMetrics {
  cpuUsage: {
    average: number;
    peak: number;
  };
  memoryUsage: {
    average: number;
    peak: number;
  };
  diskIO: {
    readOperations: number;
    writeOperations: number;
    totalBytes: number;
  };
  networkIO: {
    bytesReceived: number;
    bytesSent: number;
  };
  databaseConnections: {
    active: number;
    idle: number;
    total: number;
  };
}

export interface MigrationTimelineEvent {
  timestamp: Date;
  phase: string;
  event: string;
  details: Record<string, any>;
  duration?: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface DataQualityMetrics {
  completeness: {
    score: number;
    missingRecords: number;
    totalRecords: number;
  };
  accuracy: {
    score: number;
    mismatchedRecords: number;
    totalValidated: number;
  };
  consistency: {
    score: number;
    inconsistentReferences: number;
    totalReferences: number;
  };
  validity: {
    score: number;
    invalidRecords: number;
    totalRecords: number;
  };
  uniqueness: {
    score: number;
    duplicateRecords: number;
    totalRecords: number;
  };
}

// Configuration types for validation behavior

export interface ValidationConfiguration {
  strictMode: boolean;
  toleranceThresholds: {
    recordCountMismatch: number; // percentage
    checksumMismatch: number; // percentage
    sampleValidationFailure: number; // percentage
    performanceDegradation: number; // percentage
  };
  retrySettings: {
    maxRetries: number;
    retryDelay: number; // milliseconds
    exponentialBackoff: boolean;
  };
  reportingSettings: {
    includeDetailedMetrics: boolean;
    includeSystemMetrics: boolean;
    includeTimeline: boolean;
    exportFormat: 'JSON' | 'MARKDOWN' | 'HTML';
  };
}

// Audit and compliance types

export interface ValidationAuditTrail {
  validationId: string;
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  configuration: ValidationConfiguration;
  results: Phase2ValidationResult;
  userInteractions: UserValidationResponse[];
  systemEvents: MigrationTimelineEvent[];
  complianceChecks: ComplianceCheckResult[];
}

export interface ComplianceCheckResult {
  checkType: 'DATA_RETENTION' | 'PRIVACY' | 'INTEGRITY' | 'AUDIT_TRAIL';
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  details: string;
  evidence: Record<string, any>;
  remediation?: string;
}