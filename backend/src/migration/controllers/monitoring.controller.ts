import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body,
  Sse,
  MessageEvent
} from '@nestjs/common';
import { MigrationLoggerService, MigrationPhase, LogLevel } from '../services/migration-logger.service';
import { MigrationMonitorService, MigrationMetrics } from '../services/migration-monitor.service';
import { MigrationAlertService, Alert, AlertSeverity } from '../services/migration-alert.service';
import { Observable, interval, map } from 'rxjs';

@Controller('migration/monitoring')
export class MonitoringController {
  constructor(
    private migrationLogger: MigrationLoggerService,
    private migrationMonitor: MigrationMonitorService,
    private migrationAlert: MigrationAlertService
  ) {}

  /**
   * Get current migration metrics
   */
  @Get('metrics/current')
  getCurrentMetrics(): MigrationMetrics | null {
    return this.migrationMonitor.getCurrentMetrics();
  }

  /**
   * Get metrics history
   */
  @Get('metrics/history')
  getMetricsHistory(): MigrationMetrics[] {
    return this.migrationMonitor.getMetricsHistory();
  }

  /**
   * Get phase metrics
   */
  @Get('metrics/phases')
  getPhaseMetrics() {
    return this.migrationMonitor.getPhaseMetrics();
  }

  /**
   * Get ETA information
   */
  @Get('eta')
  getETA() {
    return this.migrationMonitor.getETA();
  }

  /**
   * Get comprehensive status report
   */
  @Get('status')
  getStatusReport() {
    return this.migrationMonitor.generateStatusReport();
  }

  /**
   * Get historical metrics for a specific migration
   */
  @Get('metrics/history/:migrationId')
  async getHistoricalMetrics(@Param('migrationId') migrationId: string) {
    return this.migrationMonitor.getHistoricalMetrics(migrationId);
  }

  /**
   * Server-Sent Events for real-time metrics
   */
  @Sse('metrics/stream')
  streamMetrics(): Observable<MessageEvent> {
    return interval(5000).pipe(
      map(() => {
        const metrics = this.migrationMonitor.getCurrentMetrics();
        return {
          data: JSON.stringify({
            type: 'metrics_update',
            timestamp: new Date().toISOString(),
            data: metrics
          })
        } as MessageEvent;
      })
    );
  }

  /**
   * Server-Sent Events for real-time alerts
   */
  @Sse('alerts/stream')
  streamAlerts(): Observable<MessageEvent> {
    return new Observable(observer => {
      const onAlert = (alert: Alert) => {
        observer.next({
          data: JSON.stringify({
            type: 'alert',
            timestamp: new Date().toISOString(),
            data: alert
          })
        } as MessageEvent);
      };

      const onAlertAcknowledged = (data: any) => {
        observer.next({
          data: JSON.stringify({
            type: 'alert_acknowledged',
            timestamp: new Date().toISOString(),
            data
          })
        } as MessageEvent);
      };

      const onAlertResolved = (data: any) => {
        observer.next({
          data: JSON.stringify({
            type: 'alert_resolved',
            timestamp: new Date().toISOString(),
            data
          })
        } as MessageEvent);
      };

      this.migrationAlert.on('alert_triggered', onAlert);
      this.migrationAlert.on('alert_acknowledged', onAlertAcknowledged);
      this.migrationAlert.on('alert_resolved', onAlertResolved);

      return () => {
        this.migrationAlert.off('alert_triggered', onAlert);
        this.migrationAlert.off('alert_acknowledged', onAlertAcknowledged);
        this.migrationAlert.off('alert_resolved', onAlertResolved);
      };
    });
  }

  /**
   * Get logs by phase
   */
  @Get('logs/phase/:phase')
  async getLogsByPhase(
    @Param('phase') phase: MigrationPhase,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.migrationLogger.getLogsByPhase(phase, limitNum);
  }

  /**
   * Get error logs
   */
  @Get('logs/errors')
  async getErrorLogs(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.migrationLogger.getErrorLogs(limitNum);
  }

