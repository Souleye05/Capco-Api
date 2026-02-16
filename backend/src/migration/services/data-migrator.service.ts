import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  MigrationData, 
  MigrationReport, 
  TableMigrationResult, 
  TableMigrationFailure,
  DataExportOptions,
  DataImportOptions,
  MigrationProgress,
  TableImportProgress,
  DataIntegrityCheck,
  MigrationCheckpoint,
  RecordValidationResult
} from '../types/data-migration.types';
import { SchemaExtractorService, TableMetadata } from './schema-extractor.service';
import { MigrationLoggerService } from './migration-logger.service';
import * as crypto from 'crypto';

@Injectable()
export class DataMigratorService {
  private readonly logger = new Logger(DataMigratorService.name);
  private supabaseClient: SupabaseClient;
  private migrationId: string;
  private currentProgress: MigrationProgress | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private schemaExtractor: SchemaExtractorService,
    private migrationLogger: MigrationLoggerService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is required for data migration');
    }
    
    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    this.migrationId = this.generateMigrationId();
  }

  /**
   * Perform complete data migration from Supabase to PostgreSQL
   * Requirements: 1.5, 1.6, 1.7, 1.8, 1.9
   */
  async migrateAllData(
    exportOptions: DataExportOptions = {},
    importOptions: DataImportOptions = {}
  ): Promise<MigrationReport> {
    const startTime = new Date();
    this.logger.log(`Starting complete data migration with ID: ${this.migrationId}`);
    
    await this.migrationLogger.createAuditEntry(
      'migration_start',
      'data_migration',
      'success',
      {
        additionalDetails: {
          migrationId: this.migrationId,
          exportOptions,
          importOptions,
        }
      }
    );

    const report: MigrationReport = {
      migrationId: this.migrationId,
      startTime,
      totalTables: 0,
      successfulTables: 0,
      failedTables: [],
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      tableResults: [],
      status: 'IN_PROGRESS',
    };

    try {
      // Phase 1: Export all data from Supabase
      this.logger.log('Phase 1: Exporting data from Supabase');
      const exportedData = await this.exportAllData(exportOptions);
      
      report.totalTables = Object.keys(exportedData).length;
      report.totalRecords = Object.values(exportedData).reduce((sum, records) => sum + records.length, 0);
      
      this.currentProgress = {
        migrationId: this.migrationId,
        currentPhase: 'IMPORT',
        totalTables: report.totalTables,
        processedTables: 0,
        overallProgress: 25, // Export complete
        startTime,
      };

      // Phase 2: Import data to PostgreSQL with validation
      this.logger.log('Phase 2: Importing data to PostgreSQL');
      const importResults = await this.importAllData(exportedData, importOptions);
      
      report.tableResults = importResults;
      report.successfulTables = importResults.filter(r => r.failedRecords === 0).length;
      report.migratedRecords = importResults.reduce((sum, r) => sum + r.migratedRecords, 0);
      report.failedRecords = importResults.reduce((sum, r) => sum + r.failedRecords, 0);
      
      // Collect failed tables
      report.failedTables = importResults
        .filter(r => r.failedRecords > 0)
        .map(r => ({
          tableName: r.tableName,
          error: r.errors.join('; '),
          recordCount: r.totalRecords,
          failedAt: r.endTime || new Date(),
        }));

      this.currentProgress.currentPhase = 'VALIDATION';
      this.currentProgress.overallProgress = 75;

      // Phase 3: Validate migration integrity
      this.logger.log('Phase 3: Validating migration integrity');
      const validationResults = await this.validateMigrationIntegrity(exportedData);
      report.validationResults = validationResults;

      const endTime = new Date();
      report.endTime = endTime;
      report.totalDuration = endTime.getTime() - startTime.getTime();
      report.status = report.failedTables.length === 0 ? 'COMPLETED' : 'FAILED';

      this.currentProgress.currentPhase = 'COMPLETE';
      this.currentProgress.overallProgress = 100;
      this.currentProgress.estimatedCompletion = endTime;

      await this.migrationLogger.createAuditEntry(
        'migration_complete',
        'data_migration',
        report.status === 'COMPLETED' ? 'success' : 'failure',
        {
          additionalDetails: {
            migrationId: this.migrationId,
            totalRecords: report.totalRecords,
            migratedRecords: report.migratedRecords,
            failedRecords: report.failedRecords,
            duration: report.totalDuration,
          }
        }
      );

      this.logger.log(`Data migration completed: ${report.status}`);
      this.logger.log(`Migrated ${report.migratedRecords}/${report.totalRecords} records across ${report.successfulTables}/${report.totalTables} tables`);
      
      return report;

    } catch (error) {
      const endTime = new Date();
      report.endTime = endTime;
      report.totalDuration = endTime.getTime() - startTime.getTime();
      report.status = 'FAILED';
      
      await this.migrationLogger.logError(
        'migration_error',
        `Data migration failed: ${error.message}`,
        error,
        {
          migrationId: this.migrationId,
          phase: this.currentProgress?.currentPhase || 'UNKNOWN',
          progress: this.currentProgress?.overallProgress || 0,
        }
      );

      this.logger.error(`Data migration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Export all data from Supabase with preservation of UUIDs and timestamps
   */
  async exportAllData(options: DataExportOptions = {}): Promise<MigrationData> {
    this.logger.log('Starting data export from Supabase');
    
    const {
      batchSize = 1000,
      excludeTables = [],
      includeTables = [],
      preserveTimestamps = true,
      validateIntegrity = true,
    } = options;

    // Get all public tables from schema
    const schema = await this.schemaExtractor.extractCompleteSchema();
    let tablesToExport = schema.tables.filter(table => 
      !this.isInternalTable(table.name) &&
      !excludeTables.includes(table.name)
    );

    if (includeTables.length > 0) {
      tablesToExport = tablesToExport.filter(table => includeTables.includes(table.name));
    }

    const exportedData: MigrationData = {};
    const exportOrder = this.getExportOrder(tablesToExport);

    this.logger.log(`Exporting ${exportOrder.length} tables in dependency order`);

    for (const tableName of exportOrder) {
      try {
        this.logger.log(`Exporting table: ${tableName}`);
        const tableData = await this.exportTableData(tableName, batchSize, preserveTimestamps);
        exportedData[tableName] = tableData;
        
        if (validateIntegrity) {
          await this.validateExportedTableData(tableName, tableData);
        }
        
        this.logger.log(`Exported ${tableData.length} records from ${tableName}`);
        
      } catch (error) {
        this.logger.error(`Failed to export table ${tableName}: ${error.message}`);
        throw new Error(`Export failed for table ${tableName}: ${error.message}`);
      }
    }

    this.logger.log(`Data export completed: ${Object.keys(exportedData).length} tables`);
    return exportedData;
  }

  /**
   * Export data from a specific table with batching
   */
  private async exportTableData(
    tableName: string, 
    batchSize: number, 
    preserveTimestamps: boolean
  ): Promise<any[]> {
    const allRecords: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.supabaseClient
        .from(tableName)
        .select('*')
        .range(offset, offset + batchSize - 1)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to export ${tableName} at offset ${offset}: ${error.message}`);
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // Process records to preserve UUIDs and timestamps
      const processedRecords = data.map(record => this.processExportedRecord(record, preserveTimestamps));
      allRecords.push(...processedRecords);

      offset += batchSize;
      hasMore = data.length === batchSize;

      // Log progress for large tables
      if (allRecords.length % 10000 === 0) {
        this.logger.debug(`Exported ${allRecords.length} records from ${tableName}`);
      }
    }

    return allRecords;
  }

  /**
   * Process exported record to preserve data integrity
   */
  private processExportedRecord(record: any, preserveTimestamps: boolean): any {
    const processed = { ...record };

    // Ensure UUIDs are preserved as strings
    for (const [key, value] of Object.entries(processed)) {
      if (typeof value === 'string' && this.isUUID(value)) {
        processed[key] = value; // Keep as string
      }
      
      // Preserve timestamp formats
      if (preserveTimestamps && this.isTimestamp(key) && value) {
        processed[key] = new Date(value as string | number | Date).toISOString();
      }
    }

    return processed;
  }

  /**
   * Import all data to PostgreSQL with transactional integrity
   */
  async importAllData(
    migrationData: MigrationData, 
    options: DataImportOptions = {}
  ): Promise<TableMigrationResult[]> {
    this.logger.log('Starting data import to PostgreSQL');
    
    const {
      batchSize = 100,
      skipValidation = false,
      continueOnError = false,
      preserveIds = true,
      transactional = true,
    } = options;

    const results: TableMigrationResult[] = [];
    const importOrder = this.getImportOrder(Object.keys(migrationData));

    this.logger.log(`Importing ${importOrder.length} tables in dependency order`);

    for (let i = 0; i < importOrder.length; i++) {
      const tableName = importOrder[i];
      const tableData = migrationData[tableName];
      
      if (!tableData || tableData.length === 0) {
        this.logger.warn(`No data to import for table: ${tableName}`);
        continue;
      }

      this.currentProgress!.processedTables = i;
      this.currentProgress!.currentTable = {
        tableName,
        totalRecords: tableData.length,
        processedRecords: 0,
        failedRecords: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(tableData.length / batchSize),
        startTime: new Date(),
      };

      try {
        this.logger.log(`Importing table: ${tableName} (${tableData.length} records)`);
        const result = await this.importTableData(
          tableName, 
          tableData, 
          batchSize, 
          skipValidation, 
          preserveIds, 
          transactional
        );
        
        results.push(result);
        
        if (result.failedRecords > 0 && !continueOnError) {
          throw new Error(`Import failed for table ${tableName}: ${result.errors.join('; ')}`);
        }
        
        this.logger.log(`Imported ${result.migratedRecords}/${result.totalRecords} records to ${tableName}`);
        
      } catch (error) {
        const failedResult: TableMigrationResult = {
          tableName,
          totalRecords: tableData.length,
          migratedRecords: 0,
          failedRecords: tableData.length,
          errors: [error.message],
          startTime: new Date(),
          endTime: new Date(),
        };
        
        results.push(failedResult);
        
        if (!continueOnError) {
          throw error;
        }
        
        this.logger.error(`Failed to import table ${tableName}, continuing: ${error.message}`);
      }
    }

    this.logger.log(`Data import completed: ${results.length} tables processed`);
    return results;
  }

  /**
   * Import data for a specific table with batch processing and validation
   */
  private async importTableData(
    tableName: string,
    records: any[],
    batchSize: number,
    skipValidation: boolean,
    preserveIds: boolean,
    transactional: boolean
  ): Promise<TableMigrationResult> {
    const startTime = new Date();
    const result: TableMigrationResult = {
      tableName,
      totalRecords: records.length,
      migratedRecords: 0,
      failedRecords: 0,
      errors: [],
      startTime,
    };

    const batches = this.chunkArray(records, batchSize);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      this.currentProgress!.currentTable!.currentBatch = batchIndex + 1;
      this.currentProgress!.currentTable!.processedRecords = batchIndex * batchSize;

      try {
        if (transactional) {
          await this.prisma.$transaction(async (tx) => {
            await this.importBatch(tx, tableName, batch, skipValidation, preserveIds);
          });
        } else {
          await this.importBatch(this.prisma, tableName, batch, skipValidation, preserveIds);
        }
        
        result.migratedRecords += batch.length;
        
      } catch (error) {
        result.failedRecords += batch.length;
        result.errors.push(`Batch ${batchIndex + 1}: ${error.message}`);
        
        this.logger.error(`Failed to import batch ${batchIndex + 1} for ${tableName}: ${error.message}`);
        
        // Try individual records if batch fails
        if (batch.length > 1) {
          const individualResults = await this.importRecordsIndividually(
            tableName, 
            batch, 
            skipValidation, 
            preserveIds
          );
          
          result.migratedRecords += individualResults.successful;
          result.failedRecords -= batch.length; // Remove batch failure
          result.failedRecords += individualResults.failed;
          
          if (individualResults.errors.length > 0) {
            result.errors.push(...individualResults.errors);
          }
        }
      }
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - startTime.getTime();
    
    return result;
  }

  /**
   * Import a batch of records using raw SQL for better performance
   */
  private async importBatch(
    prismaClient: any,
    tableName: string,
    records: any[],
    skipValidation: boolean,
    preserveIds: boolean
  ): Promise<void> {
    if (records.length === 0) return;

    // Validate records before import
    if (!skipValidation) {
      for (const record of records) {
        const validation = await this.validateRecord(tableName, record);
        if (!validation.isValid) {
          throw new Error(`Record validation failed: ${validation.errors.join('; ')}`);
        }
      }
    }

    // Generate INSERT query with conflict resolution
    const insertQuery = this.generateBatchInsertQuery(tableName, records, preserveIds);
    
    try {
      await prismaClient.$executeRawUnsafe(insertQuery);
    } catch (error) {
      throw new Error(`Batch insert failed for ${tableName}: ${error.message}`);
    }
  }

  /**
   * Import records individually when batch import fails
   */
  private async importRecordsIndividually(
    tableName: string,
    records: any[],
    skipValidation: boolean,
    preserveIds: boolean
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        const insertQuery = this.generateSingleInsertQuery(tableName, record, preserveIds);
        await this.prisma.$executeRawUnsafe(insertQuery);
        successful++;
      } catch (error) {
        failed++;
        errors.push(`Record ${record.id || 'unknown'}: ${error.message}`);
      }
    }

    return { successful, failed, errors };
  }

  /**
   * Generate batch INSERT query with conflict resolution
   */
  private generateBatchInsertQuery(tableName: string, records: any[], preserveIds: boolean): string {
    if (records.length === 0) return '';

    const columns = Object.keys(records[0]);
    const columnsList = columns.map(col => `"${col}"`).join(', ');
    
    const valuesList = records.map(record => {
      const values = columns.map(col => {
        const value = record[col];
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        return String(value);
      }).join(', ');
      return `(${values})`;
    }).join(', ');

    const conflictResolution = preserveIds ? 'ON CONFLICT DO NOTHING' : 'ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at';
    
    return `INSERT INTO "${tableName}" (${columnsList}) VALUES ${valuesList} ${conflictResolution};`;
  }

  /**
   * Generate single INSERT query
   */
  private generateSingleInsertQuery(tableName: string, record: any, preserveIds: boolean): string {
    return this.generateBatchInsertQuery(tableName, [record], preserveIds);
  }

  /**
   * Validate migration integrity by comparing source and target data
   */
  async validateMigrationIntegrity(migrationData: MigrationData): Promise<{
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warnings: string[];
    errors: string[];
  }> {
    this.logger.log('Starting migration integrity validation');
    
    const checks: DataIntegrityCheck[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const [tableName, sourceData] of Object.entries(migrationData)) {
      try {
        // Check record counts
        const targetCount = await this.getTableRecordCount(tableName);
        const sourceCount = sourceData.length;
        
        checks.push({
          checkType: 'RECORD_COUNT',
          tableName,
          expected: sourceCount,
          actual: targetCount,
          passed: sourceCount === targetCount,
          details: `Source: ${sourceCount}, Target: ${targetCount}`,
        });

        if (sourceCount !== targetCount) {
          errors.push(`Record count mismatch for ${tableName}: expected ${sourceCount}, got ${targetCount}`);
        }

        // Sample data integrity checks
        if (sourceData.length > 0) {
          const sampleSize = Math.min(10, sourceData.length);
          const sampleRecords = sourceData.slice(0, sampleSize);
          
          for (const record of sampleRecords) {
            const targetRecord = await this.getRecordById(tableName, record.id);
            if (!targetRecord) {
              errors.push(`Missing record in ${tableName}: ${record.id}`);
            } else {
              const dataMatch = await this.compareRecords(record, targetRecord);
              if (!dataMatch.passed) {
                warnings.push(`Data mismatch in ${tableName} record ${record.id}: ${dataMatch.details}`);
              }
            }
          }
        }

      } catch (error) {
        errors.push(`Validation failed for ${tableName}: ${error.message}`);
      }
    }

    const passedChecks = checks.filter(c => c.passed).length;
    const failedChecks = checks.length - passedChecks;

    this.logger.log(`Migration validation completed: ${passedChecks}/${checks.length} checks passed`);
    
    return {
      totalChecks: checks.length,
      passedChecks,
      failedChecks,
      warnings,
      errors,
    };
  }

  /**
   * Get current migration progress
   */
  getMigrationProgress(): MigrationProgress | null {
    return this.currentProgress;
  }

  /**
   * Create migration checkpoint
   */
  async createCheckpoint(phase: string, metadata: Record<string, any> = {}): Promise<MigrationCheckpoint> {
    const checkpoint: MigrationCheckpoint = {
      checkpointId: crypto.randomUUID(),
      migrationId: this.migrationId,
      phase,
      recordsProcessed: this.currentProgress?.processedTables || 0,
      timestamp: new Date(),
      metadata,
    };

    await this.migrationLogger.logInfo('checkpoint_created', `Migration checkpoint created: ${checkpoint.checkpointId}`, {
      checkpointId: checkpoint.checkpointId,
      migrationId: checkpoint.migrationId,
      phase: checkpoint.phase,
      recordsProcessed: checkpoint.recordsProcessed,
    });
    
    return checkpoint;
  }

  // Helper methods
  private generateMigrationId(): string {
    return `migration_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private isInternalTable(tableName: string): boolean {
    const internalTables = [
      'schema_migrations',
      'supabase_migrations',
      '_prisma_migrations',
      'auth',
      'storage',
      'realtime',
      'extensions',
    ];
    
    return internalTables.some(internal => 
      tableName.startsWith(internal) || tableName.includes(`_${internal}_`)
    );
  }

  private getExportOrder(tables: TableMetadata[]): string[] {
    // Simple dependency ordering - in production would use topological sort
    const independentTables = tables.filter(t => 
      !t.columns.some(c => c.isForeignKey)
    ).map(t => t.name);
    
    const dependentTables = tables.filter(t => 
      t.columns.some(c => c.isForeignKey)
    ).map(t => t.name);
    
    return [...independentTables, ...dependentTables];
  }

  private getImportOrder(tableNames: string[]): string[] {
    // Simple ordering - independent tables first
    const knownOrder = [
      'users', 'user_roles', 'affaires', 'audiences', 
      'dossiers_recouvrement', 'files', 'file_references'
    ];
    
    const ordered = knownOrder.filter(name => tableNames.includes(name));
    const remaining = tableNames.filter(name => !knownOrder.includes(name));
    
    return [...ordered, ...remaining];
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private isTimestamp(key: string): boolean {
    const timestampKeys = ['created_at', 'updated_at', 'deleted_at', 'last_sign_in_at', 'email_confirmed_at'];
    return timestampKeys.includes(key.toLowerCase());
  }

  private async validateExportedTableData(tableName: string, data: any[]): Promise<void> {
    // Basic validation - check for required fields, data types, etc.
    if (data.length === 0) return;
    
    const sample = data[0];
    if (!sample.id) {
      throw new Error(`Table ${tableName} records missing required 'id' field`);
    }
  }

  private async validateRecord(tableName: string, record: any): Promise<RecordValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!record.id) {
      errors.push('Missing required id field');
    }

    // Add more specific validations based on table schema
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async getTableRecordCount(tableName: string): Promise<number> {
    try {
      const result = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return parseInt((result as any)[0].count);
    } catch (error) {
      throw new Error(`Failed to get record count for ${tableName}: ${error.message}`);
    }
  }

  private async getRecordById(tableName: string, id: string): Promise<any> {
    try {
      const result = await this.prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}" WHERE id = $1`, id);
      return (result as any[])[0] || null;
    } catch (error) {
      return null;
    }
  }

  private async compareRecords(source: any, target: any): Promise<{ passed: boolean; details?: string }> {
    // Simple comparison - in production would be more sophisticated
    const sourceKeys = Object.keys(source).sort();
    const targetKeys = Object.keys(target).sort();
    
    if (sourceKeys.length !== targetKeys.length) {
      return { passed: false, details: 'Different number of fields' };
    }
    
    for (const key of sourceKeys) {
      if (source[key] !== target[key]) {
        // Allow for timestamp format differences
        if (this.isTimestamp(key)) {
          const sourceDate = new Date(source[key]).getTime();
          const targetDate = new Date(target[key]).getTime();
          if (Math.abs(sourceDate - targetDate) > 1000) { // 1 second tolerance
            return { passed: false, details: `Timestamp mismatch for ${key}` };
          }
        } else {
          return { passed: false, details: `Value mismatch for ${key}` };
        }
      }
    }
    
    return { passed: true };
  }
}