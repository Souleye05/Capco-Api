import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CheckpointValidatorService } from '../services/checkpoint-validator.service';
import { MigrationLoggerService } from '../services/migration-logger.service';

/**
 * Demo script for Phase 2 Checkpoint Validation
 * 
 * This script demonstrates the comprehensive validation of data migration
 * including integrity checks, performance analysis, and user interaction.
 */
async function runPhase2CheckpointDemo() {
  console.log('🚀 Starting Phase 2 Checkpoint Validation Demo');
  console.log('=' .repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const checkpointValidator = app.get(CheckpointValidatorService);
  const migrationLogger = app.get(MigrationLoggerService);

  try {
    // Set the current phase for logging context
    migrationLogger.setCurrentPhase('DATA_MIGRATED' as any);

    console.log('\n📊 Phase 2: Data Migration Checkpoint Validation');
    console.log('This checkpoint validates that all data has been migrated correctly');
    console.log('with comprehensive integrity validation and performance analysis.\n');

    // Start the validation process
    console.log('⏳ Starting comprehensive validation...');
    const validationResult = await checkpointValidator.validatePhase2Checkpoint();

    // Display results
    console.log('\n📋 VALIDATION RESULTS');
    console.log('=' .repeat(40));
    console.log(`Status: ${getStatusEmoji(validationResult.status)} ${validationResult.status.toUpperCase()}`);
    console.log(`Phase: ${validationResult.phase}`);
    console.log(`Duration: ${formatDuration(validationResult.startTime, validationResult.endTime)}`);
    console.log(`Can Proceed to Next Phase: ${validationResult.canProceedToNextPhase ? '✅ Yes' : '❌ No'}`);

    // Display summary
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=' .repeat(40));
    console.log(`Total Checks: ${validationResult.summary.totalChecks}`);
    console.log(`Passed: ${validationResult.summary.passedChecks} ✅`);
    console.log(`Failed: ${validationResult.summary.failedChecks} ❌`);
    console.log(`Warnings: ${validationResult.summary.warningChecks} ⚠️`);

    // Display data migration status
    if (validationResult.validationResults.dataMigration) {
      const dataMigration = validationResult.validationResults.dataMigration;
      console.log('\n🗄️ DATA MIGRATION STATUS');
      console.log('=' .repeat(40));
      console.log(`Total Tables: ${dataMigration.totalTables}`);
      console.log(`Migrated Tables: ${dataMigration.migratedTables}`);
      console.log(`Failed Tables: ${dataMigration.failedTables.length}`);
      console.log(`Total Records: ${dataMigration.totalRecords.toLocaleString()}`);
      console.log(`Migrated Records: ${dataMigration.migratedRecords.toLocaleString()}`);
      
      if (dataMigration.recordDiscrepancies.length > 0) {
        console.log('\n⚠️ RECORD DISCREPANCIES:');
        dataMigration.recordDiscrepancies.forEach(discrepancy => {
          console.log(`  - ${discrepancy.tableName}: ${discrepancy.sourceCount} → ${discrepancy.targetCount} (diff: ${discrepancy.difference})`);
        });
      }

      if (dataMigration.failedTables.length > 0) {
        console.log('\n❌ FAILED TABLES:');
        dataMigration.failedTables.forEach(failed => {
          console.log(`  - ${failed.tableName}: ${failed.error}`);
        });
      }
    }

    // Display integrity validation
    if (validationResult.validationResults.integrityValidation) {
      const integrity = validationResult.validationResults.integrityValidation;
      console.log('\n🔍 INTEGRITY VALIDATION');
      console.log('=' .repeat(40));
      console.log(`Confidence Score: ${((integrity.confidenceScore || 0) * 100).toFixed(1)}%`);
      console.log(`Validation Checks: ${integrity.totalChecks}`);
      console.log(`Passed: ${integrity.passedChecks} ✅`);
      console.log(`Failed: ${integrity.failedChecks} ❌`);
    }

    // Display performance metrics
    if (validationResult.validationResults.performanceMetrics) {
      const performance = validationResult.validationResults.performanceMetrics;
      console.log('\n⚡ PERFORMANCE METRICS');
      console.log('=' .repeat(40));
      if (performance.performanceSummary) {
        console.log(`Total Duration: ${formatMilliseconds(performance.performanceSummary.totalDuration)}`);
        console.log(`Records/Second: ${performance.performanceSummary.averageRecordsPerSecond.toFixed(2)}`);
        console.log(`Tables/Minute: ${performance.performanceSummary.averageTablesPerMinute.toFixed(2)}`);
        console.log(`Memory Usage: ${formatBytes(performance.performanceSummary.memoryUsage.heapUsed)}`);
      }
    }

    // Display critical issues
    if (validationResult.summary.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES');
      console.log('=' .repeat(40));
      validationResult.summary.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
        console.log(`   ${issue.message}`);
        if (issue.details) {
          console.log(`   Details: ${JSON.stringify(issue.details, null, 2)}`);
        }
      });
    }

    // Display recommendations
    if (validationResult.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('=' .repeat(40));
      validationResult.summary.recommendations.forEach((recommendation, index) => {
        console.log(`${index + 1}. ${recommendation}`);
      });
    }

    // Display user questions
    if (validationResult.userQuestions.length > 0) {
      console.log('\n❓ USER QUESTIONS');
      console.log('=' .repeat(40));
      console.log('The following questions require your attention:');
      validationResult.userQuestions.forEach((question, index) => {
        console.log(`${index + 1}. ${question}`);
      });
    }

    // Final status
    console.log('\n🎯 CHECKPOINT VALIDATION COMPLETE');
    console.log('=' .repeat(60));
    
    if (validationResult.status === 'passed') {
      console.log('✅ All validations passed successfully!');
      console.log('🚀 Ready to proceed to Phase 3: User Migration and Authentication System');
    } else if (validationResult.status === 'warning') {
      console.log('⚠️ Validation completed with warnings.');
      console.log('📋 Please review the issues and recommendations above.');
      console.log('🤔 Determine if the warnings are acceptable for your use case.');
    } else {
      console.log('❌ Validation failed with critical issues.');
      console.log('🛠️ Please resolve the critical issues before proceeding.');
      console.log('🔄 Consider running a rollback if data integrity cannot be guaranteed.');
    }

    console.log('\n📊 Detailed validation logs have been saved to the migration logs.');
    console.log('🔍 Check the audit trail for compliance and troubleshooting information.');

  } catch (error) {
    console.error('\n❌ Phase 2 checkpoint validation failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    await migrationLogger.logCritical(
      'checkpoint_validation_demo',
      'Phase 2 checkpoint validation demo failed',
      error,
      { demoScript: 'checkpoint-phase2-demo.ts' }
    );
  } finally {
    await app.close();
  }
}

// Helper functions
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'passed': return '✅';
    case 'warning': return '⚠️';
    case 'failed': return '❌';
    case 'in_progress': return '⏳';
    default: return '❓';
  }
}

function formatDuration(startTime: Date, endTime: Date | null): string {
  if (!endTime) return 'In progress...';
  const duration = endTime.getTime() - startTime.getTime();
  return formatMilliseconds(duration);
}

function formatMilliseconds(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the demo
if (require.main === module) {
  runPhase2CheckpointDemo().catch(console.error);
}

export { runPhase2CheckpointDemo };