  /**
   * Get audit trail
   */
  @Get('audit')
  async getAuditTrail(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 1000;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.migrationLogger.getAuditTrail(start, end, userId, action, limitNum);
  }

  /**
   * Create audit entry
   */
  @Post('audit')
  async createAuditEntry(
    @Body() body: {
      action: string;
      resource: string;
      result: 'success' | 'failure' | 'partial';
      details?: {
        userId?: string;
        resourceId?: string;
        oldValues?: Record<string, any>;
        newValues?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
        additionalDetails?: Record<string, any>;
      };
    }
  ) {
    await this.migrationLogger.createAuditEntry(
      body.action,
      body.resource,
      body.result,
      body.details
    );

    return { success: true, message: 'Audit entry created' };
  }

  /**
   * Get active alerts
   */
  @Get('alerts/active')
  getActiveAlerts(): Alert[] {
    return this.migrationAlert.getActiveAlerts();
  }

  /**
   * Get alert history
   */
  @Get('alerts/history')
  async getAlertHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.migrationAlert.getAlertHistory(limitNum);
  }

  /**
   * Acknowledge an alert
   */
  @Post('alerts/:alertId/acknowledge')
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body() body: { acknowledgedBy: string }
  ) {
    await this.migrationAlert.acknowledgeAlert(alertId, body.acknowledgedBy);
    return { success: true, message: 'Alert acknowledged' };
  }

  /**
   * Resolve an alert
   */
  @Post('alerts/:alertId/resolve')
  async resolveAlert(@Param('alertId') alertId: string) {
    await this.migrationAlert.resolveAlert(alertId);
    return { success: true, message: 'Alert resolved' };
  }

  /**
   * Get system health status
   */
  @Get('health')
  getHealthStatus() {
    const metrics = this.migrationMonitor.getCurrentMetrics();
    const activeAlerts = this.migrationAlert.getActiveAlerts();
    
    const criticalAlerts = activeAlerts.filter(alert => 
      alert.severity === AlertSeverity.CRITICAL && !alert.acknowledged
    );
    
    const highAlerts = activeAlerts.filter(alert => 
      alert.severity === AlertSeverity.HIGH && !alert.acknowledged
    );

    let status = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (highAlerts.length > 0) {
      status = 'warning';
    } else if (metrics && metrics.errorsCount > 0) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      migration: {
        active: !!metrics,
        phase: metrics?.phase,
        progress: metrics?.progressPercentage,
        errors: metrics?.errorsCount || 0
      },
      alerts: {
        total: activeAlerts.length,
        critical: criticalAlerts.length,
        high: highAlerts.length,
        unacknowledged: activeAlerts.filter(a => !a.acknowledged).length
      },
      system: {
        memoryUsageMB: metrics ? Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024) : 0,
        uptime: process.uptime()
      }
    };
  }

  /**
   * Export logs for external analysis
   */
  @Get('logs/export')
  async exportLogs(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('level') level?: LogLevel
  ) {
    // This would implement log export functionality
    // For now, return a placeholder
    return {
      message: 'Log export functionality would be implemented here',
      parameters: { format, startDate, endDate, level }
    };
  }

  /**
   * Generate compliance report
   */
  @Get('compliance/report')
  async generateComplianceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const auditTrail = await this.migrationLogger.getAuditTrail(start, end);
    const alertHistory = await this.migrationAlert.getAlertHistory(1000);
    
    const filteredAlerts = alertHistory.filter(alert => 
      alert.timestamp >= start && alert.timestamp <= end
    );

    return {
      reportPeriod: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      },
      summary: {
        totalAuditEntries: auditTrail.length,
        totalAlerts: filteredAlerts.length,
        criticalAlerts: filteredAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
        unresolvedAlerts: filteredAlerts.filter(a => !a.resolved).length
      },
      auditTrail: auditTrail.slice(0, 100), // Limit for response size
      alerts: filteredAlerts.slice(0, 50),
      generatedAt: new Date().toISOString()
    };
  }
}