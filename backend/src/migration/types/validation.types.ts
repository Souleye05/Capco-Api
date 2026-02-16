export interface ValidationResult {
  isValid: boolean;
  score: number; // Confidence score 0-100
  warnings: ValidationWarning[];
  errors: ValidationError[];
  summary: ValidationSummary;
}

export interface ValidationWarning {
  type: 'DATA_MISMATCH' | 'PERFORMANCE' | 'INTEGRITY' | 'METADATA';
  table?: string;
  column?: string;
  recordId?: string;
  message: string;
  details?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ValidationError {
  type: 'MISSING_DATA' | 'CORRUPTED_DATA' | 'CONSTRAINT_VIOLATION' | 'REFERENCE_ERROR';
  table: string;
  column?: string;
  recordId?: string;
  message: string;
  details: Record<string, any>;
  critical: boolean;
}

export interface ValidationSummary {
  totalTables: number;
  validatedTables: number;
  totalRecords: number;
  validatedRecords: number;
  recordCountMatches: number;
  checksumMatches: number;
  referentialIntegrityChecks: number;
  constraintValidations: number;
  dataTypeValidations: number;
  confidenceScore: number;
}

export interface TableValidationResult {
  tableName: string;
  isValid: boolean;
  recordCount: {
    source: number;
    target: number;
    matches: boolean;
  };
  checksum: {
    source: string;
    target: string;
    matches: boolean;
  };
  sampleValidation: {
    sampleSize: number;
    validRecords: number;
    invalidRecords: number;
    matchPercentage: number;
  };
  referentialIntegrity: {
    foreignKeyChecks: number;
    validReferences: number;
    brokenReferences: number;
  };
  constraintValidation: {
    totalConstraints: number;
    validConstraints: number;
    violatedConstraints: ConstraintViolation[];
  };
  dataTypeValidation: {
    totalColumns: number;
    validColumns: number;
    typeViolations: DataTypeViolation[];
  };
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ConstraintViolation {
  constraintName: string;
  constraintType: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE' | 'CHECK' | 'NOT_NULL';
  violatingRecords: string[];
  details: string;
}

export interface DataTypeViolation {
  columnName: string;
  expectedType: string;
  actualType: string;
  violatingRecords: string[];
  details: string;
}

export interface ValidationOptions {
  sampleSize?: number;
  checksumValidation?: boolean;
  referentialIntegrityCheck?: boolean;
  constraintValidation?: boolean;
  dataTypeValidation?: boolean;
  performanceMetrics?: boolean;
  detailedReporting?: boolean;
}

export interface ValidationMetrics {
  validationStartTime: Date;
  validationEndTime?: Date;
  totalDuration?: number;
  tablesPerSecond?: number;
  recordsPerSecond?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface RecordComparison {
  recordId: string;
  matches: boolean;
  differences: FieldDifference[];
  confidenceScore: number;
}

export interface FieldDifference {
  fieldName: string;
  sourceValue: any;
  targetValue: any;
  differenceType: 'MISSING' | 'EXTRA' | 'VALUE_MISMATCH' | 'TYPE_MISMATCH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ChecksumValidation {
  tableName: string;
  sourceChecksum: string;
  targetChecksum: string;
  matches: boolean;
  algorithm: 'MD5' | 'SHA256' | 'CRC32';
}

export interface ReferentialIntegrityCheck {
  tableName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  totalReferences: number;
  validReferences: number;
  brokenReferences: BrokenReference[];
}

export interface BrokenReference {
  recordId: string;
  foreignKeyValue: any;
  referencedTable: string;
  referencedColumn: string;
  details: string;
}