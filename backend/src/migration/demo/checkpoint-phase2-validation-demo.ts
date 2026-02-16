import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { CheckpointPhase2ValidatorService } from '../services/checkpoint-phase2-validator.service';
import { Phase2ValidationOptions } from '../types/checkpoint-validation.types';

/**
 * Demo script for Phase 2 checkpoint validation
 * Demonstrates comprehensive validation of data migration completion and integrity
 */
async function runPhase2ValidationDemo() {
  const logger = new Logger('Phase2ValidationDemo');
  
  try {
    logger.log('🚀 Starting Phase 2 Checkpoint Validation Demo');
    logger.log('='.repeat(60));
    
    // Initialize NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const checkpointValidator = app.get(CheckpointPhase2ValidatorService);
    
    logger.log('📋 Phase 2 Checkpoint Validation - Data Migration');
    logger.log('This validation ensures that:');
    logger.log('  ✓ All data has been migrated correctly from Supabase');
    logger.log('  ✓ Data integrity checks pass successfully');
    logger.log('  ✓ Migration reports are satisfactory');
    logger.log('  ✓ No critical issues prevent proceeding to Phase 3');
    logger.log('');
    
    // Demo 1: Basic validation with default options
    logger.log('📊 Demo 1: Basic Phase 2 Validation');
    logger.log('-'.repeat(40));
    
    const basicOptions: Phase2ValidationOptions = {
      detailedReporting: true,
      sampleSize: 50,
    };
    
    try {
      const basicResult = await checkpointValidator.validatePhase2Checkpoint(basicOptions);
      
      logger.log(`✅ Basic validation completed`);
      logger.log(`   Status: ${basicResult.status}`);
      logger.log(`   Overall Score: ${basicResult.overallScore}%`);
      logger.log(`   Critical Issues: ${basicResult.criticalIssues.length}`);
      logger.log(`   Warnings: ${basicResult.warnings.length}`);
      logger.log(`   Duration: ${basicResult.totalDuration ? Math.round(basicResult.totalDuration / 1000) : 0}s`);
      
      if (basicResult.dataMigrationValidation) {
        const dm = basicResult.dataMigrationValidation;
        logger.log(`   Migration Status: ${dm.migrationCompleted ? 'COMPLETED' : 'INCOMPLETE'}`);
        logger.log(`   Tables: ${dm.totalTablesMigrated}/${dm.totalTablesExpected}`);
        logger.log(`   Records: ${dm.totalRecordsMigrated}/${dm.totalRecordsExpected}`);
      }
      
      if (basicResult.integrityValidation) {
        const iv = basicResult.integrityValidation;
        logger.log(`   Integrity Score: ${iv.overallIntegrityScore}%`);
        logger.log(`   Record Count Check: ${iv.recordCountValidation.passed ? 'PASSED' : 'FAILED'}`);
        logger.log(`   Checksum Check: ${iv.checksumValidation.passed ? 'PASSED' : 'FAILED'}`);
        logger.log(`   Referential Integrity: ${iv.referentialIntegrityValidation.passed ? 'PASSED' : 'FAILED'}`);
      }
      
    } catch (error) {
      logger.error(`❌ Basic validation failed: ${error.message}`);
    }
    
    logger.log('');
    
    // Demo 2: Comprehensive validation with all checks
    logger.log('🔍 Demo 2: Comprehensive Validation with All Checks');
    logger.log('-'.repeat(50));
    
    const comprehensiveOptions: Phase2ValidationOptions = {
      skipIntegrityValidation: false,
      skipPerformanceAnalysis: false,
      detailedReporting: true,
      sampleSize: 100,
      generateReport: true,
    };
    
    try {
      const comprehensiveResult = await checkpointValidator.validatePhase2Checkpoint(comprehensiveOptions);
      
      logger.log(`✅ Comprehensive validation completed`);
      logger.log(`   Status: ${comprehensiveResult.status}`);
      logger.log(`   Overall Score: ${comprehensiveResult.overallScore}%`);
      
      if (comprehensiveResult.summary) {
        const summary = comprehensiveResult.summary;
        logger.log(`   Validations: ${summary.passedValidations}/${summary.totalValidations} passed`);
        logger.log(`   Migration Completeness: ${summary.migrationCompleteness}%`);
        logger.log(`   Data Integrity Score: ${summary.dataIntegrityScore}%`);
      }
      
      if (comprehensiveResult.performanceMetrics) {
        const pm = comprehensiveResult.performanceMetrics;
        logger.log(`   Performance Metrics:`);
        logger.log(`     - Records/sec: ${pm.averageRecordsPerSecond}`);
        logger.log(`     - Error Rate: ${pm.errorRate}%`);
        logger.log(`     - DB Connections: ${pm.databaseConnectionsUsed}`);
      }
      
      if (comprehensiveResult.recommendations.length > 0) {
        logger.log(`   Recommendations: ${comprehensiveResult.recommendations.length}`);
        for (const rec of comprehensiveResult.recommendations.slice(0, 3)) {
          logger.log(`     - ${rec.priority}: ${rec.title}`);
        }
      }
      
      // Show detailed report if available
      if (comprehensiveResult.detailedReport) {
        logger.log('');
        logger.log('📄 Detailed Validation Report:');
        logger.log('='.repeat(60));
        logger.log(comprehensiveResult.detailedReport);
      }
      
    } catch (error) {
      logger.error(`❌ Comprehensive validation failed: ${error.message}`);
    }
    
    logger.log('');
    
    // Demo 3: Fast validation (skip intensive checks)
    logger.log('⚡ Demo 3: Fast Validation (Skip Intensive Checks)');
    logger.log('-'.repeat(45));
    
    const fastOptions: Phase2ValidationOptions = {
      skipIntegrityValidation: true,
      skipPerformanceAnalysis: true,
      detailedReporting: false,
      sampleSize: 10,
      generateReport: false,
    };
    
    try {
      const fastResult = await checkpointValidator.validatePhase2Checkpoint(fastOptions);
      
      logger.log(`✅ Fast validation completed`);
      logger.log(`   Status: ${fastResult.status}`);
      logger.log(`   Overall Score: ${fastResult.overallScore}%`);
      logger.log(`   Duration: ${fastResult.totalDuration ? Math.round(fastResult.totalDuration / 1000) : 0}s`);
      
      if (fastResult.dataMigrationValidation) {
        const dm = fastResult.dataMigrationValidation;
        logger.log(`   Migration Completed: ${dm.migrationCompleted ? 'YES' : 'NO'}`);
        if (dm.failedTables.length > 0) {
          logger.log(`   Failed Tables: ${dm.failedTables.length}`);
        }
      }
      
    } catch (error) {
      logger.error(`❌ Fast validation failed: ${error.message}`);
    }
    
    logger.log('');
    
    // Demo 4: Validation status interpretation
    logger.log('📋 Demo 4: Validation Status Interpretation');
    logger.log('-'.repeat(42));
    
    logger.log('Validation Status Meanings:');
    logger.log('  ✅ PASSED: All validations passed, ready for Phase 3');
    logger.log('  ⚠️  PASSED_WITH_WARNINGS: Minor issues found, review recommended');
    logger.log('  ❌ FAILED: Critical issues found, must be resolved before Phase 3');
    logger.log('  🔄 IN_PROGRESS: Validation is still running');
    logger.log('');
    
    logger.log('Next Steps Based on Status:');
    logger.log('  PASSED → Proceed to Phase 3 - User Migration');
    logger.log('  PASSED_WITH_WARNINGS → Review warnings, then proceed');
    logger.log('  FAILED → Fix critical issues, re-run validation');
    logger.log('');
    
    // Demo 5: User interaction simulation
    logger.log('👤 Demo 5: User Interaction Simulation');
    logger.log('-'.repeat(38));
    
    logger.log('Simulating user validation prompt...');
    
    // Create a mock result for demonstration
    const mockResult = {
      validationId: 'demo_validation_123',
      phase: 'data_migrated' as const,
      status: 'PASSED_WITH_WARNINGS' as const,
      startTime: new Date(),
      endTime: new Date(),
      totalDuration: 45000,
      overallScore: 85,
      criticalIssues: [],
      warnings: [
        {
          type: 'DATA_MISMATCH' as const,
          severity: 'MEDIUM' as const,
          message: 'Minor timestamp differences found in 3 records',
          table: 'affaires',
        }
      ],
      recommendations: [
        {
          type: 'WARNING' as const,
          category: 'DATA_INTEGRITY' as const,
          title: 'Review Timestamp Differences',
          description: 'Some records have minor timestamp differences',
          action: 'Review and accept if differences are acceptable',
          priority: 'MEDIUM' as const,
        }
      ],
    };
    
    await checkpointValidator.promptUserForValidation(mockResult);
    
    logger.log('');
    logger.log('🎉 Phase 2 Checkpoint Validation Demo Completed!');
    logger.log('='.repeat(60));
    logger.log('');
    logger.log('Summary of Demo Features:');
    logger.log('  ✓ Basic validation with essential checks');
    logger.log('  ✓ Comprehensive validation with all features');
    logger.log('  ✓ Fast validation for quick checks');
    logger.log('  ✓ Status interpretation and next steps');
    logger.log('  ✓ User interaction and prompting');
    logger.log('');
    logger.log('The Phase 2 checkpoint validation ensures that:');
    logger.log('  • All data migration is completed successfully');
    logger.log('  • Data integrity is maintained across all tables');
    logger.log('  • Performance metrics are within acceptable ranges');
    logger.log('  • Critical issues are identified and reported');
    logger.log('  • Clear recommendations are provided for next steps');
    logger.log('');
    logger.log('Ready to proceed to Phase 3 - User Migration! 🚀');
    
    await app.close();
    
  } catch (error) {
    logger.error(`❌ Demo failed: ${error.message}`, error.stack);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runPhase2ValidationDemo().catch(console.error);
}

export { runPhase2ValidationDemo };