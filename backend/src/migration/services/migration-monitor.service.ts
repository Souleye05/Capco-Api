import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { MigrationLoggerService, MigrationPhase, LogLevel } from './migration-logger.service';
import { EventEmitter } from 'events';

export interface MigrationMetrics {
  migrationId: string;
  phase: MigrationPhase;
  startTime: Date;
  currentTime: Date;
  elapsedTime: number;
  estimatedTotalTime?: number;
  estimatedRemainingTime?: number;
  progressPercentage: number;
  recordsProcessed: number;
  totalRecords?: number;
  recordsPerSecond: number;
  errorsCount: number;
  warningsCount: number;
  tablesProcessed: number;
  totalTables?: number;
  filesProcessed: number;
  totalFiles?: number;
  bytesProcessed: number;
  totalBytes?: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface PhaseMetrics {
  phase: MigrationPhase;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordsProcessed: number;
  errorsCount: number;
  warningsCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface RealTimeUpdate {
  timestamp: Date;
  type: 'progress' | 'error' | 'warning' | 'phase_change' | 'completion';
  data: any;
}

@Injectable()
export class MigrationMonitorService extends EventEmitter {
  private readonly logger = new Logger(MigrationMonitorService.name);
  private currentMigrationId?: string;
  private migrationStartTime?: Date;
  private phaseStartTimes = new Map<MigrationPhase, Date>();
  private phaseMetrics = new Map<MigrationPhase, PhaseMetrics>();
  private metricsHistory: MigrationMetrics[] = [];
  private updateInterval?: NodeJS.Timeout;
  private cpuUsageStart?: NodeJS.CpuUsage;

  // Counters
  private recordsProcessed = 0;
  private totalRecords = 0;
  private errorsCount = 0;
  private warningsCount = 0;
  private tablesProcessed = 0;
  private totalTables = 0;
  private filesProcessed = 0;
  private totalFiles = 0;
  private bytesProcessed = 0;
  private totalBytes = 0;

  constructor(
    private prisma: PrismaService,
    private migrationLogger: MigrationLoggerService
  ) {
    super();
    this.cpuUsageStart = process.cpuUsage();
  }

  /**
   * Start monitoring a migration
   */
  startMigration(migrationId: string, totalRecords?: number, totalTables?: number, totalFiles?: number, totalBytes?: number): void {
    this.currentMigrationId = migrationId;
    this.migrationStartTime = new Date();
    this.totalRecords = totalRecords || 0;
    this.totalTables = totalTables || 0;
    this.totalFiles = totalFiles || 0;
    this.totalBytes = totalBytes || 0;

    // Reset counters
    this.recordsProcessed = 0;
    this.errorsCount = 0;
    this.warningsCount = 0;
    this.tablesProcessed = 0;
    this.filesProcessed = 0;
    this.bytesProcessed = 0;
    this.phaseMetrics.clear();
    this.phaseStartTimes.clear();
    this.metricsHistory = [];

    // Start real-time monitoring
    this.startRealTimeMonitoring();

    this.migrationLogger.logInfo('monitoring_start', `Started monitoring migration: ${migrationId}`, {
      migrationId,
      totalRecords,
      totalTables,
      totalFiles,
      totalBytes
    });

    this.emit('migration_started', { migrationId, startTime: this.migrationStartTime });
  }

  /**
   * Start monitoring a specific phase
   */
  startPhase(phase: MigrationPhase): void {
    const startTime = new Date();
    this.phaseStartTimes.set(phase, startTime);
    
    const phaseMetric: PhaseMetrics = {
      phase,
      startTime,
      recordsProcessed: 0,
      errorsCount: 0,
      warningsCount: 0,
      status: 'in_progress'
    };
    
    this.phaseMetrics.set(phase, phaseMetric);

    this.migrationLogger.logInfo('phase_start', `Started phase: ${phase}`, { phase });
    this.emit('phase_started', { phase, startTime });
  }

  /**
   * End monitoring a specific phase
   */
  endPhase(phase: MigrationPhase, status: 'completed' | 'failed' = 'completed'): void {
    const phaseMetric = this.phaseMetrics.get(phase);
    if (!phaseMetric) return;

    const endTime = new Date();
    const duration = endTime.getTime() - phaseMetric.startTime.getTime();

    phaseMetric.endTime = endTime;
    phaseMetric.duration = duration;
    phaseMetric.status = status;

    this.migrationLogger.logInfo('phase_end', `Ended phase: ${phase}`, {
      phase,
      duration,
      status,
      recordsProcessed: phaseMetric.recordsProcessed,
      errorsCount: phaseMetric.errorsCount
    });

    this.emit('phase_completed', { phase, duration, status, metrics: phaseMetric });
  }

  /**
   * Update progress counters
   */
  updateProgress(updates: {
    recordsProcessed?: number;
    tablesProcessed?: number;
    filesProcessed?: number;
    bytesProcessed?: number;
    errorsCount?: number;
    warningsCount?: number;
  }): void {
    if (updates.recordsProcessed !== undefined) {
      this.recordsProcessed += updates.recordsProcessed;
    }
    if (updates.tablesProcessed !== undefined) {
      this.tablesProcessed += updates.tablesProcessed;
    }
    if (updates.filesProcessed !== undefined) {
      this.filesProcessed += updates.filesProcessed;
    }
    if (updates.bytesProcessed !== undefined) {
      this.bytesProcessed += updates.bytesProcessed;
    }
    if (updates.errorsCount !== undefined) {
      this.errorsCount += updates.errorsCount;
    }
    if (updates.warningsCount !== undefined) {
      this.warningsCount += updates.warningsCount;
    }

    // Update current phase metrics
    const currentPhase = this.getCurrentPhase();
    if (currentPhase) {
      const phaseMetric = this.phaseMetrics.get(currentPhase);
      if (phaseMetric) {
        if (updates.recordsProcessed) phaseMetric.recordsProcessed += updates.recordsProcessed;
        if (updates.errorsCount) phaseMetric.errorsCount += updates.errorsCount;
        if (updates.warningsCount) phaseMetric.warningsCount += updates.warningsCount;
      }
    }

    this.emit('progress_updated', this.getCurrentMetrics());
  }

  /**
   * Get current migration metrics
   */
  getCurrentMetrics(): MigrationMetrics | null {
    if (!this.currentMigrationId || !this.migrationStartTime) {
      return null;
    }

    const currentTime = new Date();
    const elapsedTime = currentTime.getTime() - this.migrationStartTime.getTime();
    const recordsPerSecond = elapsedTime > 0 ? (this.recordsProcessed / (elapsedTime / 1000)) : 0;
    
    // Calculate progress percentage
    let progressPercentage = 0;
    if (this.totalRecords > 0) {
      progressPercentage = Math.round((this.recordsProcessed / this.totalRecords) * 100);
    } else if (this.totalTables > 0) {
      progressPercentage = Math.round((this.tablesProcessed / this.totalTables) * 100);
    }

    // Estimate remaining time
    let estimatedRemainingTime: number | undefined;
    let estimatedTotalTime: number | undefined;
    
    if (recordsPerSecond > 0 && this.totalRecords > 0) {
      const remainingRecords = this.totalRecords - this.recordsProcessed;
      estimatedRemainingTime = Math.round(remainingRecords / recordsPerSecond * 1000); // in milliseconds
      estimatedTotalTime = Math.round(this.totalRecords / recordsPerSecond * 1000);
    }

    return {
      migrationId: this.currentMigrationId,
      phase: this.getCurrentPhase() || MigrationPhase.INITIALIZATION,
      startTime: this.migrationStartTime,
      currentTime,
      elapsedTime,
      estimatedTotalTime,
      estimatedRemainingTime,
      progressPercentage,
      recordsProcessed: this.recordsProcessed,
      totalRecords: this.totalRecords || undefined,
      recordsPerSecond: Math.round(recordsPerSecond * 100) / 100,
      errorsCount: this.errorsCount,
      warningsCount: this.warningsCount,
      tablesProcessed: this.tablesProcessed,
      totalTables: this.totalTables || undefined,
      filesProcessed: this.filesProcessed,
      totalFiles: this.totalFiles || undefined,
      bytesProcessed: this.bytesProcessed,
      totalBytes: this.totalBytes || undefined,
      memoryUsage: process.memoryUsage(),
      cpuUsage: this.cpuUsageStart ? process.cpuUsage(this.cpuUsageStart) : undefined
    };
  }

  /**
   * Get phase metrics
   */
  getPhaseMetrics(): PhaseMetrics[] {
    return Array.from(this.phaseMetrics.values());
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): MigrationMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Generate ETA (Estimated Time of Arrival)
   */
  getETA(): { eta: Date | null; confidence: number } {
    const metrics = this.getCurrentMetrics();
    if (!metrics || !metrics.estimatedRemainingTime) {
      return { eta: null, confidence: 0 };
    }

    const eta = new Date(Date.now() + metrics.estimatedRemainingTime);
    
    // Calculate confidence based on data consistency
    let confidence = 0;
    if (this.metricsHistory.length >= 3) {
      const recentMetrics = this.metricsHistory.slice(-3);
      const avgRecordsPerSecond = recentMetrics.reduce((sum, m) => sum + m.recordsPerSecond, 0) / recentMetrics.length;
      const variance = recentMetrics.reduce((sum, m) => sum + Math.pow(m.recordsPerSecond - avgRecordsPerSecond, 2), 0) / recentMetrics.length;
      const standardDeviation = Math.sqrt(variance);
      
      // Higher confidence when processing rate is consistent
      confidence = Math.max(0, Math.min(100, 100 - (standardDeviation / avgRecordsPerSecond * 100)));
    }

    return { eta, confidence: Math.round(confidence) };
  }

  /**
   * Generate detailed status report
   */
  generateStatusReport(): {
    migration: MigrationMetrics | null;
    phases: PhaseMetrics[];
    eta: { eta: Date | null; confidence: number };
    alerts: string[];
    recommendations: string[];
  } {
    const metrics = this.getCurrentMetrics();
    const phases = this.getPhaseMetrics();
    const eta = this.getETA();
    const alerts: string[] = [];
    const recommendations: string[] = [];

    // Generate alerts based on metrics
    if (metrics) {
      if (metrics.errorsCount > 0) {
        alerts.push(`${metrics.errorsCount} errors detected during migration`);
      }
      
      if (metrics.recordsPerSecond < 10 && metrics.recordsProcessed > 100) {
        alerts.push('Migration processing speed is below optimal threshold');
        recommendations.push('Consider increasing database connection pool size or optimizing queries');
      }

      const memoryUsageMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
      if (memoryUsageMB > 1000) {
        alerts.push(`High memory usage detected: ${Math.round(memoryUsageMB)}MB`);
        recommendations.push('Monitor memory usage and consider processing data in smaller batches');
      }

      if (metrics.progressPercentage === 0 && metrics.elapsedTime > 300000) { // 5 minutes
        alerts.push('No progress detected for over 5 minutes');
        recommendations.push('Check for stuck operations or database connectivity issues');
      }
    }

    return {
      migration: metrics,
      phases,
      eta,
      alerts,
      recommendations
    };
  }

  /**
   * End migration monitoring
   */
  endMigration(status: 'completed' | 'failed' | 'cancelled' = 'completed'): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }

    const metrics = this.getCurrentMetrics();
    if (metrics) {
      this.migrationLogger.logInfo('monitoring_end', `Ended monitoring migration: ${this.currentMigrationId}`, {
        migrationId: this.currentMigrationId,
        status,
        totalDuration: metrics.elapsedTime,
        recordsProcessed: this.recordsProcessed,
        errorsCount: this.errorsCount
      });
    }

    this.emit('migration_completed', { 
      migrationId: this.currentMigrationId, 
      status, 
      finalMetrics: metrics 
    });

    // Reset state
    this.currentMigrationId = undefined;
    this.migrationStartTime = undefined;
  }

