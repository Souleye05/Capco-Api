import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import * as fs from 'fs-extra';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum MigrationPhase {
  INITIALIZATION = 'initialization',
  SCHEMA_EXTRACTION = 'schema_extraction',
  DATA_MIGRATION = 'data_migration',
  USER_MIGRATION = 'user_migration',
  FILE_MIGRATION = 'file_migration',
  VALIDATION = 'validation',
  ROLLBACK = 'rollback',
  COMPLETION = 'completion'
}

export interface StructuredLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  phase: MigrationPhase;
  component: string;
  operation: string;
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
  duration?: number;
  recordsProcessed?: number;
  errorCode?: string;
  remediationSteps?: string[];
}

export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  result: 'success' | 'failure' | 'partial';
  details?: Record<string, any>;
}

@Injectable()
export class MigrationLoggerService {
  private readonly logger = new Logger(MigrationLoggerService.name);
  private readonly logDir = process.env.MIGRATION_LOG_DIR || './migration-logs';
  private readonly auditDir = process.env.AUDIT_LOG_DIR || './audit-logs';
  private currentPhase: MigrationPhase = MigrationPhase.INITIALIZATION;
  private operationStartTimes = new Map<string, Date>();

  constructor(private prisma: PrismaService) {
    this.ensureLogDirectories();
  }

  private async ensureLogDirectories(): Promise<void> {
    await fs.ensureDir(this.logDir);
    await fs.ensureDir(this.auditDir);
  }

  /**
   * Set the current migration phase for context
   */
  setCurrentPhase(phase: MigrationPhase): void {
    this.currentPhase = phase;
    this.logInfo('phase_change', `Migration phase changed to: ${phase}`, {
      previousPhase: this.currentPhase,
      newPhase: phase
    });
  }

  /**
   * Start timing an operation
   */
  startOperation(operationId: string): void {
    this.operationStartTimes.set(operationId, new Date());
  }

  /**
   * End timing an operation and return duration
   */
  endOperation(operationId: string): number {
    const startTime = this.operationStartTimes.get(operationId);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime.getTime();
    this.operationStartTimes.delete(operationId);
    return duration;
  }

