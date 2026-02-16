import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MigrationLoggerService, MigrationPhase, LogLevel } from '../services/migration-logger.service';
import { MigrationMonitorService } from '../services/migration-monitor.service';
import { MigrationAlertService } from '../services/migration-alert.service';

/**
 * Demonstration of the comprehensive monitoring and logging system
 * 
 * This demo showcases:
 * - Structured logging with different levels
 * - Real-time monitoring with metrics
 * - Automatic alert system
 * - Audit trail creation
 * - Progress tracking with ETA calculations
 */
async function demonstrateMonitoringSystem() {
  console.log('🚀 Starting Migration Monitoring and Logging System Demo\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const logger = app.get(MigrationLoggerService);
  const monitor = app.get(MigrationMonitorService);
  const alertService = app.get(MigrationAlertService);

  try {
    // Demo 1: Structured Logging
    console.log('📝 Demo 1: Structured Logging System');
    console.log('=====================================');
    
    logger.setCurrentPhase(MigrationPhase.INITIALIZATION);
    logger.logInfo('demo_start', 'Starting monitoring system demonstration', {
      demoVersion: '1.0.0',
      environment: 'development'
    });

    // Log different levels
    logger.logDebug('debug_example', 'Debug information for troubleshooting', {
      debugLevel: 'verbose',
      component: 'demo'
    });

    logger.logWarn('warning_example', 'This is a warning message', {
      warningType: 'performance',
      threshold: 100
    });

    // Log an error with remediation steps
    const sampleError = new Error('Sample error for demonstration');
    logger.logError(
      'error_example',
      'Demonstrating error logging with context',
      sampleError,
      { errorCode: 'DEMO_001', affectedRecords: 5 },
      [
        'Check database connectivity',
        'Verify data integrity',
        'Review error logs for patterns'
      ]
    );

    // Log progress
    logger.logProgress('data_processing', 'Processing migration data', 250, 1000, {
      batchSize: 50,
      currentBatch: 5
    });

    console.log('✅ Structured logging demonstrated\n');

    // Demo 2: Real-time Monitoring
    console.log('📊 Demo 2: Real-time Monitoring System');
    console.log('=====================================');

    const migrationId = `demo_migration_${Date.now()}`;
    monitor.startMigration(migrationId, 10000, 50, 500, 1000000000);

    // Simulate migration phases
    const phases = [
      MigrationPhase.SCHEMA_EXTRACTION,
      MigrationPhase.DATA_MIGRATION,
      MigrationPhase.USER_MIGRATION,
      MigrationPhase.FILE_MIGRATION,
      MigrationPhase.VALIDATION
    ];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      logger.setCurrentPhase(phase);
      monitor.startPhase(phase);

      console.log(`\n🔄 Phase: ${phase}`);

      // Simulate progress in this phase
      for (let j = 0; j < 5; j++) {
        const progress = {
          recordsProcessed: Math.floor(Math.random() * 500) + 100,
          tablesProcessed: Math.floor(Math.random() * 3) + 1,
          filesProcessed: Math.floor(Math.random() * 20) + 5,
          bytesProcessed: Math.floor(Math.random() * 10000000) + 1000000,
          errorsCount: Math.random() < 0.1 ? Math.floor(Math.random() * 3) : 0,
          warningsCount: Math.floor(Math.random() * 5)
        };

        monitor.updateProgress(progress);

        const metrics = monitor.getCurrentMetrics();
        if (metrics) {
          console.log(`  📈 Progress: ${metrics.progressPercentage}% | ` +
                     `Records: ${metrics.recordsProcessed} | ` +
                     `Rate: ${metrics.recordsPerSecond.toFixed(2)}/sec | ` +
                     `Errors: ${metrics.errorsCount}`);

          const eta = monitor.getETA();
          if (eta.eta) {
            const remainingMinutes = Math.round((eta.eta.getTime() - Date.now()) / 60000);
            console.log(`  ⏱️  ETA: ${remainingMinutes} minutes (${eta.confidence}% confidence)`);
          }
        }

        // Small delay to simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      monitor.endPhase(phase, 'completed');
      console.log(`✅ Phase ${phase} completed`);
    }

    // Demo 3: Status Report
    console.log('\n📋 Demo 3: Comprehensive Status Report');
    console.log('=====================================');

    const statusReport = monitor.generateStatusReport();
    console.log('Migration Status:', statusReport.migration?.phase);
    console.log('Overall Progress:', `${statusReport.migration?.progressPercentage}%`);
    console.log('Total Errors:', statusReport.migration?.errorsCount);
    console.log('Active Alerts:', statusReport.alerts.length);
    console.log('Recommendations:', statusReport.recommendations.length);

    if (statusReport.alerts.length > 0) {
      console.log('\n🚨 Active Alerts:');
      statusReport.alerts.forEach((alert, index) => {
        console.log(`  ${index + 1}. ${alert}`);
      });
    }

    if (statusReport.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      statusReport.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Demo 4: Audit Trail
    console.log('\n📚 Demo 4: Audit Trail System');
    console.log('=============================');

    // Create sample audit entries
    await logger.createAuditEntry(
      'migration_start',
      'migration_system',
      'success',
      {
        userId: 'admin_user',
        ipAddress: '192.168.1.100',
        userAgent: 'Migration-Demo/1.0',
        sessionId: 'demo_session_123',
        additionalDetails: {
          migrationId,
          totalRecords: 10000,
          estimatedDuration: '2 hours'
        }
      }
    );

    await logger.createAuditEntry(
      'data_validation',
      'migration_validator',
      'success',
      {
        userId: 'system',
        additionalDetails: {
          validatedTables: 15,
          integrityChecks: 'passed',
          checksumValidation: 'passed'
        }
      }
    );

    await logger.createAuditEntry(
      'user_migration',
      'user_migrator',
      'partial',
      {
        userId: 'system',
        oldValues: { migratedUsers: 0 },
        newValues: { migratedUsers: 1250 },
        additionalDetails: {
          totalUsers: 1300,
          failedMigrations: 50,
          passwordResetRequired: 50
        }
      }
    );

    console.log('✅ Audit trail entries created');

    // Demo 5: Alert System
    console.log('\n🚨 Demo 5: Automatic Alert System');
    console.log('=================================');

    // Listen for alerts
    alertService.on('alert_triggered', (alert) => {
      console.log(`\n🔔 ALERT TRIGGERED:`);
      console.log(`   Title: ${alert.title}`);
      console.log(`   Severity: ${alert.severity.toUpperCase()}`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Phase: ${alert.phase}`);
      
      if (alert.actions.length > 0) {
        console.log(`   Recommended Actions:`);
        alert.actions.forEach((action, index) => {
          console.log(`     ${index + 1}. ${action}`);
        });
      }
    });

    // Simulate conditions that trigger alerts
    console.log('Simulating high error rate...');
    monitor.updateProgress({ errorsCount: 15, recordsProcessed: 100 });
    
    // Wait for alert processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\nSimulating slow progress...');
    // Simulate slow processing by not updating progress for a while
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Demo 6: Historical Data
    console.log('\n📈 Demo 6: Historical Metrics');
    console.log('=============================');

    const metricsHistory = monitor.getMetricsHistory();
    console.log(`Metrics history entries: ${metricsHistory.length}`);
    
    if (metricsHistory.length > 0) {
      const latest = metricsHistory[metricsHistory.length - 1];
      console.log('Latest metrics:');
      console.log(`  - Records processed: ${latest.recordsProcessed}`);
      console.log(`  - Processing rate: ${latest.recordsPerSecond.toFixed(2)} records/sec`);
      console.log(`  - Memory usage: ${Math.round(latest.memoryUsage.heapUsed / 1024 / 1024)}MB`);
      console.log(`  - Elapsed time: ${Math.round(latest.elapsedTime / 1000)}s`);
    }

    const phaseMetrics = monitor.getPhaseMetrics();
    console.log(`\nPhase metrics: ${phaseMetrics.length} phases completed`);
    phaseMetrics.forEach(phase => {
      const duration = phase.duration ? Math.round(phase.duration / 1000) : 0;
      console.log(`  - ${phase.phase}: ${duration}s, ${phase.recordsProcessed} records, ${phase.errorsCount} errors`);
    });

    // End migration
    monitor.endMigration('completed');
    logger.logInfo('demo_complete', 'Monitoring system demonstration completed', {
      totalDuration: Date.now() - parseInt(migrationId.split('_')[2]),
      phasesCompleted: phases.length
    });

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nKey features demonstrated:');
    console.log('✅ Structured logging with multiple levels');
    console.log('✅ Real-time progress monitoring');
    console.log('✅ ETA calculations with confidence metrics');
    console.log('✅ Automatic alert system with remediation steps');
    console.log('✅ Comprehensive audit trail');
    console.log('✅ Phase-based progress tracking');
    console.log('✅ Historical metrics collection');
    console.log('✅ System resource monitoring');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    logger.logCritical('demo_failure', 'Monitoring demo failed', error as Error);
  } finally {
    await app.close();
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateMonitoringSystem().catch(console.error);
}

export { demonstrateMonitoringSystem };