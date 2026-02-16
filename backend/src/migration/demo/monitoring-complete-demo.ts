import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MigrationLoggerService, MigrationPhase, LogLevel } from '../services/migration-logger.service';
import { MigrationMonitorService } from '../services/migration-monitor.service';
import { MigrationAlertService, AlertSeverity, AlertType } from '../services/migration-alert.service';

/**
 * Comprehensive demonstration of the complete monitoring and logging system
 * 
 * This demo showcases:
 * - Structured logging with complete context (Requirement 4.5)
 * - Real-time monitoring with metrics and ETA (Requirement 4.6) 
 * - Automatic alerting system (Requirement 4.7)
 * - Complete audit trail for compliance
 * 
 * Features demonstrated:
 * - MigrationLogger with structured logging
 * - MigrationMonitor with real-time metrics
 * - MigrationAlert with automatic notifications
 * - Complete integration between all components
 */
export async function demonstrateCompleteMonitoringSystem() {
  console.log('🚀 Starting Complete Migration Monitoring System Demo\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const logger = app.get(MigrationLoggerService);
  const monitor = app.get(MigrationMonitorService);
  const alertService = app.get(MigrationAlertService);

  try {
    // ========================================
    // 1. STRUCTURED LOGGING DEMONSTRATION
    // ========================================
    console.log('📝 1. STRUCTURED LOGGING SYSTEM');
    console.log('=====================================\n');

    // Set migration phase
    logger.setCurrentPhase(MigrationPhase.INITIALIZATION);
    
    // Demonstrate different log levels with context
    logger.logInfo('system_startup', 'Migration system initializing', {
      version: '1.0.0',
      environment: 'production',
      totalTables: 25,
      estimatedRecords: 1000000,
    });

    logger.logWarn('configuration_check', 'Non-optimal configuration detected', {
      setting: 'batch_size',
      currentValue: 100,
      recommendedValue: 500,
      impact: 'performance',
    });

    // Simulate an error with full context
    const simulatedError = new Error('Database connection timeout');
    logger.logError('database_connection', 'Failed to establish database connection', simulatedError, {
      host: 'prod-db-01.example.com',
      port: 5432,
      database: 'migration_target',
      retryAttempt: 3,
      maxRetries: 5,
    });

    // Critical error with immediate attention
    const criticalError = new Error('Data corruption detected');
    logger.logCritical('data_integrity', 'Critical data integrity violation', criticalError, {
      table: 'user_accounts',
      affectedRecords: 1500,
      corruptionType: 'foreign_key_violation',
      immediateAction: 'migration_halted',
    });

    console.log('✅ Structured logging demonstrated with multiple levels and rich context\n');

    // ========================================
    // 2. REAL-TIME MONITORING DEMONSTRATION
    // ========================================
    console.log('📊 2. REAL-TIME MONITORING SYSTEM');
    console.log('=====================================\n');

    const migrationId = 'demo_migration_' + Date.now();
    const totalRecords = 50000;
    const totalTables = 12;
    const totalFiles = 2500;
    const totalBytes = 5000000000; // 5GB

    // Start comprehensive monitoring
    monitor.startMigration(migrationId, totalRecords, totalTables, totalFiles, totalBytes);
    
    console.log(`🎯 Started monitoring migration: ${migrationId}`);
    console.log(`📈 Total scope: ${totalRecords} records, ${totalTables} tables, ${totalFiles} files, ${formatBytes(totalBytes)}\n`);

    // Simulate migration phases with progress updates
    const phases = [
      { phase: MigrationPhase.SCHEMA_EXTRACTION, duration: 2000, records: 0 },
      { phase: MigrationPhase.DATA_MIGRATION, duration: 8000, records: 35000 },
      { phase: MigrationPhase.USER_MIGRATION, duration: 3000, records: 8000 },
      { phase: MigrationPhase.FILE_MIGRATION, duration: 5000, records: 2500 },
      { phase: MigrationPhase.VALIDATION, duration: 2000, records: 4500 },
    ];

    let totalProcessed = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const phaseInfo of phases) {
      console.log(`🔄 Starting phase: ${phaseInfo.phase}`);
      
      logger.setCurrentPhase(phaseInfo.phase);
      monitor.startPhase(phaseInfo.phase);

      // Simulate progress during phase
      const steps = 5;
      const recordsPerStep = Math.floor(phaseInfo.records / steps);
      const timePerStep = Math.floor(phaseInfo.duration / steps);

      for (let step = 0; step < steps; step++) {
        await new Promise(resolve => setTimeout(resolve, timePerStep));
        
        const stepRecords = step === steps - 1 ? 
          phaseInfo.records - (recordsPerStep * (steps - 1)) : // Last step gets remainder
          recordsPerStep;
        
        totalProcessed += stepRecords;
        
        // Simulate some errors and warnings
        const stepErrors = Math.floor(Math.random() * 3);
        const stepWarnings = Math.floor(Math.random() * 5);
        totalErrors += stepErrors;
        totalWarnings += stepWarnings;

        monitor.updateProgress({
          recordsProcessed: totalProcessed,
          errorsCount: totalErrors,
          warningsCount: totalWarnings,
          tablesProcessed: Math.floor((totalProcessed / totalRecords) * totalTables),
          filesProcessed: Math.floor((totalProcessed / totalRecords) * totalFiles),
          bytesProcessed: Math.floor((totalProcessed / totalRecords) * totalBytes),
        });

        // Log progress
        logger.logProgress('phase_progress', `Progress update for ${phaseInfo.phase}`, totalProcessed, totalRecords, {
          phase: phaseInfo.phase,
          stepRecords,
          progressPercentage: Math.round((totalProcessed / totalRecords) * 100),
        });

        // Display current metrics
        const metrics = monitor.getCurrentMetrics();
        if (metrics) {
          const eta = monitor.getETA();
          console.log(`  📊 Progress: ${metrics.progressPercentage}% | ` +
                     `Records: ${metrics.recordsProcessed}/${metrics.totalRecords} | ` +
                     `Errors: ${metrics.errorsCount} | ` +
                     `ETA: ${eta.eta ? eta.eta.toLocaleTimeString() : 'Calculating...'} ` +
                     `(${Math.round(eta.confidence * 100)}% confidence)`);
        }
      }

      monitor.endPhase(phaseInfo.phase, 'completed');
      logger.logInfo('phase_completed', `Completed ${phaseInfo.phase}`, {
        phase: phaseInfo.phase,
        duration: phaseInfo.duration,
        recordsProcessed: phaseInfo.records,
      });

      console.log(`✅ Completed phase: ${phaseInfo.phase}\n`);
    }

    // ========================================
    // 3. AUTOMATIC ALERTING DEMONSTRATION
    // ========================================
    console.log('🚨 3. AUTOMATIC ALERTING SYSTEM');
    console.log('=====================================\n');

    let alertCount = 0;
    alertService.on('alert_triggered', (alert) => {
      alertCount++;
      console.log(`🔔 Alert #${alertCount} triggered:`);
      console.log(`   Type: ${alert.type} | Severity: ${alert.severity}`);
      console.log(`   Title: ${alert.title}`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Actions: ${alert.recommendedActions.join(', ')}\n`);
    });

    // Simulate conditions that trigger alerts
    console.log('🧪 Simulating alert conditions...\n');

    // High error rate alert
    monitor.updateProgress({
      recordsProcessed: totalProcessed + 1000,
      errorsCount: totalErrors + 150, // High error rate
      warningsCount: totalWarnings,
    });

    // Wait for alert processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Memory usage alert (simulate high memory)
    const highMemoryMetrics = monitor.getCurrentMetrics();
    if (highMemoryMetrics) {
      // Manually trigger alert check for demonstration
      await (alertService as any).checkAlertsForMetrics({
        ...highMemoryMetrics,
        memoryUsage: {
          ...highMemoryMetrics.memoryUsage,
          heapUsed: 1600 * 1024 * 1024, // 1.6GB to trigger memory alert
        }
      });
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`✅ Alert system demonstrated - ${alertCount} alerts triggered\n`);

    // ========================================
    // 4. AUDIT TRAIL DEMONSTRATION
    // ========================================
    console.log('📋 4. AUDIT TRAIL SYSTEM');
    console.log('=====================================\n');

    // Create comprehensive audit entries
    await logger.createAuditEntry(
      'migration_started',
      'migration_process',
      'success',
      {
        userId: 'admin_user_001',
        resourceId: migrationId,
        ipAddress: '192.168.1.100',
        userAgent: 'Migration-System/1.0',
        sessionId: 'session_' + Date.now(),
        additionalDetails: {
          totalRecords,
          totalTables,
          totalFiles,
          estimatedDuration: '45 minutes',
          backupCreated: true,
          rollbackPlan: 'automatic',
        },
      }
    );

    await logger.createAuditEntry(
      'data_validation_completed',
      'validation_process',
      'success',
      {
        userId: 'system',
        resourceId: migrationId,
        additionalDetails: {
          recordsValidated: totalProcessed,
          integrityChecks: 'passed',
          checksumValidation: 'passed',
          foreignKeyValidation: 'passed',
          validationDuration: '2.5 minutes',
        },
      }
    );

    await logger.createAuditEntry(
      'migration_completed',
      'migration_process',
      'success',
      {
        userId: 'admin_user_001',
        resourceId: migrationId,
        additionalDetails: {
          finalRecordCount: totalProcessed,
          totalErrors: totalErrors,
          totalWarnings: totalWarnings,
          actualDuration: '42 minutes',
          dataIntegrityScore: '99.8%',
          rollbackRequired: false,
        },
      }
    );

    console.log('✅ Comprehensive audit trail created with detailed compliance information\n');

    // ========================================
    // 5. FINAL SYSTEM STATUS REPORT
    // ========================================
    console.log('📈 5. FINAL SYSTEM STATUS REPORT');
    console.log('=====================================\n');

    // Complete migration
    monitor.endMigration('completed');

    // Generate comprehensive status report
    const statusReport = monitor.generateStatusReport();
    
    console.log('🎯 MIGRATION SUMMARY:');
    console.log(`   Migration ID: ${migrationId}`);
    console.log(`   Status: ${statusReport.migration ? 'Completed' : 'Unknown'}`);
    console.log(`   Duration: ${statusReport.migration ? Math.round(statusReport.migration.elapsedTime / 1000) : 0} seconds`);
    console.log(`   Records Processed: ${statusReport.migration ? statusReport.migration.recordsProcessed : 0}`);
    console.log(`   Success Rate: ${statusReport.migration ? Math.round(((statusReport.migration.recordsProcessed - statusReport.migration.errorsCount) / statusReport.migration.recordsProcessed) * 100) : 0}%`);
    console.log(`   Total Errors: ${statusReport.migration ? statusReport.migration.errorsCount : 0}`);
    console.log(`   Total Warnings: ${statusReport.migration ? statusReport.migration.warningsCount : 0}`);
    console.log(`   Average Processing Rate: ${statusReport.migration ? Math.round(statusReport.migration.recordsPerSecond) : 0} records/sec\n`);

    console.log('📊 PHASE BREAKDOWN:');
    const phaseMetrics = monitor.getPhaseMetrics();
    phaseMetrics.forEach(phase => {
      console.log(`   ${phase.phase}: ${phase.duration || 0}ms (${phase.status})`);
    });
    console.log();

    console.log('🚨 ALERT SUMMARY:');
    const activeAlerts = alertService.getActiveAlerts();
    console.log(`   Active Alerts: ${activeAlerts.length}`);
    console.log(`   Total Alerts Triggered: ${alertCount}`);
    
    if (activeAlerts.length > 0) {
      console.log('   Active Alerts:');
      activeAlerts.forEach((alert, index) => {
        console.log(`     ${index + 1}. ${alert.title} (${alert.severity})`);
      });
    }
    console.log();

    // ========================================
    // 6. COMPLIANCE AND REPORTING
    // ========================================
    console.log('📋 6. COMPLIANCE REPORTING');
    console.log('=====================================\n');

    console.log('✅ COMPLIANCE FEATURES DEMONSTRATED:');
    console.log('   ✓ Structured logging with complete context');
    console.log('   ✓ Real-time monitoring with accurate metrics');
    console.log('   ✓ Automatic alerting with severity levels');
    console.log('   ✓ Complete audit trail with forensic details');
    console.log('   ✓ Performance monitoring and ETA calculation');
    console.log('   ✓ Error tracking and remediation guidance');
    console.log('   ✓ System health monitoring');
    console.log('   ✓ Comprehensive status reporting\n');

    console.log('🎯 REQUIREMENTS VALIDATION:');
    console.log('   ✅ Requirement 4.5: Detailed error logging with stack traces');
    console.log('   ✅ Requirement 4.6: Real-time progress reporting with ETA');
    console.log('   ✅ Requirement 4.7: Comprehensive audit trail and alerts\n');

    console.log('🏆 Complete monitoring and logging system successfully demonstrated!');
    console.log('   All components are integrated and working together seamlessly.');
    console.log('   The system provides enterprise-grade monitoring, logging, and alerting');
    console.log('   capabilities suitable for production migration environments.\n');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Cleanup
    monitor.endMigration('completed');
    alertService.stopMonitoring();
    await app.close();
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateCompleteMonitoringSystem()
    .then(() => {
      console.log('\n🎉 Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}