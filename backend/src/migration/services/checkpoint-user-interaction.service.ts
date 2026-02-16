import { Injectable, Logger } from '@nestjs/common';
import { MigrationLoggerService } from './migration-logger.service';
import {
  Phase2ValidationResult,
  UserValidationPrompt,
  UserValidationOption,
  UserValidationResponse,
  ValidationStatus,
} from '../types/checkpoint-validation.types';

@Injectable()
export class CheckpointUserInteractionService {
  private readonly logger = new Logger(CheckpointUserInteractionService.name);

  constructor(
    private migrationLogger: MigrationLoggerService,
  ) {}

  /**
   * Create user validation prompt based on Phase 2 results
   */
  createPhase2ValidationPrompt(result: Phase2ValidationResult): UserValidationPrompt {
    const prompt: UserValidationPrompt = {
      title: this.getPromptTitle(result.status),
      message: this.getPromptMessage(result),
      status: result.status,
      criticalIssues: result.criticalIssues,
      warnings: result.warnings,
      recommendations: result.recommendations,
      options: this.getValidationOptions(result.status),
    };

    return prompt;
  }

  /**
   * Process user validation response
   */
  async processUserResponse(
    validationId: string,
    response: UserValidationResponse
  ): Promise<{
    action: 'PROCEED' | 'RETRY' | 'INVESTIGATE' | 'ABORT';
    nextSteps: string[];
    requiresAction: boolean;
  }> {
    await this.migrationLogger.logInfo(
      'user_validation_response',
      'User responded to Phase 2 validation',
      {
        validationId,
        selectedOption: response.selectedOption,
        additionalNotes: response.additionalNotes,
        timestamp: response.timestamp,
      }
    );

    const option = this.getOptionById(response.selectedOption);
    
    if (!option) {
      throw new Error(`Invalid option selected: ${response.selectedOption}`);
    }

    const nextSteps = this.getNextSteps(option.action);
    const requiresAction = option.action !== 'PROCEED';

    this.logger.log(`User selected: ${option.title} (${option.action})`);
    
    return {
      action: option.action,
      nextSteps,
      requiresAction,
    };
  }

  /**
   * Generate interactive validation summary for user
   */
  generateInteractiveSummary(result: Phase2ValidationResult): string {
    const lines = [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                 PHASE 2 CHECKPOINT VALIDATION               ║',
      '║                    Data Migration Complete                   ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
    ];

    // Status indicator
    const statusIcon = this.getStatusIcon(result.status);
    const statusColor = this.getStatusColor(result.status);
    
    lines.push(`${statusIcon} Overall Status: ${result.status}`);
    lines.push(`📊 Overall Score: ${result.overallScore}%`);
    lines.push(`⏱️  Duration: ${result.totalDuration ? Math.round(result.totalDuration / 1000) : 0} seconds`);
    lines.push('');

    // Migration status
    if (result.dataMigrationValidation) {
      const dm = result.dataMigrationValidation;
      lines.push('📋 Data Migration Status:');
      lines.push(`   ${dm.migrationCompleted ? '✅' : '❌'} Migration Completed: ${dm.migrationCompleted ? 'YES' : 'NO'}`);
      lines.push(`   📊 Tables: ${dm.totalTablesMigrated}/${dm.totalTablesExpected}`);
      lines.push(`   📈 Records: ${dm.totalRecordsMigrated}/${dm.totalRecordsExpected}`);
      
      if (dm.failedTables.length > 0) {
        lines.push(`   ❌ Failed Tables: ${dm.failedTables.length}`);
        for (const table of dm.failedTables.slice(0, 3)) {
          lines.push(`      • ${table.tableName}: ${table.error}`);
        }
        if (dm.failedTables.length > 3) {
          lines.push(`      • ... and ${dm.failedTables.length - 3} more`);
        }
      }
      lines.push('');
    }

    // Integrity validation
    if (result.integrityValidation) {
      const iv = result.integrityValidation;
      lines.push('🔍 Data Integrity Validation:');
      lines.push(`   📊 Overall Integrity Score: ${iv.overallIntegrityScore}%`);
      lines.push(`   ${iv.recordCountValidation.passed ? '✅' : '❌'} Record Count Validation`);
      lines.push(`   ${iv.checksumValidation.passed ? '✅' : '❌'} Checksum Validation`);
      lines.push(`   ${iv.referentialIntegrityValidation.passed ? '✅' : '❌'} Referential Integrity`);
      lines.push(`   ${iv.constraintValidation.passed ? '✅' : '❌'} Constraint Validation`);
      lines.push(`   ${iv.dataTypeValidation.passed ? '✅' : '❌'} Data Type Validation`);
      lines.push(`   ${iv.sampleDataValidation.passed ? '✅' : '❌'} Sample Data Validation`);
      lines.push('');
    }

    // Performance metrics
    if (result.performanceMetrics) {
      const pm = result.performanceMetrics;
      lines.push('⚡ Performance Metrics:');
      lines.push(`   🚀 Records/Second: ${pm.averageRecordsPerSecond}`);
      lines.push(`   📊 Error Rate: ${pm.errorRate}%`);
      lines.push(`   🔗 DB Connections: ${pm.databaseConnectionsUsed}`);
      lines.push(`   💾 Peak Memory: ${Math.round(pm.peakMemoryUsage / 1024 / 1024)} MB`);
      lines.push('');
    }

    // Critical issues
    if (result.criticalIssues.length > 0) {
      lines.push('🚨 Critical Issues:');
      for (const issue of result.criticalIssues) {
        lines.push(`   ❌ ${issue.type}: ${issue.message}`);
        lines.push(`      Action: ${issue.recommendedAction}`);
      }
      lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('⚠️  Warnings:');
      for (const warning of result.warnings.slice(0, 5)) {
        lines.push(`   ⚠️  ${warning.severity}: ${warning.message}`);
      }
      if (result.warnings.length > 5) {
        lines.push(`   ... and ${result.warnings.length - 5} more warnings`);
      }
      lines.push('');
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      lines.push('💡 Recommendations:');
      for (const rec of result.recommendations.slice(0, 3)) {
        const priorityIcon = rec.priority === 'CRITICAL' ? '🚨' : 
                           rec.priority === 'HIGH' ? '⚠️' : 
                           rec.priority === 'MEDIUM' ? '💡' : 'ℹ️';
        lines.push(`   ${priorityIcon} ${rec.title}`);
        lines.push(`      ${rec.description}`);
        lines.push(`      Action: ${rec.action}`);
      }
      if (result.recommendations.length > 3) {
        lines.push(`   ... and ${result.recommendations.length - 3} more recommendations`);
      }
      lines.push('');
    }

    // Next steps
    lines.push('🎯 Next Steps:');
    const nextSteps = this.getNextStepsForStatus(result.status);
    for (const step of nextSteps) {
      lines.push(`   • ${step}`);
    }

    return lines.join('\n');
  }