  /**
   * Start real-time monitoring updates
   */
  private startRealTimeMonitoring(): void {
    // Update metrics every 5 seconds
    this.updateInterval = setInterval(() => {
      const metrics = this.getCurrentMetrics();
      if (metrics) {
        this.metricsHistory.push(metrics);
        
        // Keep only last 100 entries to prevent memory issues
        if (this.metricsHistory.length > 100) {
          this.metricsHistory = this.metricsHistory.slice(-100);
        }

        this.emit('metrics_updated', metrics);
      }
    }, 5000);
  }

  /**
   * Get current phase from migration logger
   */
  private getCurrentPhase(): MigrationPhase | null {
    // Find the most recent phase that has started but not ended
    for (const [phase, metrics] of this.phaseMetrics.entries()) {
      if (metrics.status === 'in_progress') {
        return phase;
      }
    }
    return null;
  }

  /**
   * Save metrics to database for historical analysis
   */
  async saveMetricsSnapshot(): Promise<void> {
    const metrics = this.getCurrentMetrics();
    if (!metrics) return;

    try {
      await this.prisma.migrationMetrics.create({
        data: {
          migrationId: metrics.migrationId,
          phase: metrics.phase,
          timestamp: metrics.currentTime,
          elapsedTime: metrics.elapsedTime,
          progressPercentage: metrics.progressPercentage,
          recordsProcessed: metrics.recordsProcessed,
          totalRecords: metrics.totalRecords,
          recordsPerSecond: metrics.recordsPerSecond,
          errorsCount: metrics.errorsCount,
          warningsCount: metrics.warningsCount,
          tablesProcessed: metrics.tablesProcessed,
          totalTables: metrics.totalTables,
          filesProcessed: metrics.filesProcessed,
          totalFiles: metrics.totalFiles,
          bytesProcessed: metrics.bytesProcessed,
          totalBytes: metrics.totalBytes,
          memoryUsageMB: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
          cpuUsagePercent: metrics.cpuUsage ? Math.round((metrics.cpuUsage.user + metrics.cpuUsage.system) / 1000) : null
        }
      });
    } catch (error) {
      this.logger.error(`Failed to save metrics snapshot: ${error.message}`);
    }
  }

  /**
   * Get historical metrics for analysis
   */
  async getHistoricalMetrics(migrationId: string): Promise<any[]> {
    return this.prisma.migrationMetrics.findMany({
      where: { migrationId },
      orderBy: { timestamp: 'asc' }
    });
  }
}