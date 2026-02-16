import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';
import { MigrationValidatorService } from './migration-validator.service';
import { DataMigratorService } from './data-migrator.service';
import { MigrationLoggerService } from './migration-logger.service';
import { CheckpointService } from './checkpoint.service';
import { CheckpointUserInteractionService } from './checkpoint-user-interaction.service';
import {
  Phase2ValidationResult,
  Phase2ValidationSummary,
  DataMigrationValidation,
  IntegrityValidation,
  PerformanceMetrics,
  ValidationRecommendation,
  Phase2ValidationOptions,
  ValidationStatus,
  CriticalIssue,
  ValidationWarning,
  MigrationReportSummary,
} from '../types/checkpoint-validation.types';
import {
  ValidationResult,
  ValidationSummary,
} from '../types/validation.types';
import {
  MigrationReport,
  MigrationProgress,
} from '../types/data-migration.types';

@Injectable()
export class CheckpointPhase2ValidatorService {
  private readonly logger = new Logger(CheckpointPhase2ValidatorService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private migrationValidator: MigrationValidatorService,
    private dataMigrator: DataMigratorService,
    private migrationLogger: MigrationLoggerService,
    private checkpointService: CheckpointService,
    private userInteraction: CheckpointUserInteractionService,
  ) {}

  /**
   * Comprehensive Phase 2 checkpoint validation
   * Validates that all data migration has been completed correctly
   * Requirements: 5.1, 5.2, 5.3, 5.8, 5.9, 5.10
   */
  async validatePhase2Checkpoint(options: Phase2ValidationOptions = {}): Promise<Phase2ValidationResult> {
    const startTime = new Date();
    this.logger.log('Starting Phase 2 checkpoint validation - Data Migration');

    const {
      skipIntegrityValidation = false,
      skipPerformanceAnalysis = false,
      detailedReporting = true,
      sampleSize = 100,
      generateReport = true,
    } = options;

    await this.migrationLogger.logInfo('phase2_validation_start', 'Starting Phase 2 checkpoint validation', {
      options,
      startTime,
    });

    const result: Phase2ValidationResult = {
      validationId: this.generateValidationId(),
      phase: 'data_migrated',
      status: 'IN_PROGRESS',
      startTime,
      overallScore: 0,
      criticalIssues: [],
      warnings: [],
      recommendations: [],
    };

    try {
      // 1. Validate data migration completion
      this.logger.log('Step 1: Validating data migration completion');
      result.dataMigrationValidation = await this.validateDataMigrationCompletion();

      // 2. Validate data integrity
      if (!skipIntegrityValidation) {
        this.logger.log('Step 2: Validating data integrity');
        result.integrityValidation = await this.validateDataIntegrity(sampleSize);
      }

      // 3. Analyze performance metrics
      if (!skipPerformanceAnalysis) {
        this.logger.log('Step 3: Analyzing performance metrics');
        result.performanceMetrics = await this.analyzePerformanceMetrics();
      }

      // 4. Generate validation summary
      this.logger.log('Step 4: Generating validation summary');
      result.summary = this.generateValidationSummary(result);

      // 5. Calculate overall score and status
      result.overallScore = this.calculateOverallScore(result);
      result.status = this.determineValidationStatus(result);

      // 6. Generate recommendations
      result.recommendations = this.generateRecommendations(result);

      const endTime = new Date();
      result.endTime = endTime;
      result.totalDuration = endTime.getTime() - startTime.getTime();

      // 7. Generate detailed report if requested
      if (generateReport && detailedReporting) {
        result.detailedReport = await this.generateDetailedReport(result);
      }

      await this.migrationLogger.logInfo('phase2_validation_complete', 'Phase 2 checkpoint validation completed', {
        validationId: result.validationId,
        status: result.status,
        overallScore: result.overallScore,
        criticalIssues: result.criticalIssues.length,
        warnings: result.warnings.length,
        duration: result.totalDuration,
      });

      this.logger.log(`Phase 2 validation completed: ${result.status} (Score: ${result.overallScore}%)`);
      
      return result;

    } catch (error) {
      const endTime = new Date();
      result.endTime = endTime;
      result.totalDuration = endTime.getTime() - startTime.getTime();
      result.status = 'FAILED';
      result.criticalIssues.push({
        type: 'VALIDATION_ERROR',
        severity: 'CRITICAL',
        message: `Phase 2 validation failed: ${error.message}`,
        details: { error: error.stack },
        affectedTables: [],
        recommendedAction: 'Review validation logs and retry validation',
      });

      await this.migrationLogger.logError('phase2_validation_error', 'Phase 2 validation failed', error, {
        validationId: result.validationId,
        duration: result.totalDuration,
      });

      throw error;
    }
  }

