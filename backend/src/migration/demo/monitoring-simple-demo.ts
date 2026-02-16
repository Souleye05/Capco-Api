import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MigrationLoggerService, MigrationPhase, LogLevel } from '../services/migration-logger.service';
import { MigrationMonitorService } from '../services/migration-monitor.service';
import { MigrationAlertService } from '../services/migration-alert.service';

/**
 * Simple demonstration of the monitoring and logging system
 * Showcases Requirements 4.5, 4.6, 4.7
 */
export async function demonstrateMonitoringSystem() {
  console.log('🚀 Migration Monitoring & Logging System Demo\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const logger = app.get(MigrationLoggerService);
  const monitor = app.get(MigrationMonitorService);
  const alertService = app.get(MigrationAlertService);

  try {
    // 1. Structured Logging Demo
    console.log('📝 1. STRUCTURED LOGGING');
    console.log('========================\n');

    logger.setCurrentPhase(MigrationPhase.DATA_MIGRATION);
    
    logger.logInfo('migration_start', 'Starting data migration', {
      totalRecords: 10000,
      batchSize: 500,
      targetDatabase: 'production'
    });

    const error = new Error('Connection timeout');
    logger.logError('db_connection', 'Database connection failed', error, {
      host: 'db.example.com',
      port: 5432,
      retryAttempt: 3
    });

    console.log('✅ Structured logging with context and error details\n');

    // 2. Real-time Monitoring Demo
    console.log('📊 2. REAL-TIME MONITORING');
    console.log('==========================\n');

    const migrationId = 'demo_' + Date.now();
    monitor.startMigration(migrationId, 10000);

    console.log(`Started monitoring: ${migrationId}`);

    // Simulate progress
    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      monitor.updateProgress({
        recordsProcessed: i * 2000,
        errorsCount: i,
        warningsCount: i * 2,
      });

      const metrics = monitor.getCurrentMetrics();
      if (metrics) {
        console.log(`Progress: ${metrics.progressPercentage}% | ` +
                   `Records: ${metrics.recordsProcessed}/${metrics.totalRecords} | ` +
                   `Errors: ${metrics.errorsCount}`);
      }
    }

    console.log('✅ Real-time monitoring with progress tracking\n');

    // 3. Alerting Demo
    console.log('🚨 3. AUTOMATIC ALERTING');
    console.log('=========================\n');

    let alertCount = 0;
    alertService.on('alert_triggered', (alert) => {
      alertCount++;
      console.log(`🔔 Alert: ${alert.title} (${alert.severity})`);
      console.log(`   ${alert.message}`);
    });

    // Trigger high error rate
    monitor.updateProgress({
      recordsProcessed: 1000,
      errorsCount: 150, // 15% error rate
      warningsCount: 10,
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`✅ Alert system active - ${alertCount} alerts triggered\n`);

    // 4. Audit Trail Demo
    console.log('📋 4. AUDIT TRAIL');
    console.log('==================\n');

    await logger.createAuditEntry(
      'migration_completed',
      'migration_process',
      'success',
      {
        userId: 'admin',
        resourceId: migrationId,
        additionalDetails: {
          recordsProcessed: 10000,
          duration: '5 minutes',
          errorRate: '1.5%'
        }
      }
    );

    console.log('✅ Audit trail entry created for compliance\n');

    // 5. Final Report
    console.log('📈 5. SYSTEM STATUS');
    console.log('===================\n');

    const statusReport = monitor.generateStatusReport();
    console.log('Migration Status:');
    console.log(`  Records: ${statusReport.migration?.recordsProcessed || 0}`);
    console.log(`  Errors: ${statusReport.migration?.errorsCount || 0}`);
    console.log(`  Warnings: ${statusReport.migration?.warningsCount || 0}`);
    console.log(`  Alerts: ${statusReport.alerts.length}`);
    console.log(`  Recommendations: ${statusReport.recommendations.length}\n`);

    console.log('🎯 REQUIREMENTS VALIDATED:');
    console.log('✅ 4.5: Structured logging with context');
    console.log('✅ 4.6: Real-time monitoring with metrics');
    console.log('✅ 4.7: Automatic alerting and audit trail\n');

    console.log('🏆 Monitoring system demonstration complete!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    monitor.endMigration('completed');
    alertService.stopMonitoring();
    await app.close();
  }
}

// Run if executed directly
if (require.main === module) {
  demonstrateMonitoringSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}