import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { MigrationLoggerService, LogLevel, MigrationPhase, StructuredLogEntry } from './migration-logger.service';
import { MigrationMonitorService, MigrationMetrics } from './migration-monitor.service';
import { EventEmitter } from 'events';

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertType {
  ERROR = 'error',
  PERFORMANCE = 'performance',
  RESOURCE = 'resource',
  PROGRESS = 'progress',
  SECURITY = 'security',
  DATA_INTEGRITY = 'data_integrity'
}

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: (metrics: MigrationMetrics, logs: StructuredLogEntry[]) => boolean;
  message: (context: any) => string;
  cooldownMinutes: number;
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  migrationId?: string;
  phase?: MigrationPhase;
  context: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: string[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'console' | 'database';
  config: Record<string, any>;
  enabled: boolean;
  severityFilter: AlertSeverity[];
}

@Injectable()
export class MigrationAlertService extends EventEmitter {
  private readonly logger = new Logger(MigrationAlertService.name);
  private alertRules: Map<string, AlertRule> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private monitoringInterval?: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private migrationLogger: MigrationLoggerService,
    private migrationMonitor: MigrationMonitorService
  ) {
    super();
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
    this.startMonitoring();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    // Error rate alert
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      type: AlertType.ERROR,
      severity: AlertSeverity.HIGH,
      condition: (metrics) => metrics.errorsCount > 10 && (metrics.errorsCount / Math.max(metrics.recordsProcessed, 1)) > 0.05,
      message: (context) => `High error rate detected: ${context.errorRate}% (${context.errorsCount} errors out of ${context.recordsProcessed} records)`,
      cooldownMinutes: 15,
      enabled: true
    });

    // Critical error alert
    this.addAlertRule({
      id: 'critical_error',
      name: 'Critical Error',
      type: AlertType.ERROR,
      severity: AlertSeverity.CRITICAL,
      condition: (metrics, logs) => logs.some(log => log.level === LogLevel.CRITICAL),
      message: (context) => `Critical error detected in ${context.phase}: ${context.errorMessage}`,
      cooldownMinutes: 0, // No cooldown for critical errors
      enabled: true
    });

    // Slow progress alert
    this.addAlertRule({
      id: 'slow_progress',
      name: 'Slow Migration Progress',
      type: AlertType.PERFORMANCE,
      severity: AlertSeverity.MEDIUM,
      condition: (metrics) => metrics.recordsPerSecond < 5 && metrics.recordsProcessed > 100 && metrics.elapsedTime > 300000,
      message: (context) => `Migration progress is slow: ${context.recordsPerSecond} records/second (expected > 5)`,
      cooldownMinutes: 30,
      enabled: true
    });

    // Stalled migration alert
    this.addAlertRule({
      id: 'stalled_migration',
      name: 'Stalled Migration',
      type: AlertType.PROGRESS,
      severity: AlertSeverity.HIGH,
      condition: (metrics) => metrics.progressPercentage === 0 && metrics.elapsedTime > 600000, // 10 minutes
      message: (context) => `Migration appears to be stalled: no progress for ${Math.round(context.elapsedTime / 60000)} minutes`,
      cooldownMinutes: 10,
      enabled: true
    });

    // High memory usage alert
    this.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      type: AlertType.RESOURCE,
      severity: AlertSeverity.MEDIUM,
      condition: (metrics) => (metrics.memoryUsage.heapUsed / 1024 / 1024) > 1500, // 1.5GB
      message: (context) => `High memory usage detected: ${context.memoryUsageMB}MB (threshold: 1500MB)`,
      cooldownMinutes: 20,
      enabled: true
    });

    // Data integrity alert
    this.addAlertRule({
      id: 'data_integrity_issue',
      name: 'Data Integrity Issue',
      type: AlertType.DATA_INTEGRITY,
      severity: AlertSeverity.CRITICAL,
      condition: (metrics, logs) => logs.some(log => 
        log.message.toLowerCase().includes('integrity') || 
        log.message.toLowerCase().includes('constraint') ||
        log.message.toLowerCase().includes('foreign key')
      ),
      message: (context) => `Data integrity issue detected: ${context.integrityError}`,
      cooldownMinutes: 0,
      enabled: true
    });

    // Long running phase alert
    this.addAlertRule({
      id: 'long_running_phase',
      name: 'Long Running Phase',
      type: AlertType.PERFORMANCE,
      severity: AlertSeverity.MEDIUM,
      condition: (metrics) => {
        const phaseMetrics = this.migrationMonitor.getPhaseMetrics();
        const currentPhase = phaseMetrics.find(p => p.status === 'in_progress');
        if (!currentPhase) return false;
        
        const phaseDuration = Date.now() - currentPhase.startTime.getTime();
        return phaseDuration > 1800000; // 30 minutes
      },
      message: (context) => `Phase ${context.phase} has been running for ${Math.round(context.phaseDuration / 60000)} minutes`,
      cooldownMinutes: 30,
      enabled: true
    });

    // Excessive warnings alert
    this.addAlertRule({
      id: 'excessive_warnings',
      name: 'Excessive Warnings',
      type: AlertType.ERROR,
      severity: AlertSeverity.LOW,
      condition: (metrics) => metrics.warningsCount > 50,
      message: (context) => `Excessive warnings detected: ${context.warningsCount} warnings`,
      cooldownMinutes: 60,
      enabled: true
    });
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    // Console notification
    this.addNotificationChannel({
      id: 'console',
      name: 'Console Output',
      type: 'console',
      config: {},
      enabled: true,
      severityFilter: [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
    });

    // Database notification
    this.addNotificationChannel({
      id: 'database',
      name: 'Database Storage',
      type: 'database',
      config: {},
      enabled: true,
      severityFilter: [AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
    });

    // Email notification (if configured)
    if (process.env.SMTP_HOST) {
      this.addNotificationChannel({
        id: 'email',
        name: 'Email Notifications',
        type: 'email',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          from: process.env.SMTP_FROM || 'migration@system.local',
          to: process.env.ALERT_EMAIL_TO?.split(',') || []
        },
        enabled: true,
        severityFilter: [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
      });
    }

    // Webhook notification (if configured)
    if (process.env.ALERT_WEBHOOK_URL) {
      this.addNotificationChannel({
        id: 'webhook',
        name: 'Webhook Notifications',
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.ALERT_WEBHOOK_AUTH || ''
          }
        },
        enabled: true,
        severityFilter: [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
      });
    }
  }

  /**
   * Add a new alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.migrationLogger.logInfo('alert_rule_added', `Added alert rule: ${rule.name}`, {
      ruleId: rule.id,
      type: rule.type,
      severity: rule.severity
    });
  }

  /**
   * Add a new notification channel
   */
  addNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
    this.migrationLogger.logInfo('notification_channel_added', `Added notification channel: ${channel.name}`, {
      channelId: channel.id,
      type: channel.type
    });
  }

  /**
   * Start monitoring for alerts
   */
  private startMonitoring(): void {
    // Check for alerts every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.checkAlerts();
    }, 30000);

    // Listen to migration monitor events
    this.migrationMonitor.on('metrics_updated', (metrics: MigrationMetrics) => {
      this.checkAlertsForMetrics(metrics);
    });

    this.migrationLogger.logInfo('alert_monitoring_started', 'Alert monitoring system started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.migrationLogger.logInfo('alert_monitoring_stopped', 'Alert monitoring system stopped');
  }

  /**
   * Check all alert rules
   */
  private async checkAlerts(): Promise<void> {
    const metrics = this.migrationMonitor.getCurrentMetrics();
    if (!metrics) return;

    await this.checkAlertsForMetrics(metrics);
  }

  /**
   * Check alerts for specific metrics
   */
  private async checkAlertsForMetrics(metrics: MigrationMetrics): Promise<void> {
    // Get recent error logs
    const recentLogs = await this.migrationLogger.getErrorLogs(20);

    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlert = this.alertCooldowns.get(ruleId);
      if (lastAlert && rule.cooldownMinutes > 0) {
        const cooldownEnd = new Date(lastAlert.getTime() + rule.cooldownMinutes * 60000);
        if (new Date() < cooldownEnd) continue;
      }

      // Check condition
      try {
        if (rule.condition(metrics, recentLogs)) {
          await this.triggerAlert(rule, metrics, recentLogs);
        }
      } catch (error) {
        this.logger.error(`Error checking alert rule ${ruleId}: ${error.message}`);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(
    rule: AlertRule, 
    metrics: MigrationMetrics, 
    logs: StructuredLogEntry[]
  ): Promise<void> {
    const alertId = this.generateAlertId();
    
    // Build context for message
    const context = {
      ...metrics,
      errorRate: metrics.recordsProcessed > 0 ? Math.round((metrics.errorsCount / metrics.recordsProcessed) * 10000) / 100 : 0,
      memoryUsageMB: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
      phaseDuration: Date.now() - metrics.startTime.getTime(),
      errorMessage: logs.find(log => log.level === LogLevel.CRITICAL)?.message,
      integrityError: logs.find(log => 
        log.message.toLowerCase().includes('integrity') || 
        log.message.toLowerCase().includes('constraint')
      )?.message
    };

    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      message: rule.message(context),
      timestamp: new Date(),
      migrationId: metrics.migrationId,
      phase: metrics.phase,
      context,
      acknowledged: false,
      resolved: false,
      actions: this.generateRecommendedActions(rule, context)
    };

    this.activeAlerts.set(alertId, alert);
    this.alertCooldowns.set(rule.id, new Date());

    // Log the alert
    this.migrationLogger.logWarn('alert_triggered', `Alert triggered: ${alert.title}`, {
      alertId,
      ruleId: rule.id,
      severity: rule.severity,
      message: alert.message
    });

    // Send notifications
    await this.sendNotifications(alert);

    // Emit event
    this.emit('alert_triggered', alert);

    // Save to database
    await this.saveAlertToDatabase(alert);
  }

  /**
   * Generate recommended actions based on alert type
   */
  private generateRecommendedActions(rule: AlertRule, context: any): string[] {
    const actions: string[] = [];

    switch (rule.type) {
      case AlertType.ERROR:
        actions.push('Review error logs for detailed information');
        actions.push('Check database connectivity and constraints');
        if (context.errorRate > 10) {
          actions.push('Consider pausing migration to investigate issues');
        }
        break;

      case AlertType.PERFORMANCE:
        actions.push('Monitor system resources (CPU, memory, disk I/O)');
        actions.push('Consider increasing database connection pool size');
        actions.push('Check for long-running queries or locks');
        break;

      case AlertType.RESOURCE:
        actions.push('Monitor system memory and CPU usage');
        actions.push('Consider processing data in smaller batches');
        actions.push('Check for memory leaks in migration code');
        break;

      case AlertType.PROGRESS:
        actions.push('Check migration logs for stuck operations');
        actions.push('Verify database connectivity');
        actions.push('Consider restarting migration from last checkpoint');
        break;

      case AlertType.DATA_INTEGRITY:
        actions.push('CRITICAL: Stop migration immediately');
        actions.push('Review data integrity errors in detail');
        actions.push('Validate source data before continuing');
        actions.push('Consider rollback to last known good state');
        break;

      case AlertType.SECURITY:
        actions.push('Review security logs immediately');
        actions.push('Check for unauthorized access attempts');
        actions.push('Verify authentication and authorization');
        break;
    }

    return actions;
  }

  /**
   * Send notifications through all enabled channels
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    for (const [channelId, channel] of this.notificationChannels.entries()) {
      if (!channel.enabled || !channel.severityFilter.includes(alert.severity)) {
        continue;
      }

      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        this.logger.error(`Failed to send notification via ${channelId}: ${error.message}`);
      }
    }
  }

  /**
   * Send notification through specific channel
   */
  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'console':
        this.sendConsoleNotification(alert);
        break;
      case 'database':
        await this.sendDatabaseNotification(alert);
        break;
      case 'email':
        await this.sendEmailNotification(channel, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, alert);
        break;
    }
  }

  /**
   * Send console notification
   */
  private sendConsoleNotification(alert: Alert): void {
    const severityIcon = {
      [AlertSeverity.LOW]: '🟡',
      [AlertSeverity.MEDIUM]: '🟠',
      [AlertSeverity.HIGH]: '🔴',
      [AlertSeverity.CRITICAL]: '🚨'
    };

    console.log(`\n${severityIcon[alert.severity]} MIGRATION ALERT [${alert.severity.toUpperCase()}]`);
    console.log(`Title: ${alert.title}`);
    console.log(`Message: ${alert.message}`);
    console.log(`Time: ${alert.timestamp.toISOString()}`);
    console.log(`Migration: ${alert.migrationId} (Phase: ${alert.phase})`);
    
    if (alert.actions.length > 0) {
      console.log('Recommended Actions:');
      alert.actions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action}`);
      });
    }
    console.log('');
  }

  /**
   * Send database notification
   */
  private async sendDatabaseNotification(alert: Alert): Promise<void> {
    // This is handled by saveAlertToDatabase
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Email implementation would go here
    // For now, just log that email would be sent
    this.logger.log(`Email notification would be sent for alert: ${alert.title}`);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Webhook implementation would go here
    // For now, just log that webhook would be called
    this.logger.log(`Webhook notification would be sent for alert: ${alert.title}`);
  }

  /**
   * Save alert to database
   */
  private async saveAlertToDatabase(alert: Alert): Promise<void> {
    try {
      await this.prisma.migrationAlert.create({
        data: {
          id: alert.id,
          ruleId: alert.ruleId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          migrationId: alert.migrationId,
          phase: alert.phase,
          context: alert.context,
          actions: alert.actions,
          acknowledged: alert.acknowledged,
          resolved: alert.resolved,
          timestamp: alert.timestamp
        }
      });
    } catch (error) {
      this.logger.error(`Failed to save alert to database: ${error.message}`);
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    await this.prisma.migrationAlert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt
      }
    });

    this.migrationLogger.logInfo('alert_acknowledged', `Alert acknowledged: ${alert.title}`, {
      alertId,
      acknowledgedBy
    });

    this.emit('alert_acknowledged', { alertId, acknowledgedBy });
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    await this.prisma.migrationAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: alert.resolvedAt
      }
    });

    this.activeAlerts.delete(alertId);

    this.migrationLogger.logInfo('alert_resolved', `Alert resolved: ${alert.title}`, {
      alertId
    });

    this.emit('alert_resolved', { alertId });
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  async getAlertHistory(limit = 100): Promise<Alert[]> {
    const alerts = await this.prisma.migrationAlert.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return alerts.map(alert => ({
      id: alert.id,
      ruleId: alert.ruleId,
      type: alert.type as AlertType,
      severity: alert.severity as AlertSeverity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      migrationId: alert.migrationId,
      phase: alert.phase as MigrationPhase,
      context: alert.context as Record<string, any>,
      acknowledged: alert.acknowledged,
      acknowledgedBy: alert.acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt,
      resolved: alert.resolved,
      resolvedAt: alert.resolvedAt,
      actions: alert.actions as string[]
    }));
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  onModuleDestroy(): void {
    this.stopMonitoring();
  }
}