  /**
   * Validate that data migration has been completed successfully
   */
  private async validateDataMigrationCompletion(): Promise<DataMigrationValidation> {
    this.logger.log('Validating data migration completion status');

    const validation: DataMigrationValidation = {
      migrationCompleted: false,
      totalTablesExpected: 0,
      totalTablesMigrated: 0,
      totalRecordsExpected: 0,
      totalRecordsMigrated: 0,
      failedTables: [],
      migrationReports: [],
    };

    try {
      // Check if migration has been executed
      const migrationProgress = this.dataMigrator.getMigrationProgress();
      
      if (!migrationProgress) {
        validation.migrationCompleted = false;
        return validation;
      }

      // Get migration reports from logs
      const migrationReports = await this.getMigrationReports();
      validation.migrationReports = migrationReports;

      if (migrationReports.length === 0) {
        validation.migrationCompleted = false;
        return validation;
      }

      // Analyze latest migration report
      const latestReport = migrationReports[migrationReports.length - 1];
      validation.totalTablesExpected = latestReport.totalTables;
      validation.totalTablesMigrated = latestReport.successfulTables;
      validation.totalRecordsExpected = latestReport.totalRecords;
      validation.totalRecordsMigrated = latestReport.migratedRecords;
      validation.failedTables = latestReport.failedTables;

      // Determine if migration is completed successfully
      validation.migrationCompleted = 
        latestReport.status === 'COMPLETED' && 
        latestReport.failedTables.length === 0 &&
        latestReport.migratedRecords === latestReport.totalRecords;

      this.logger.log(`Migration completion status: ${validation.migrationCompleted ? 'COMPLETED' : 'INCOMPLETE'}`);
      this.logger.log(`Tables: ${validation.totalTablesMigrated}/${validation.totalTablesExpected}`);
      this.logger.log(`Records: ${validation.totalRecordsMigrated}/${validation.totalRecordsExpected}`);

      return validation;

    } catch (error) {
      this.logger.error(`Error validating migration completion: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate data integrity using comprehensive checks
   */
  private async validateDataIntegrity(sampleSize: number): Promise<IntegrityValidation> {
    this.logger.log('Validating data integrity with comprehensive checks');

    const integrityValidation: IntegrityValidation = {
      overallIntegrityScore: 0,
      recordCountValidation: { passed: false, details: {} },
      checksumValidation: { passed: false, details: {} },
      referentialIntegrityValidation: { passed: false, details: {} },
      constraintValidation: { passed: false, details: {} },
      dataTypeValidation: { passed: false, details: {} },
      sampleDataValidation: { passed: false, details: {} },
    };

    try {
      // Run comprehensive validation using MigrationValidatorService
      const validationResult: ValidationResult = await this.migrationValidator.validateMigration({
        sampleSize,
        checksumValidation: true,
        referentialIntegrityCheck: true,
        constraintValidation: true,
        dataTypeValidation: true,
        performanceMetrics: true,
        detailedReporting: true,
      });

      // Map validation results to integrity validation structure
      integrityValidation.overallIntegrityScore = validationResult.score;

      // Record count validation
      integrityValidation.recordCountValidation = {
        passed: validationResult.summary.recordCountMatches === validationResult.summary.totalTables,
        details: {
          totalTables: validationResult.summary.totalTables,
          matchingTables: validationResult.summary.recordCountMatches,
          mismatchedTables: validationResult.summary.totalTables - validationResult.summary.recordCountMatches,
        },
      };

      // Checksum validation
      integrityValidation.checksumValidation = {
        passed: validationResult.summary.checksumMatches === validationResult.summary.totalTables,
        details: {
          totalTables: validationResult.summary.totalTables,
          matchingChecksums: validationResult.summary.checksumMatches,
          mismatchedChecksums: validationResult.summary.totalTables - validationResult.summary.checksumMatches,
        },
      };

      // Referential integrity validation
      integrityValidation.referentialIntegrityValidation = {
        passed: validationResult.errors.filter(e => e.type === 'REFERENCE_ERROR').length === 0,
        details: {
          totalChecks: validationResult.summary.referentialIntegrityChecks,
          brokenReferences: validationResult.errors.filter(e => e.type === 'REFERENCE_ERROR').length,
        },
      };

      // Constraint validation
      integrityValidation.constraintValidation = {
        passed: validationResult.errors.filter(e => e.type === 'CONSTRAINT_VIOLATION').length === 0,
        details: {
          totalConstraints: validationResult.summary.constraintValidations,
          violatedConstraints: validationResult.errors.filter(e => e.type === 'CONSTRAINT_VIOLATION').length,
        },
      };

      // Data type validation
      integrityValidation.dataTypeValidation = {
        passed: validationResult.errors.filter(e => e.type === 'CORRUPTED_DATA' && e.column).length === 0,
        details: {
          totalColumns: validationResult.summary.dataTypeValidations,
          typeViolations: validationResult.errors.filter(e => e.type === 'CORRUPTED_DATA' && e.column).length,
        },
      };

      // Sample data validation
      integrityValidation.sampleDataValidation = {
        passed: validationResult.warnings.filter(w => w.type === 'DATA_MISMATCH').length === 0,
        details: {
          sampleSize,
          dataMismatches: validationResult.warnings.filter(w => w.type === 'DATA_MISMATCH').length,
        },
      };

      this.logger.log(`Data integrity validation completed with score: ${integrityValidation.overallIntegrityScore}%`);

      return integrityValidation;

    } catch (error) {
      this.logger.error(`Error validating data integrity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze performance metrics from migration
   */
  private async analyzePerformanceMetrics(): Promise<PerformanceMetrics> {
    this.logger.log('Analyzing migration performance metrics');

    const metrics: PerformanceMetrics = {
      migrationDuration: 0,
      averageRecordsPerSecond: 0,
      averageTablesPerSecond: 0,
      peakMemoryUsage: 0,
      databaseConnectionsUsed: 0,
      errorRate: 0,
      retryCount: 0,
    };

    try {
      // Get migration reports for performance analysis
      const migrationReports = await this.getMigrationReports();
      
      if (migrationReports.length === 0) {
        return metrics;
      }

      const latestReport = migrationReports[migrationReports.length - 1];
      
      if (latestReport.totalDuration) {
        metrics.migrationDuration = latestReport.totalDuration;
        
        const durationSeconds = latestReport.totalDuration / 1000;
        metrics.averageRecordsPerSecond = Math.round(latestReport.migratedRecords / durationSeconds);
        metrics.averageTablesPerSecond = Math.round(latestReport.totalTables / durationSeconds);
      }

      // Calculate error rate
      if (latestReport.totalRecords > 0) {
        metrics.errorRate = Math.round((latestReport.failedRecords / latestReport.totalRecords) * 100);
      }

      // Get additional metrics from system
      metrics.databaseConnectionsUsed = await this.getCurrentDatabaseConnections();
      metrics.peakMemoryUsage = await this.getPeakMemoryUsage();

      this.logger.log(`Performance metrics: ${metrics.averageRecordsPerSecond} records/sec, ${metrics.errorRate}% error rate`);

      return metrics;

    } catch (error) {
      this.logger.error(`Error analyzing performance metrics: ${error.message}`);
      return metrics;
    }
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(result: Phase2ValidationResult): Phase2ValidationSummary {
    const summary: Phase2ValidationSummary = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      criticalIssuesCount: result.criticalIssues.length,
      warningsCount: result.warnings.length,
      dataIntegrityScore: result.integrityValidation?.overallIntegrityScore || 0,
      migrationCompleteness: 0,
      recommendationsCount: result.recommendations.length,
    };

    // Count validations
    const validations = [
      result.dataMigrationValidation?.migrationCompleted,
      result.integrityValidation?.recordCountValidation.passed,
      result.integrityValidation?.checksumValidation.passed,
      result.integrityValidation?.referentialIntegrityValidation.passed,
      result.integrityValidation?.constraintValidation.passed,
      result.integrityValidation?.dataTypeValidation.passed,
      result.integrityValidation?.sampleDataValidation.passed,
    ].filter(v => v !== undefined);

    summary.totalValidations = validations.length;
    summary.passedValidations = validations.filter(v => v === true).length;
    summary.failedValidations = validations.filter(v => v === false).length;

    // Calculate migration completeness
    if (result.dataMigrationValidation) {
      const expected = result.dataMigrationValidation.totalRecordsExpected;
      const migrated = result.dataMigrationValidation.totalRecordsMigrated;
      summary.migrationCompleteness = expected > 0 ? Math.round((migrated / expected) * 100) : 0;
    }

    return summary;
  }

  /**
   * Calculate overall validation score
   */
  private calculateOverallScore(result: Phase2ValidationResult): number {
    let score = 100;

    // Deduct points for critical issues
    score -= result.criticalIssues.length * 20;

    // Deduct points for warnings
    score -= result.warnings.length * 5;

    // Factor in data integrity score
    if (result.integrityValidation) {
      score = Math.round((score + result.integrityValidation.overallIntegrityScore) / 2);
    }

    // Factor in migration completeness
    if (result.summary) {
      const completenessScore = result.summary.migrationCompleteness;
      score = Math.round((score + completenessScore) / 2);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine validation status based on results
   */
  private determineValidationStatus(result: Phase2ValidationResult): ValidationStatus {
    // Critical issues mean validation failed
    if (result.criticalIssues.length > 0) {
      return 'FAILED';
    }

    // Check if migration is completed
    if (!result.dataMigrationValidation?.migrationCompleted) {
      return 'FAILED';
    }

    // Check integrity validations
    if (result.integrityValidation) {
      const integrityChecks = [
        result.integrityValidation.recordCountValidation.passed,
        result.integrityValidation.checksumValidation.passed,
        result.integrityValidation.referentialIntegrityValidation.passed,
        result.integrityValidation.constraintValidation.passed,
        result.integrityValidation.dataTypeValidation.passed,
      ];

      const failedChecks = integrityChecks.filter(check => !check).length;
      
      if (failedChecks > 0) {
        return failedChecks > 2 ? 'FAILED' : 'PASSED_WITH_WARNINGS';
      }
    }

    // Check overall score
    if (result.overallScore < 70) {
      return 'FAILED';
    } else if (result.overallScore < 90 || result.warnings.length > 0) {
      return 'PASSED_WITH_WARNINGS';
    }

    return 'PASSED';
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(result: Phase2ValidationResult): ValidationRecommendation[] {
    const recommendations: ValidationRecommendation[] = [];

    // Migration completion recommendations
    if (!result.dataMigrationValidation?.migrationCompleted) {
      recommendations.push({
        type: 'CRITICAL',
        category: 'DATA_MIGRATION',
        title: 'Complete Data Migration',
        description: 'Data migration has not been completed successfully',
        action: 'Run the data migration process to completion',
        priority: 'HIGH',
      });
    }

    // Integrity validation recommendations
    if (result.integrityValidation) {
      if (!result.integrityValidation.recordCountValidation.passed) {
        recommendations.push({
          type: 'ERROR',
          category: 'DATA_INTEGRITY',
          title: 'Fix Record Count Mismatches',
          description: 'Some tables have record count mismatches between source and target',
          action: 'Review and re-migrate tables with record count discrepancies',
          priority: 'HIGH',
        });
      }

      if (!result.integrityValidation.checksumValidation.passed) {
        recommendations.push({
          type: 'ERROR',
          category: 'DATA_INTEGRITY',
          title: 'Fix Data Corruption Issues',
          description: 'Checksum validation failed indicating potential data corruption',
          action: 'Re-migrate tables with checksum mismatches and verify data integrity',
          priority: 'CRITICAL',
        });
      }

      if (!result.integrityValidation.referentialIntegrityValidation.passed) {
        recommendations.push({
          type: 'ERROR',
          category: 'DATA_INTEGRITY',
          title: 'Fix Referential Integrity Violations',
          description: 'Foreign key references are broken in the migrated data',
          action: 'Review and fix foreign key relationships in the target database',
          priority: 'HIGH',
        });
      }
    }

    // Performance recommendations
    if (result.performanceMetrics) {
      if (result.performanceMetrics.errorRate > 5) {
        recommendations.push({
          type: 'WARNING',
          category: 'PERFORMANCE',
          title: 'High Error Rate During Migration',
          description: `Migration error rate is ${result.performanceMetrics.errorRate}%`,
          action: 'Review migration logs and optimize migration process',
          priority: 'MEDIUM',
        });
      }

      if (result.performanceMetrics.averageRecordsPerSecond < 100) {
        recommendations.push({
          type: 'INFO',
          category: 'PERFORMANCE',
          title: 'Optimize Migration Performance',
          description: 'Migration performance could be improved',
          action: 'Consider increasing batch sizes or optimizing database connections',
          priority: 'LOW',
        });
      }
    }

    // General recommendations
    if (result.warnings.length > 10) {
      recommendations.push({
        type: 'WARNING',
        category: 'GENERAL',
        title: 'Review Validation Warnings',
        description: `${result.warnings.length} warnings were found during validation`,
        action: 'Review all warnings and address any that could impact data quality',
        priority: 'MEDIUM',
      });
    }

    return recommendations;
  }

  /**
   * Generate detailed validation report
   */
  private async generateDetailedReport(result: Phase2ValidationResult): Promise<string> {
    const report = [
      '# Phase 2 Checkpoint Validation Report - Data Migration',
      `Generated: ${new Date().toISOString()}`,
      `Validation ID: ${result.validationId}`,
      '',
      '## Executive Summary',
      `- **Overall Status**: ${result.status}`,
      `- **Overall Score**: ${result.overallScore}%`,
      `- **Duration**: ${result.totalDuration ? Math.round(result.totalDuration / 1000) : 0} seconds`,
      `- **Critical Issues**: ${result.criticalIssues.length}`,
      `- **Warnings**: ${result.warnings.length}`,
      `- **Recommendations**: ${result.recommendations.length}`,
      '',
    ];

    // Data Migration Status
    if (result.dataMigrationValidation) {
      const dm = result.dataMigrationValidation;
      report.push(
        '## Data Migration Status',
        `- **Migration Completed**: ${dm.migrationCompleted ? '✅ Yes' : '❌ No'}`,
        `- **Tables Migrated**: ${dm.totalTablesMigrated}/${dm.totalTablesExpected}`,
        `- **Records Migrated**: ${dm.totalRecordsMigrated}/${dm.totalRecordsExpected}`,
        `- **Failed Tables**: ${dm.failedTables.length}`,
        '',
      );

      if (dm.failedTables.length > 0) {
        report.push('### Failed Tables');
        for (const table of dm.failedTables) {
          report.push(`- **${table.tableName}**: ${table.error} (${table.recordCount} records)`);
        }
        report.push('');
      }
    }

    // Data Integrity Results
    if (result.integrityValidation) {
      const iv = result.integrityValidation;
      report.push(
        '## Data Integrity Validation',
        `- **Overall Integrity Score**: ${iv.overallIntegrityScore}%`,
        `- **Record Count Validation**: ${iv.recordCountValidation.passed ? '✅ Passed' : '❌ Failed'}`,
        `- **Checksum Validation**: ${iv.checksumValidation.passed ? '✅ Passed' : '❌ Failed'}`,
        `- **Referential Integrity**: ${iv.referentialIntegrityValidation.passed ? '✅ Passed' : '❌ Failed'}`,
        `- **Constraint Validation**: ${iv.constraintValidation.passed ? '✅ Passed' : '❌ Failed'}`,
        `- **Data Type Validation**: ${iv.dataTypeValidation.passed ? '✅ Passed' : '❌ Failed'}`,
        `- **Sample Data Validation**: ${iv.sampleDataValidation.passed ? '✅ Passed' : '❌ Failed'}`,
        '',
      );
    }

    // Performance Metrics
    if (result.performanceMetrics) {
      const pm = result.performanceMetrics;
      report.push(
        '## Performance Metrics',
        `- **Migration Duration**: ${Math.round(pm.migrationDuration / 1000)} seconds`,
        `- **Records per Second**: ${pm.averageRecordsPerSecond}`,
        `- **Tables per Second**: ${pm.averageTablesPerSecond}`,
        `- **Error Rate**: ${pm.errorRate}%`,
        `- **Database Connections**: ${pm.databaseConnectionsUsed}`,
        `- **Peak Memory Usage**: ${Math.round(pm.peakMemoryUsage / 1024 / 1024)} MB`,
        '',
      );
    }

    // Critical Issues
    if (result.criticalIssues.length > 0) {
      report.push('## Critical Issues');
      for (const issue of result.criticalIssues) {
        report.push(
          `### ${issue.type} - ${issue.severity}`,
          `**Message**: ${issue.message}`,
          `**Affected Tables**: ${issue.affectedTables.join(', ') || 'N/A'}`,
          `**Recommended Action**: ${issue.recommendedAction}`,
          '',
        );
      }
    }

    // Warnings
    if (result.warnings.length > 0) {
      report.push('## Warnings');
      for (const warning of result.warnings) {
        report.push(`- **${warning.severity}**: ${warning.message}`);
      }
      report.push('');
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      report.push('## Recommendations');
      for (const rec of result.recommendations) {
        report.push(
          `### ${rec.title} (${rec.priority} Priority)`,
          `**Category**: ${rec.category}`,
          `**Description**: ${rec.description}`,
          `**Action**: ${rec.action}`,
          '',
        );
      }
    }

    // Next Steps
    report.push(
      '## Next Steps',
      '',
      result.status === 'PASSED' 
        ? '✅ **Phase 2 validation passed successfully. You can proceed to Phase 3 - User Migration.**'
        : result.status === 'PASSED_WITH_WARNINGS'
        ? '⚠️ **Phase 2 validation passed with warnings. Review warnings before proceeding to Phase 3.**'
        : '❌ **Phase 2 validation failed. Address critical issues before proceeding.**',
      '',
      '### Recommended Actions:',
    );

    if (result.status === 'FAILED') {
      report.push(
        '1. Address all critical issues listed above',
        '2. Re-run data migration for failed tables',
        '3. Re-validate Phase 2 checkpoint',
        '4. Only proceed to Phase 3 after successful validation',
      );
    } else if (result.status === 'PASSED_WITH_WARNINGS') {
      report.push(
        '1. Review and address warnings if possible',
        '2. Document any accepted risks',
        '3. Proceed to Phase 3 - User Migration',
      );
    } else {
      report.push(
        '1. Proceed to Phase 3 - User Migration',
        '2. Continue monitoring data integrity',
      );
    }

    return report.join('\n');
  }

  // Helper methods
  private generateValidationId(): string {
    return `phase2_validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getMigrationReports(): Promise<MigrationReportSummary[]> {
    // This would typically query the migration logs or database
    // For now, return empty array - would be implemented based on actual log storage
    return [];
  }

  private async getCurrentDatabaseConnections(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;
      return parseInt((result as any)[0].connections);
    } catch (error) {
      return 0;
    }
  }

  private async getPeakMemoryUsage(): Promise<number> {
    // This would typically be monitored during migration
    // Return 0 for now - would be implemented with actual monitoring
    return 0;
  }

  /**
   * Ask user for validation and next steps
   */
  async promptUserForValidation(result: Phase2ValidationResult): Promise<void> {
    this.logger.log('Phase 2 checkpoint validation completed');
    
    // Generate interactive summary
    const interactiveSummary = this.userInteraction.generateInteractiveSummary(result);
    this.logger.log('\n' + interactiveSummary);
    
    // Create user prompt
    const userPrompt = this.userInteraction.createPhase2ValidationPrompt(result);
    
    this.logger.log('\n' + '='.repeat(60));
    this.logger.log('USER VALIDATION REQUIRED');
    this.logger.log('='.repeat(60));
    
    if (result.status === 'PASSED') {
      this.logger.log('🎉 PHASE 2 VALIDATION PASSED SUCCESSFULLY!');
      this.logger.log('');
      this.logger.log('✅ All data has been migrated correctly');
      this.logger.log('✅ Data integrity checks passed successfully');
      this.logger.log('✅ Migration reports are satisfactory');
      this.logger.log('✅ No critical issues found');
      this.logger.log('');
      this.logger.log('🚀 Ready to proceed to Phase 3 - User Migration and Authentication System');
      
    } else if (result.status === 'PASSED_WITH_WARNINGS') {
      this.logger.log('⚠️ PHASE 2 VALIDATION PASSED WITH WARNINGS');
      this.logger.log('');
      this.logger.log('✅ Data migration completed successfully');
      this.logger.log(`⚠️ Found ${result.warnings.length} warnings that should be reviewed`);
      this.logger.log('✅ No critical issues found');
      this.logger.log('');
      this.logger.log('📋 Please review the warnings before proceeding to Phase 3');
      
      if (result.warnings.length > 0) {
        this.logger.log('');
        this.logger.log('Warnings Summary:');
        for (const warning of result.warnings.slice(0, 5)) {
          this.logger.log(`  • ${warning.severity}: ${warning.message}`);
        }
        if (result.warnings.length > 5) {
          this.logger.log(`  • ... and ${result.warnings.length - 5} more warnings`);
        }
      }
      
    } else {
      this.logger.log('❌ PHASE 2 VALIDATION FAILED');
      this.logger.log('');
      this.logger.log(`❌ Found ${result.criticalIssues.length} critical issues`);
      this.logger.log(`⚠️ Found ${result.warnings.length} warnings`);
      this.logger.log('');
      this.logger.log('🚨 Critical issues must be resolved before proceeding to Phase 3');
      
      if (result.criticalIssues.length > 0) {
        this.logger.log('');
        this.logger.log('Critical Issues:');
        for (const issue of result.criticalIssues) {
          this.logger.log(`  • ${issue.type}: ${issue.message}`);
          this.logger.log(`    Action: ${issue.recommendedAction}`);
        }
      }
    }
    
    this.logger.log('');
    this.logger.log('Available Options:');
    for (const option of userPrompt.options) {
      const indicator = option.recommended ? '👉' : '  ';
      this.logger.log(`${indicator} ${option.title}: ${option.description}`);
    }
    
    if (result.recommendations.length > 0) {
      this.logger.log('');
      this.logger.log('💡 Recommendations:');
      for (const rec of result.recommendations.slice(0, 3)) {
        const priorityIcon = rec.priority === 'CRITICAL' ? '🚨' : 
                           rec.priority === 'HIGH' ? '⚠️' : 
                           rec.priority === 'MEDIUM' ? '💡' : 'ℹ️';
        this.logger.log(`  ${priorityIcon} ${rec.title}`);
        this.logger.log(`     ${rec.description}`);
        this.logger.log(`     Action: ${rec.action}`);
      }
      if (result.recommendations.length > 3) {
        this.logger.log(`  ... and ${result.recommendations.length - 3} more recommendations`);
      }
    }
    
    this.logger.log('');
    this.logger.log('='.repeat(60));
    
    // Log next steps based on status
    const nextSteps = this.getNextStepsForStatus(result.status);
    this.logger.log('🎯 NEXT STEPS:');
    for (const step of nextSteps) {
      this.logger.log(`  • ${step}`);
    }
    
    this.logger.log('');
    this.logger.log('Phase 2 checkpoint validation is complete.');
    this.logger.log('Please review the results and decide how to proceed.');
  }

  private getNextStepsForStatus(status: ValidationStatus): string[] {
    switch (status) {
      case 'PASSED':
        return [
          'Proceed to Phase 3 - User Migration',
          'Begin migrating users from auth.users table',
          'Set up NestJS authentication module',
          'Test user authentication with migrated accounts',
        ];
      case 'PASSED_WITH_WARNINGS':
        return [
          'Review all warnings and assess their impact',
          'Document any accepted risks if proceeding',
          'Proceed to Phase 3 if warnings are acceptable',
          'Consider addressing warnings before proceeding',
        ];
      case 'FAILED':
        return [
          'Address all critical issues identified',
          'Re-run data migration for failed tables',
          'Fix data integrity violations',
          'Re-validate Phase 2 checkpoint before proceeding',
        ];
      default:
        return ['Review validation status and take appropriate action'];
    }
  }
}