  // Private helper methods

  private getPromptTitle(status: ValidationStatus): string {
    switch (status) {
      case 'PASSED':
        return '✅ Phase 2 Validation Passed - Ready for Phase 3';
      case 'PASSED_WITH_WARNINGS':
        return '⚠️ Phase 2 Validation Passed with Warnings';
      case 'FAILED':
        return '❌ Phase 2 Validation Failed - Action Required';
      case 'IN_PROGRESS':
        return '🔄 Phase 2 Validation In Progress';
      default:
        return '❓ Phase 2 Validation Status Unknown';
    }
  }

  private getPromptMessage(result: Phase2ValidationResult): string {
    const messages = [];

    if (result.status === 'PASSED') {
      messages.push('🎉 Excellent! All data migration validation checks have passed successfully.');
      messages.push('All data has been migrated correctly and integrity checks are satisfied.');
      messages.push('You can now proceed to Phase 3 - User Migration and Authentication System.');
    } else if (result.status === 'PASSED_WITH_WARNINGS') {
      messages.push('✅ Data migration validation passed, but some warnings were found.');
      messages.push(`Found ${result.warnings.length} warnings that should be reviewed.`);
      messages.push('You may proceed to Phase 3 after reviewing the warnings.');
    } else if (result.status === 'FAILED') {
      messages.push('❌ Data migration validation failed with critical issues.');
      messages.push(`Found ${result.criticalIssues.length} critical issues that must be resolved.`);
      messages.push('Please address these issues before proceeding to Phase 3.');
    }

    if (result.dataMigrationValidation && !result.dataMigrationValidation.migrationCompleted) {
      messages.push('⚠️ Data migration appears to be incomplete or failed.');
    }

    if (result.integrityValidation && result.integrityValidation.overallIntegrityScore < 90) {
      messages.push(`⚠️ Data integrity score is ${result.integrityValidation.overallIntegrityScore}% (below 90%).`);
    }

    return messages.join(' ');
  }

