import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CheckpointValidatorService } from '../services/checkpoint-validator.service';
import { MigrationLoggerService } from '../services/migration-logger.service';
import * as readline from 'readline';

/**
 * Interactive script for Phase 2 Checkpoint Validation User Questions
 * 
 * This script runs the Phase 2 validation and then interactively asks
 * the user questions based on the validation results.
 */
async function runPhase2UserInteraction() {
  console.log('🤝 Phase 2 Checkpoint Validation - User Interaction');
  console.log('=' .repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const checkpointValidator = app.get(CheckpointValidatorService);
  const migrationLogger = app.get(MigrationLoggerService);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Set the current phase for logging context
    migrationLogger.setCurrentPhase('DATA_MIGRATED' as any);

    console.log('\n📊 Running Phase 2 checkpoint validation...');
    const validationResult = await checkpointValidator.validatePhase2Checkpoint();

    console.log(`\n✅ Validation completed with status: ${validationResult.status.toUpperCase()}`);
    
    // Display summary
    console.log('\n📋 VALIDATION SUMMARY:');
    console.log(`- Total Checks: ${validationResult.summary.totalChecks}`);
    console.log(`- Passed: ${validationResult.summary.passedChecks} ✅`);
    console.log(`- Failed: ${validationResult.summary.failedChecks} ❌`);
    console.log(`- Warnings: ${validationResult.summary.warningChecks} ⚠️`);
    console.log(`- Critical Issues: ${validationResult.summary.criticalIssues.length} 🚨`);

    // Show data migration details if available
    if (validationResult.validationResults.dataMigration) {
      const dm = validationResult.validationResults.dataMigration;
      console.log('\n🗄️ DATA MIGRATION DETAILS:');
      console.log(`- Tables: ${dm.migratedTables}/${dm.totalTables} migrated`);
      console.log(`- Records: ${dm.migratedRecords.toLocaleString()}/${dm.totalRecords.toLocaleString()} migrated`);
      
      if (dm.failedTables.length > 0) {
        console.log(`- Failed Tables: ${dm.failedTables.length}`);
        dm.failedTables.forEach(ft => {
          console.log(`  • ${ft.tableName}: ${ft.error}`);
        });
      }
      
      if (dm.recordDiscrepancies.length > 0) {
        console.log(`- Record Discrepancies: ${dm.recordDiscrepancies.length}`);
        dm.recordDiscrepancies.forEach(rd => {
          console.log(`  • ${rd.tableName}: ${rd.sourceCount} → ${rd.targetCount} (diff: ${rd.difference})`);
        });
      }
    }

    // Show integrity validation confidence
    if (validationResult.validationResults.integrityValidation?.confidenceScore) {
      const confidence = (validationResult.validationResults.integrityValidation.confidenceScore * 100).toFixed(1);
      console.log(`\n🔍 Integrity Validation Confidence: ${confidence}%`);
    }

    // Show critical issues
    if (validationResult.summary.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      validationResult.summary.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }

    // Show recommendations
    if (validationResult.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      validationResult.summary.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // Interactive Q&A based on validation results
    console.log('\n' + '=' .repeat(60));
    console.log('🤝 USER INTERACTION - Please answer the following questions:');
    console.log('=' .repeat(60));

    const userResponses: Record<string, string> = {};

    // Ask questions based on validation status
    if (validationResult.status === 'failed') {
      console.log('\n❌ The validation failed with critical issues.');
      
      userResponses.criticalIssuesReview = await askQuestion(rl, 
        '1. Would you like to review the detailed error reports? (yes/no): '
      );
      
      if (userResponses.criticalIssuesReview.toLowerCase() === 'yes') {
        console.log('\n📄 Detailed error reports would be displayed here...');
        // In a real implementation, this would show detailed error reports
      }

      userResponses.resolutionApproach = await askQuestion(rl,
        '2. How would you like to proceed?\n' +
        '   a) Attempt automatic resolution\n' +
        '   b) Manual intervention required\n' +
        '   c) Rollback to previous checkpoint\n' +
        '   Enter your choice (a/b/c): '
      );

      switch (userResponses.resolutionApproach.toLowerCase()) {
        case 'a':
          console.log('🤖 Automatic resolution would be attempted...');
          break;
        case 'b':
          console.log('👨‍💻 Manual intervention mode selected. Please review the issues and resolve them manually.');
          break;
        case 'c':
          console.log('🔄 Rollback to previous checkpoint would be initiated...');
          break;
        default:
          console.log('❓ Invalid choice. Manual intervention assumed.');
      }

    } else if (validationResult.status === 'warning') {
      console.log('\n⚠️ The validation completed with warnings.');
      
      if (validationResult.validationResults.dataMigration?.recordDiscrepancies.length > 0) {
        userResponses.viewDiscrepancies = await askQuestion(rl,
          '1. Some tables have record count discrepancies. Would you like to see the detailed comparison? (yes/no): '
        );
        
        if (userResponses.viewDiscrepancies.toLowerCase() === 'yes') {
          console.log('\n📊 RECORD DISCREPANCIES:');
          validationResult.validationResults.dataMigration.recordDiscrepancies.forEach(rd => {
            console.log(`- ${rd.tableName}:`);
            console.log(`  Source: ${rd.sourceCount} records`);
            console.log(`  Target: ${rd.targetCount} records`);
            console.log(`  Difference: ${rd.difference} records`);
          });
        }

        userResponses.rerunMigration = await askQuestion(rl,
          '2. Should we re-run the migration for tables with discrepancies? (yes/no): '
        );
        
        if (userResponses.rerunMigration.toLowerCase() === 'yes') {
          console.log('🔄 Re-running migration for affected tables would be initiated...');
        }
      }

      userResponses.proceedWithWarnings = await askQuestion(rl,
        '3. The validation completed with warnings. Are you comfortable proceeding to the next phase? (yes/no): '
      );

    } else if (validationResult.status === 'passed') {
      console.log('\n✅ The validation completed successfully!');
      
      userResponses.proceedToPhase3 = await askQuestion(rl,
        '1. Data migration validation completed successfully. Are you ready to proceed to Phase 3 (User Migration)? (yes/no): '
      );
    }

    // Additional questions based on confidence score
    if (validationResult.validationResults.integrityValidation?.confidenceScore < 0.98) {
      userResponses.improveConfidence = await askQuestion(rl,
        `2. The integrity validation confidence is ${((validationResult.validationResults.integrityValidation.confidenceScore || 0) * 100).toFixed(1)}%. Would you like to increase the sample size for better confidence? (yes/no): `
      );
      
      if (userResponses.improveConfidence.toLowerCase() === 'yes') {
        console.log('📈 Increasing sample size for validation would improve confidence...');
      }
    }

    // Final decision
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 FINAL DECISION');
    console.log('=' .repeat(60));

    let canProceed = false;
    let finalMessage = '';

    if (validationResult.status === 'passed') {
      if (userResponses.proceedToPhase3?.toLowerCase() === 'yes') {
        canProceed = true;
        finalMessage = '🚀 Proceeding to Phase 3: User Migration and Authentication System';
      } else {
        finalMessage = '⏸️ Staying in Phase 2 for further review';
      }
    } else if (validationResult.status === 'warning') {
      if (userResponses.proceedWithWarnings?.toLowerCase() === 'yes') {
        canProceed = true;
        finalMessage = '⚠️ Proceeding to Phase 3 with acknowledged warnings';
      } else {
        finalMessage = '🔧 Resolving warnings before proceeding to Phase 3';
      }
    } else {
      finalMessage = '🛠️ Critical issues must be resolved before proceeding';
    }

    console.log(`\n${finalMessage}`);

    // Log user responses for audit trail
    await migrationLogger.createAuditEntry(
      'phase2_user_interaction',
      'checkpoint_validation',
      canProceed ? 'success' : 'partial',
      {
        additionalDetails: {
          validationStatus: validationResult.status,
          userResponses,
          finalDecision: finalMessage,
          canProceedToPhase3: canProceed,
          timestamp: new Date().toISOString()
        }
      }
    );

    console.log('\n📝 User responses have been logged for audit purposes.');
    
    if (canProceed) {
      console.log('\n✅ Phase 2 checkpoint validation completed successfully!');
      console.log('🎉 Ready to begin Phase 3: User Migration and Authentication System');
    } else {
      console.log('\n⏳ Phase 2 checkpoint validation requires additional attention.');
      console.log('🔄 Please address the identified issues and re-run the validation.');
    }

  } catch (error) {
    console.error('\n❌ Phase 2 user interaction failed:', error.message);
    
    await migrationLogger.logCritical(
      'phase2_user_interaction',
      'Phase 2 user interaction failed',
      error,
      { interactionScript: 'phase2-user-interaction.ts' }
    );
  } finally {
    rl.close();
    await app.close();
  }
}

// Helper function to ask questions
function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Run the interactive script
if (require.main === module) {
  runPhase2UserInteraction().catch(console.error);
}

export { runPhase2UserInteraction };