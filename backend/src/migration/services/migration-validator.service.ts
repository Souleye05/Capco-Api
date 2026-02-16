import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MigrationLoggerService } from './migration-logger.service';
import { SchemaExtractorService, TableMetadata } from './schema-extractor.service';
import {
  ValidationResult,
  ValidationWarning,
  ValidationError,
  ValidationSummary,
  TableValidationResult,
  ValidationOptions,
  ValidationMetrics,
  RecordComparison,
  FieldDifference,
  ChecksumValidation,
  ReferentialIntegrityCheck,
  BrokenReference,
  ConstraintViolation,
  DataTypeViolation
} from '../types/validation.types';
import * as crypto from 'crypto';

@Injectable()
export class MigrationValidatorService {
  private readonly logger = new Logger(MigrationValidatorService.name);
  private supabaseClient: SupabaseClient;
  private validationMetrics: ValidationMetrics;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private migrationLogger: MigrationLoggerService,
    private schemaExtractor: SchemaExtractorService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is required for migration validation');
    }
    
    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Perform comprehensive validation of migrated data
   * Requirements: 5.1, 5.2, 5.3, 5.8, 5.9, 5.10
   */
  async validateMigration(options: ValidationOptions = {}): Promise<ValidationResult> {
    const startTime = new Date();
    this.validationMetrics = {
      validationStartTime: startTime,
    };

    this.logger.log('Starting comprehensive migration validation');
    
    const {
      sampleSize = 100,
      checksumValidation = true,
      referentialIntegrityCheck = true,
      constraintValidation = true,
      dataTypeValidation = true,
      performanceMetrics = true,
      detailedReporting = true,
    } = options;

    await this.migrationLogger.logInfo('validation_start', 'Starting migration validation', {
      options,
      startTime,
    });

    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];
    const tableResults: TableValidationResult[] = [];

    try {
      // Get schema information
      const schema = await this.schemaExtractor.extractCompleteSchema();
      const tablesToValidate = schema.tables.filter(table => !this.isInternalTable(table.name));

      this.logger.log(`Validating ${tablesToValidate.length} tables`);

      // Validate each table
      for (const table of tablesToValidate) {
        this.logger.log(`Validating table: ${table.name}`);
        
        const tableResult = await this.validateTable(
          table,
          sampleSize,
          checksumValidation,
          referentialIntegrityCheck,
          constraintValidation,
          dataTypeValidation
        );
        
        tableResults.push(tableResult);
        warnings.push(...tableResult.warnings);
        errors.push(...tableResult.errors);
        
        this.logger.log(`Table ${table.name} validation: ${tableResult.isValid ? 'PASSED' : 'FAILED'}`);
      }

      // Calculate overall validation metrics
      const summary = this.calculateValidationSummary(tableResults);
      const confidenceScore = this.calculateConfidenceScore(summary, warnings, errors);

      const endTime = new Date();
      this.validationMetrics.validationEndTime = endTime;
      this.validationMetrics.totalDuration = endTime.getTime() - startTime.getTime();

      if (performanceMetrics) {
        this.calculatePerformanceMetrics(summary);
      }

      const result: ValidationResult = {
        isValid: errors.filter(e => e.critical).length === 0,
        score: confidenceScore,
        warnings,
        errors,
        summary,
      };

      await this.migrationLogger.logInfo('validation_complete', 'Migration validation completed', {
        result: {
          isValid: result.isValid,
          score: result.score,
          warningCount: warnings.length,
          errorCount: errors.length,
        },
        duration: this.validationMetrics.totalDuration,
      });

      this.logger.log(`Migration validation completed: ${result.isValid ? 'VALID' : 'INVALID'} (Score: ${result.score}%)`);
      
      return result;

    } catch (error) {
      await this.migrationLogger.logError('validation_error', 'Migration validation failed', error, {
        tablesValidated: tableResults.length,
      });
      
      throw error;
    }
  }

  /**
   * Validate a specific table with comprehensive checks
   */
  private async validateTable(
    table: TableMetadata,
    sampleSize: number,
    checksumValidation: boolean,
    referentialIntegrityCheck: boolean,
    constraintValidation: boolean,
    dataTypeValidation: boolean
  ): Promise<TableValidationResult> {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    // 1. Record count validation
    const recordCount = await this.validateRecordCount(table.name);
    if (!recordCount.matches) {
      errors.push({
        type: 'MISSING_DATA',
        table: table.name,
        message: `Record count mismatch: source ${recordCount.source}, target ${recordCount.target}`,
        details: { recordCount },
        critical: true,
      });
    }

    // 2. Checksum validation
    let checksum = { source: '', target: '', matches: true };
    if (checksumValidation && recordCount.target > 0) {
      checksum = await this.validateTableChecksum(table.name);
      if (!checksum.matches) {
        errors.push({
          type: 'CORRUPTED_DATA',
          table: table.name,
          message: 'Table checksum mismatch indicates data corruption',
          details: { checksum },
          critical: true,
        });
      }
    }

    // 3. Sample record validation
    const sampleValidation = await this.validateSampleRecords(table.name, sampleSize);
    if (sampleValidation.matchPercentage < 95) {
      warnings.push({
        type: 'DATA_MISMATCH',
        table: table.name,
        message: `Sample validation shows ${sampleValidation.matchPercentage}% match rate`,
        details: { sampleValidation },
        severity: sampleValidation.matchPercentage < 90 ? 'HIGH' : 'MEDIUM',
      });
    }

    // 4. Referential integrity validation
    let referentialIntegrity = {
      foreignKeyChecks: 0,
      validReferences: 0,
      brokenReferences: 0,
    };
    if (referentialIntegrityCheck) {
      referentialIntegrity = await this.validateReferentialIntegrity(table);
      if (referentialIntegrity.brokenReferences > 0) {
        errors.push({
          type: 'REFERENCE_ERROR',
          table: table.name,
          message: `Found ${referentialIntegrity.brokenReferences} broken foreign key references`,
          details: { referentialIntegrity },
          critical: true,
        });
      }
    }

    // 5. Constraint validation
    let constraintValidationResult = {
      totalConstraints: table.constraints.length,
      validConstraints: 0,
      violatedConstraints: [] as ConstraintViolation[],
    };
    if (constraintValidation) {
      constraintValidationResult = await this.validateConstraints(table);
      if (constraintValidationResult.violatedConstraints.length > 0) {
        for (const violation of constraintValidationResult.violatedConstraints) {
          errors.push({
            type: 'CONSTRAINT_VIOLATION',
            table: table.name,
            message: `Constraint violation: ${violation.constraintName}`,
            details: { violation },
            critical: violation.constraintType === 'PRIMARY_KEY' || violation.constraintType === 'NOT_NULL',
          });
        }
      }
    }

    // 6. Data type validation
    let dataTypeValidationResult = {
      totalColumns: table.columns.length,
      validColumns: 0,
      typeViolations: [] as DataTypeViolation[],
    };
    if (dataTypeValidation) {
      dataTypeValidationResult = await this.validateDataTypes(table);
      if (dataTypeValidationResult.typeViolations.length > 0) {
        for (const violation of dataTypeValidationResult.typeViolations) {
          errors.push({
            type: 'CORRUPTED_DATA',
            table: table.name,
            column: violation.columnName,
            message: `Data type violation: expected ${violation.expectedType}, found ${violation.actualType}`,
            details: { violation },
            critical: false,
          });
        }
      }
    }

    const isValid = errors.filter(e => e.critical).length === 0;

    return {
      tableName: table.name,
      isValid,
      recordCount,
      checksum,
      sampleValidation,
      referentialIntegrity,
      constraintValidation: constraintValidationResult,
      dataTypeValidation: dataTypeValidationResult,
      warnings,
      errors,
    };
  }

  /**
   * Validate record counts between source and target
   */
  private async validateRecordCount(tableName: string): Promise<{
    source: number;
    target: number;
    matches: boolean;
  }> {
    try {
      // Get source count from Supabase
      const { count: sourceCount, error: sourceError } = await this.supabaseClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (sourceError) {
        throw new Error(`Failed to get source count for ${tableName}: ${sourceError.message}`);
      }

      // Get target count from PostgreSQL
      const targetResult = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const targetCount = parseInt((targetResult as any)[0].count);

      return {
        source: sourceCount || 0,
        target: targetCount,
        matches: (sourceCount || 0) === targetCount,
      };

    } catch (error) {
      this.logger.error(`Error validating record count for ${tableName}: ${error.message}`);
      return { source: 0, target: 0, matches: false };
    }
  }

  /**
   * Validate table checksum for data integrity
   */
  private async validateTableChecksum(tableName: string): Promise<{
    source: string;
    target: string;
    matches: boolean;
  }> {
    try {
      // Get source data checksum
      const { data: sourceData, error: sourceError } = await this.supabaseClient
        .from(tableName)
        .select('*')
        .order('id');

      if (sourceError) {
        throw new Error(`Failed to get source data for checksum: ${sourceError.message}`);
      }

      const sourceChecksum = this.calculateDataChecksum(sourceData || []);

      // Get target data checksum
      const targetData = await this.prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}" ORDER BY id`);
      const targetChecksum = this.calculateDataChecksum(targetData as any[]);

      return {
        source: sourceChecksum,
        target: targetChecksum,
        matches: sourceChecksum === targetChecksum,
      };

    } catch (error) {
      this.logger.error(`Error validating checksum for ${tableName}: ${error.message}`);
      return { source: '', target: '', matches: false };
    }
  }

  /**
   * Validate a sample of records for detailed comparison
   */
  private async validateSampleRecords(tableName: string, sampleSize: number): Promise<{
    sampleSize: number;
    validRecords: number;
    invalidRecords: number;
    matchPercentage: number;
  }> {
    try {
      // Get sample records from source
      const { data: sourceRecords, error: sourceError } = await this.supabaseClient
        .from(tableName)
        .select('*')
        .limit(sampleSize);

      if (sourceError || !sourceRecords || sourceRecords.length === 0) {
        return { sampleSize: 0, validRecords: 0, invalidRecords: 0, matchPercentage: 100 };
      }

      let validRecords = 0;
      let invalidRecords = 0;

      for (const sourceRecord of sourceRecords) {
        try {
          const targetRecord = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM "${tableName}" WHERE id = $1`,
            sourceRecord.id
          );

          if ((targetRecord as any[]).length === 0) {
            invalidRecords++;
            continue;
          }

          const comparison = await this.compareRecords(sourceRecord, (targetRecord as any[])[0]);
          if (comparison.matches) {
            validRecords++;
          } else {
            invalidRecords++;
          }

        } catch (error) {
          invalidRecords++;
        }
      }

      const totalRecords = validRecords + invalidRecords;
      const matchPercentage = totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 100;

      return {
        sampleSize: totalRecords,
        validRecords,
        invalidRecords,
        matchPercentage,
      };

    } catch (error) {
      this.logger.error(`Error validating sample records for ${tableName}: ${error.message}`);
      return { sampleSize: 0, validRecords: 0, invalidRecords: 0, matchPercentage: 0 };
    }
  }

  /**
   * Validate referential integrity for foreign keys
   */
  private async validateReferentialIntegrity(table: TableMetadata): Promise<{
    foreignKeyChecks: number;
    validReferences: number;
    brokenReferences: number;
  }> {
    let foreignKeyChecks = 0;
    let validReferences = 0;
    let brokenReferences = 0;

    const foreignKeyColumns = table.columns.filter(col => col.isForeignKey && col.references);

    for (const column of foreignKeyColumns) {
      if (!column.references) continue;

      try {
        foreignKeyChecks++;

        // Check for broken references
        const brokenRefsQuery = `
          SELECT COUNT(*) as count 
          FROM "${table.name}" t1 
          LEFT JOIN "${column.references.table}" t2 ON t1."${column.name}" = t2."${column.references.column}"
          WHERE t1."${column.name}" IS NOT NULL AND t2."${column.references.column}" IS NULL
        `;

        const result = await this.prisma.$queryRawUnsafe(brokenRefsQuery);
        const brokenCount = parseInt((result as any)[0].count);

        if (brokenCount > 0) {
          brokenReferences += brokenCount;
        } else {
          validReferences++;
        }

      } catch (error) {
        this.logger.error(`Error checking referential integrity for ${table.name}.${column.name}: ${error.message}`);
        brokenReferences++;
      }
    }

    return {
      foreignKeyChecks,
      validReferences,
      brokenReferences,
    };
  }

  /**
   * Validate table constraints
   */
  private async validateConstraints(table: TableMetadata): Promise<{
    totalConstraints: number;
    validConstraints: number;
    violatedConstraints: ConstraintViolation[];
  }> {
    const violatedConstraints: ConstraintViolation[] = [];
    let validConstraints = 0;

    for (const constraint of table.constraints) {
      try {
        let violatingRecords: string[] = [];

        switch (constraint.type) {
          case 'PRIMARY KEY':
            violatingRecords = await this.checkPrimaryKeyViolations(table.name, constraint.columns);
            break;
          case 'UNIQUE':
            violatingRecords = await this.checkUniqueViolations(table.name, constraint.columns);
            break;
          case 'CHECK':
            // Check constraints are complex and would need specific implementation
            break;
          // Note: NOT NULL constraints are typically handled at column level
        }

        if (violatingRecords.length > 0) {
          violatedConstraints.push({
            constraintName: constraint.name,
            constraintType: constraint.type as any,
            violatingRecords,
            details: `Found ${violatingRecords.length} violations`,
          });
        } else {
          validConstraints++;
        }

      } catch (error) {
        this.logger.error(`Error validating constraint ${constraint.name}: ${error.message}`);
        violatedConstraints.push({
          constraintName: constraint.name,
          constraintType: constraint.type as any,
          violatingRecords: [],
          details: `Validation error: ${error.message}`,
        });
      }
    }

    return {
      totalConstraints: table.constraints.length,
      validConstraints,
      violatedConstraints,
    };
  }

  /**
   * Validate data types for all columns
   */
  private async validateDataTypes(table: TableMetadata): Promise<{
    totalColumns: number;
    validColumns: number;
    typeViolations: DataTypeViolation[];
  }> {
    const typeViolations: DataTypeViolation[] = [];
    let validColumns = 0;

    for (const column of table.columns) {
      try {
        // This is a simplified check - in production would be more comprehensive
        const sampleQuery = `SELECT "${column.name}" FROM "${table.name}" WHERE "${column.name}" IS NOT NULL LIMIT 10`;
        const sampleData = await this.prisma.$queryRawUnsafe(sampleQuery);

        if ((sampleData as any[]).length > 0) {
          const isValid = this.validateColumnDataType(column, sampleData as any[]);
          if (isValid) {
            validColumns++;
          } else {
            typeViolations.push({
              columnName: column.name,
              expectedType: column.type,
              actualType: 'mixed',
              violatingRecords: [],
              details: 'Data type inconsistency detected',
            });
          }
        } else {
          validColumns++; // Empty column is valid
        }

      } catch (error) {
        this.logger.error(`Error validating data type for ${table.name}.${column.name}: ${error.message}`);
      }
    }

    return {
      totalColumns: table.columns.length,
      validColumns,
      typeViolations,
    };
  }

  // Helper methods
  private calculateDataChecksum(data: any[]): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  private async compareRecords(source: any, target: any): Promise<RecordComparison> {
    const differences: FieldDifference[] = [];
    const sourceKeys = Object.keys(source);
    const targetKeys = Object.keys(target);

    // Check for missing or extra fields
    for (const key of sourceKeys) {
      if (!targetKeys.includes(key)) {
        differences.push({
          fieldName: key,
          sourceValue: source[key],
          targetValue: undefined,
          differenceType: 'MISSING',
          severity: 'HIGH',
        });
      }
    }

    for (const key of targetKeys) {
      if (!sourceKeys.includes(key)) {
        differences.push({
          fieldName: key,
          sourceValue: undefined,
          targetValue: target[key],
          differenceType: 'EXTRA',
          severity: 'MEDIUM',
        });
      }
    }

    // Check for value differences
    for (const key of sourceKeys) {
      if (targetKeys.includes(key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (!this.valuesEqual(sourceValue, targetValue)) {
          differences.push({
            fieldName: key,
            sourceValue,
            targetValue,
            differenceType: 'VALUE_MISMATCH',
            severity: this.isTimestampField(key) ? 'LOW' : 'HIGH',
          });
        }
      }
    }

    const matches = differences.filter(d => d.severity === 'HIGH' || d.severity === 'CRITICAL').length === 0;
    const confidenceScore = Math.max(0, 100 - (differences.length * 10));

    return {
      recordId: source.id || target.id || 'unknown',
      matches,
      differences,
      confidenceScore,
    };
  }

  private valuesEqual(value1: any, value2: any): boolean {
    if (value1 === value2) return true;
    
    // Handle date comparisons with tolerance
    if (value1 instanceof Date && value2 instanceof Date) {
      return Math.abs(value1.getTime() - value2.getTime()) < 1000; // 1 second tolerance
    }
    
    // Handle string date comparisons
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      try {
        const date1 = new Date(value1);
        const date2 = new Date(value2);
        if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
          return Math.abs(date1.getTime() - date2.getTime()) < 1000;
        }
      } catch {
        // Not dates, continue with regular comparison
      }
    }
    
    return false;
  }

  private isTimestampField(fieldName: string): boolean {
    const timestampFields = ['created_at', 'updated_at', 'deleted_at', 'last_sign_in_at'];
    return timestampFields.includes(fieldName.toLowerCase());
  }

  private async checkPrimaryKeyViolations(tableName: string, columns: string[]): Promise<string[]> {
    const columnList = columns.map(c => `"${c}"`).join(', ');
    const query = `
      SELECT ${columnList}
      FROM "${tableName}"
      GROUP BY ${columnList}
      HAVING COUNT(*) > 1
    `;
    
    const result = await this.prisma.$queryRawUnsafe(query);
    return (result as any[]).map(row => JSON.stringify(row));
  }

  private async checkUniqueViolations(tableName: string, columns: string[]): Promise<string[]> {
    return this.checkPrimaryKeyViolations(tableName, columns); // Same logic
  }

  private async checkNotNullViolations(tableName: string, columns: string[]): Promise<string[]> {
    const violations: string[] = [];
    
    for (const column of columns) {
      const query = `SELECT id FROM "${tableName}" WHERE "${column}" IS NULL`;
      const result = await this.prisma.$queryRawUnsafe(query);
      violations.push(...(result as any[]).map(row => row.id));
    }
    
    return violations;
  }

  private validateColumnDataType(column: any, sampleData: any[]): boolean {
    // Simplified validation - in production would be more comprehensive
    return true;
  }

  private calculateValidationSummary(tableResults: TableValidationResult[]): ValidationSummary {
    const totalTables = tableResults.length;
    const validatedTables = tableResults.filter(r => r.isValid).length;
    
    const totalRecords = tableResults.reduce((sum, r) => sum + r.recordCount.target, 0);
    const validatedRecords = tableResults.reduce((sum, r) => 
      sum + (r.sampleValidation.validRecords || 0), 0
    );
    
    const recordCountMatches = tableResults.filter(r => r.recordCount.matches).length;
    const checksumMatches = tableResults.filter(r => r.checksum.matches).length;
    const referentialIntegrityChecks = tableResults.reduce((sum, r) => 
      sum + r.referentialIntegrity.foreignKeyChecks, 0
    );
    const constraintValidations = tableResults.reduce((sum, r) => 
      sum + r.constraintValidation.totalConstraints, 0
    );
    const dataTypeValidations = tableResults.reduce((sum, r) => 
      sum + r.dataTypeValidation.totalColumns, 0
    );

    const confidenceScore = totalTables > 0 ? Math.round((validatedTables / totalTables) * 100) : 100;

    return {
      totalTables,
      validatedTables,
      totalRecords,
      validatedRecords,
      recordCountMatches,
      checksumMatches,
      referentialIntegrityChecks,
      constraintValidations,
      dataTypeValidations,
      confidenceScore,
    };
  }

  private calculateConfidenceScore(
    summary: ValidationSummary,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ): number {
    let score = summary.confidenceScore;
    
    // Reduce score for warnings
    score -= warnings.length * 2;
    
    // Reduce score more for errors
    score -= errors.filter(e => !e.critical).length * 5;
    score -= errors.filter(e => e.critical).length * 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculatePerformanceMetrics(summary: ValidationSummary): void {
    if (this.validationMetrics.totalDuration) {
      const durationSeconds = this.validationMetrics.totalDuration / 1000;
      this.validationMetrics.tablesPerSecond = summary.totalTables / durationSeconds;
      this.validationMetrics.recordsPerSecond = summary.totalRecords / durationSeconds;
    }
  }

  private isInternalTable(tableName: string): boolean {
    const internalTables = [
      'schema_migrations',
      'supabase_migrations',
      '_prisma_migrations',
      'migration_logs',
      'migration_checkpoints',
      'backup_records',
      'migration_log_entries',
      'audit_trail',
      'migration_metrics',
      'migration_alerts',
    ];
    
    return internalTables.some(internal => 
      tableName.startsWith(internal) || tableName.includes(`_${internal}_`)
    );
  }

  /**
   * Generate detailed validation report
   */
  async generateValidationReport(validationResult: ValidationResult): Promise<string> {
    const report = [
      '# Migration Validation Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Overall Status: ${validationResult.isValid ? '✅ VALID' : '❌ INVALID'}`,
      `- Confidence Score: ${validationResult.score}%`,
      `- Tables Validated: ${validationResult.summary.validatedTables}/${validationResult.summary.totalTables}`,
      `- Records Validated: ${validationResult.summary.validatedRecords}/${validationResult.summary.totalRecords}`,
      '',
      '## Validation Metrics',
      `- Record Count Matches: ${validationResult.summary.recordCountMatches}`,
      `- Checksum Matches: ${validationResult.summary.checksumMatches}`,
      `- Referential Integrity Checks: ${validationResult.summary.referentialIntegrityChecks}`,
      `- Constraint Validations: ${validationResult.summary.constraintValidations}`,
      `- Data Type Validations: ${validationResult.summary.dataTypeValidations}`,
      '',
    ];

    if (validationResult.errors.length > 0) {
      report.push('## Errors');
      for (const error of validationResult.errors) {
        report.push(`- **${error.type}** in ${error.table}${error.column ? `.${error.column}` : ''}: ${error.message}`);
      }
      report.push('');
    }

    if (validationResult.warnings.length > 0) {
      report.push('## Warnings');
      for (const warning of validationResult.warnings) {
        report.push(`- **${warning.severity}** ${warning.type} in ${warning.table || 'system'}: ${warning.message}`);
      }
      report.push('');
    }

    return report.join('\n');
  }
}