  /**
   * Log debug information
   */
  logDebug(operation: string, message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, operation, message, context);
  }

  /**
   * Log informational messages
   */
  logInfo(operation: string, message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, operation, message, context);
  }

  /**
   * Log warnings
   */
  logWarn(operation: string, message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, operation, message, context);
  }

  /**
   * Log errors with detailed context and remediation steps
   */
  logError(
    operation: string, 
    message: string, 
    error?: Error, 
    context?: Record<string, any>,
    remediationSteps?: string[]
  ): void {
    const logContext = {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
    };

    this.log(LogLevel.ERROR, operation, message, logContext, error?.stack, undefined, remediationSteps);
  }

  /**
   * Log critical errors that require immediate attention
   */
  logCritical(
    operation: string, 
    message: string, 
    error?: Error, 
    context?: Record<string, any>,
    remediationSteps?: string[]
  ): void {
    const logContext = {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
    };

    this.log(LogLevel.CRITICAL, operation, message, logContext, error?.stack, undefined, remediationSteps);
  }

  /**
   * Log migration progress with metrics
   */
  logProgress(
    operation: string,
    message: string,
    recordsProcessed: number,
    totalRecords?: number,
    context?: Record<string, any>
  ): void {
    const progressContext = {
      ...context,
      recordsProcessed,
      totalRecords,
      progressPercentage: totalRecords ? Math.round((recordsProcessed / totalRecords) * 100) : undefined
    };

    this.log(LogLevel.INFO, operation, message, progressContext, undefined, undefined, undefined, recordsProcessed);
  }

  /**
   * Core logging method with structured format
   */
  private async log(
    level: LogLevel,
    operation: string,
    message: string,
    context?: Record<string, any>,
    stackTrace?: string,
    duration?: number,
    remediationSteps?: string[],
    recordsProcessed?: number
  ): Promise<void> {
    const logEntry: StructuredLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      phase: this.currentPhase,
      component: 'MigrationSystem',
      operation,
      message,
      context,
      stackTrace,
      duration,
      recordsProcessed,
      remediationSteps
    };

    // Log to console with appropriate level
    this.logToConsole(logEntry);

    // Save to structured log file
    await this.saveToLogFile(logEntry);

    // Save to database for querying
    await this.saveToDatabase(logEntry);

    // Trigger alerts for critical issues
    if (level === LogLevel.CRITICAL || level === LogLevel.ERROR) {
      await this.triggerAlert(logEntry);
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: StructuredLogEntry): void {
    const contextStr = entry.context ? JSON.stringify(entry.context) : '';
    const logMessage = `[${entry.phase}] ${entry.operation}: ${entry.message} ${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        this.logger.debug(logMessage);
        break;
      case LogLevel.INFO:
        this.logger.log(logMessage);
        break;
      case LogLevel.WARN:
        this.logger.warn(logMessage);
        break;
      case LogLevel.ERROR:
        this.logger.error(logMessage, entry.stackTrace);
        break;
      case LogLevel.CRITICAL:
        this.logger.error(`🚨 CRITICAL: ${logMessage}`, entry.stackTrace);
        break;
    }
  }

  /**
   * Save log entry to structured file
   */
  private async saveToLogFile(entry: StructuredLogEntry): Promise<void> {
    try {
      const logFileName = `migration-${new Date().toISOString().split('T')[0]}.jsonl`;
      const logFilePath = path.join(this.logDir, logFileName);
      
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(logFilePath, logLine);
    } catch (error) {
      this.logger.error(`Failed to write to log file: ${error.message}`);
    }
  }

  /**
   * Save log entry to database
   */
  private async saveToDatabase(entry: StructuredLogEntry): Promise<void> {
    try {
      await this.prisma.migrationLogEntry.create({
        data: {
          id: entry.id,
          level: entry.level.toString(),
          phase: entry.phase.toString(),
          component: entry.component,
          operation: entry.operation,
          message: entry.message,
          context: entry.context || {},
          stackTrace: entry.stackTrace,
          duration: entry.duration,
          recordsProcessed: entry.recordsProcessed,
          remediationSteps: entry.remediationSteps || [],
          timestamp: entry.timestamp
        }
      });
    } catch (error) {
      this.logger.error(`Failed to save log to database: ${error.message}`);
    }
  }

  /**
   * Create audit trail entry for compliance
   */
  async createAuditEntry(
    action: string,
    resource: string,
    result: 'success' | 'failure' | 'partial',
    details?: {
      userId?: string;
      resourceId?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      additionalDetails?: Record<string, any>;
    }
  ): Promise<void> {
    const auditEntry: AuditTrailEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      userId: details?.userId,
      action,
      resource,
      resourceId: details?.resourceId,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      sessionId: details?.sessionId,
      result,
      details: details?.additionalDetails
    };

    // Save to audit log file
    await this.saveAuditToFile(auditEntry);

    // Save to database
    await this.saveAuditToDatabase(auditEntry);

    this.logInfo('audit_trail', `Audit entry created: ${action} on ${resource}`, {
      auditId: auditEntry.id,
      result
    });
  }

  /**
   * Save audit entry to file
   */
  private async saveAuditToFile(entry: AuditTrailEntry): Promise<void> {
    try {
      const auditFileName = `audit-${new Date().toISOString().split('T')[0]}.jsonl`;
      const auditFilePath = path.join(this.auditDir, auditFileName);
      
      const auditLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(auditFilePath, auditLine);
    } catch (error) {
      this.logger.error(`Failed to write to audit file: ${error.message}`);
    }
  }

  /**
   * Save audit entry to database
   */
  private async saveAuditToDatabase(entry: AuditTrailEntry): Promise<void> {
    try {
      await this.prisma.auditTrail.create({
        data: {
          id: entry.id,
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          oldValues: entry.oldValues || {},
          newValues: entry.newValues || {},
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          sessionId: entry.sessionId,
          result: entry.result,
          details: entry.details || {},
          timestamp: entry.timestamp
        }
      });
    } catch (error) {
      this.logger.error(`Failed to save audit to database: ${error.message}`);
    }
  }

  /**
   * Trigger alert for critical issues
   */
  private async triggerAlert(entry: StructuredLogEntry): Promise<void> {
    // This will be implemented by the AlertService
    this.logger.warn(`Alert triggered for ${entry.level} in ${entry.operation}: ${entry.message}`);
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log checkpoint validation results
   */
  async logCheckpointValidation(validationResult: any): Promise<void> {
    const operation = `checkpoint_validation_${validationResult.phase}`;
    const message = `Phase ${validationResult.phase} checkpoint validation ${validationResult.status}`;
    
    const context = {
      phase: validationResult.phase,
      status: validationResult.status,
      totalChecks: validationResult.summary.totalChecks,
      passedChecks: validationResult.summary.passedChecks,
      failedChecks: validationResult.summary.failedChecks,
      warningChecks: validationResult.summary.warningChecks,
      criticalIssues: validationResult.summary.criticalIssues.length,
      canProceedToNextPhase: validationResult.canProceedToNextPhase,
      duration: validationResult.endTime ? 
        validationResult.endTime.getTime() - validationResult.startTime.getTime() : null
    };

    if (validationResult.status === 'failed') {
      this.logError(operation, message, undefined, context, validationResult.summary.recommendations);
    } else if (validationResult.status === 'warning') {
      this.logWarn(operation, message, context);
    } else {
      this.logInfo(operation, message, context);
    }

    // Create audit trail entry
    await this.createAuditEntry(
      'checkpoint_validation',
      `phase_${validationResult.phase}`,
      validationResult.status === 'passed' ? 'success' : 
      validationResult.status === 'failed' ? 'failure' : 'partial',
      {
        additionalDetails: {
          validationSummary: validationResult.summary,
          userQuestions: validationResult.userQuestions,
          recommendations: validationResult.summary.recommendations
        }
      }
    );
  }

  /**
   * Get logs by phase
   */
  async getLogsByPhase(phase: MigrationPhase, limit = 100): Promise<StructuredLogEntry[]> {
    const logs = await this.prisma.migrationLogEntry.findMany({
      where: { phase: phase.toString() },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level as LogLevel,
      phase: log.phase as MigrationPhase,
      component: log.component,
      operation: log.operation,
      message: log.message,
      context: log.context as Record<string, any>,
      stackTrace: log.stackTrace,
      duration: log.duration,
      recordsProcessed: log.recordsProcessed,
      remediationSteps: log.remediationSteps as string[]
    }));
  }

  /**
   * Get error logs with remediation steps
   */
  async getErrorLogs(limit = 50): Promise<StructuredLogEntry[]> {
    const logs = await this.prisma.migrationLogEntry.findMany({
      where: {
        level: {
          in: [LogLevel.ERROR.toString(), LogLevel.CRITICAL.toString()]
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level as LogLevel,
      phase: log.phase as MigrationPhase,
      component: log.component,
      operation: log.operation,
      message: log.message,
      context: log.context as Record<string, any>,
      stackTrace: log.stackTrace,
      duration: log.duration,
      recordsProcessed: log.recordsProcessed,
      remediationSteps: log.remediationSteps as string[]
    }));
  }

  /**
   * Get audit trail for compliance reporting
   */
  async getAuditTrail(
    startDate?: Date,
    endDate?: Date,
    userId?: string,
    action?: string,
    limit = 1000
  ): Promise<AuditTrailEntry[]> {
    const where: any = {};
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const auditEntries = await this.prisma.auditTrail.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return auditEntries.map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp,
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      oldValues: entry.oldValues as Record<string, any>,
      newValues: entry.newValues as Record<string, any>,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      sessionId: entry.sessionId,
      result: entry.result as 'success' | 'failure' | 'partial',
      details: entry.details as Record<string, any>
    }));
  }
}