  private getValidationOptions(status: ValidationStatus): UserValidationOption[] {
    const baseOptions: UserValidationOption[] = [];

    switch (status) {
      case 'PASSED':
        baseOptions.push({
          id: 'proceed_phase3',
          title: 'Proceed to Phase 3',
          description: 'Continue with User Migration and Authentication System',
          action: 'PROCEED',
          recommended: true,
        });
        baseOptions.push({
          id: 'review_details',
          title: 'Review Validation Details',
          description: 'Examine detailed validation report before proceeding',
          action: 'INVESTIGATE',
        });
        break;

      case 'PASSED_WITH_WARNINGS':
        baseOptions.push({
          id: 'proceed_accept_warnings',
          title: 'Proceed Despite Warnings',
          description: 'Accept warnings and continue to Phase 3',
          action: 'PROCEED',
        });
        baseOptions.push({
          id: 'investigate_warnings',
          title: 'Investigate Warnings',
          description: 'Review warnings in detail before deciding',
          action: 'INVESTIGATE',
          recommended: true,
        });
        baseOptions.push({
          id: 'retry_validation',
          title: 'Retry Validation',
          description: 'Run validation again with different parameters',
          action: 'RETRY',
        });
        break;

      case 'FAILED':
        baseOptions.push({
          id: 'investigate_issues',
          title: 'Investigate Critical Issues',
          description: 'Review critical issues and plan remediation',
          action: 'INVESTIGATE',
          recommended: true,
        });
        baseOptions.push({
          id: 'retry_migration',
          title: 'Retry Data Migration',
          description: 'Re-run data migration to fix issues',
          action: 'RETRY',
        });
        baseOptions.push({
          id: 'abort_migration',
          title: 'Abort Migration Process',
          description: 'Stop migration and rollback to previous state',
          action: 'ABORT',
        });
        break;

      default:
        baseOptions.push({
          id: 'investigate_status',
          title: 'Investigate Status',
          description: 'Review validation status and logs',
          action: 'INVESTIGATE',
          recommended: true,
        });
    }

    return baseOptions;
  }

  private getOptionById(optionId: string): UserValidationOption | null {
    const allOptions = [
      { id: 'proceed_phase3', title: 'Proceed to Phase 3', description: '', action: 'PROCEED' as const },
      { id: 'proceed_accept_warnings', title: 'Proceed Despite Warnings', description: '', action: 'PROCEED' as const },
      { id: 'review_details', title: 'Review Validation Details', description: '', action: 'INVESTIGATE' as const },
      { id: 'investigate_warnings', title: 'Investigate Warnings', description: '', action: 'INVESTIGATE' as const },
      { id: 'investigate_issues', title: 'Investigate Critical Issues', description: '', action: 'INVESTIGATE' as const },
      { id: 'investigate_status', title: 'Investigate Status', description: '', action: 'INVESTIGATE' as const },
      { id: 'retry_validation', title: 'Retry Validation', description: '', action: 'RETRY' as const },
      { id: 'retry_migration', title: 'Retry Data Migration', description: '', action: 'RETRY' as const },
      { id: 'abort_migration', title: 'Abort Migration Process', description: '', action: 'ABORT' as const },
    ];

    return allOptions.find(option => option.id === optionId) || null;
  }

  private getNextSteps(action: 'PROCEED' | 'RETRY' | 'INVESTIGATE' | 'ABORT'): string[] {
    switch (action) {
      case 'PROCEED':
        return [
          'Continue to Phase 3 - User Migration and Authentication System',
          'Begin migrating users from auth.users table',
          'Set up NestJS authentication module',
          'Test user authentication with migrated accounts',
        ];
      case 'RETRY':
        return [
          'Review validation errors and warnings',
          'Fix identified issues in data migration',
          'Re-run data migration for failed tables',
          'Re-validate Phase 2 checkpoint',
        ];
      case 'INVESTIGATE':
        return [
          'Review detailed validation report',
          'Analyze critical issues and warnings',
          'Consult migration logs for more details',
          'Plan remediation strategy',
          'Decide on next course of action',
        ];
      case 'ABORT':
        return [
          'Stop all migration processes',
          'Initiate rollback to previous checkpoint',
          'Review migration strategy and approach',
          'Plan alternative migration path',
        ];
      default:
        return ['Review validation results and decide on next steps'];
    }
  }

  private getNextStepsForStatus(status: ValidationStatus): string[] {
    switch (status) {
      case 'PASSED':
        return [
          'Proceed to Phase 3 - User Migration',
          'Begin migrating users from auth.users',
          'Set up authentication system',
        ];
      case 'PASSED_WITH_WARNINGS':
        return [
          'Review warnings and assess impact',
          'Document accepted risks if proceeding',
          'Proceed to Phase 3 if warnings are acceptable',
        ];
      case 'FAILED':
        return [
          'Address all critical issues',
          'Re-run data migration for failed components',
          'Re-validate before proceeding',
        ];
      default:
        return ['Review validation status and take appropriate action'];
    }
  }

  private getStatusIcon(status: ValidationStatus): string {
    switch (status) {
      case 'PASSED': return '✅';
      case 'PASSED_WITH_WARNINGS': return '⚠️';
      case 'FAILED': return '❌';
      case 'IN_PROGRESS': return '🔄';
      default: return '❓';
    }
  }

  private getStatusColor(status: ValidationStatus): string {
    switch (status) {
      case 'PASSED': return 'green';
      case 'PASSED_WITH_WARNINGS': return 'yellow';
      case 'FAILED': return 'red';
      case 'IN_PROGRESS': return 'blue';
      default: return 'gray';
    }
  }
}