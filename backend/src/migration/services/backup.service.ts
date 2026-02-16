import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  BackupMetadata,
  BackupStatus,
  DatabaseBackupResult,
  UserBackupResult,
  StorageBackupResult,
  CompleteBackupResult,
  BackupValidationResult,
  FileBackupInfo,
  TableBackupInfo,
  BackupProgress,
  BackupPhase,
  BucketBackupInfo,
} from '../types/backup.types';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly supabase: SupabaseClient;
  private readonly backupPath: string;
  private readonly tempPath: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.backupPath = this.configService.get<string>('BACKUP_PATH') || './backups';
    this.tempPath = this.configService.get<string>('TEMP_PATH') || './temp';

    // Ensure backup and temp directories exist
    fs.ensureDirSync(this.backupPath);
    fs.ensureDirSync(this.tempPath);
  }

  /**
   * Create a complete backup of all Supabase data
   */
  async createCompleteBackup(description?: string): Promise<CompleteBackupResult> {
    const backupId = uuidv4();
    const timestamp = new Date();
    
    this.logger.log(`Starting complete backup with ID: ${backupId}`);

    try {
      // Create backup directory
      const backupDir = path.join(this.backupPath, backupId);
      await fs.ensureDir(backupDir);

      // Initialize progress tracking
      const progress: BackupProgress = {
        phase: BackupPhase.INITIALIZING,
        currentStep: 'Initializing backup process',
        progress: 0,
      };

      this.logger.log('Phase 1: Database backup');
      progress.phase = BackupPhase.DATABASE_BACKUP;
      const databaseBackup = await this.backupDatabase(backupId, backupDir);

      this.logger.log('Phase 2: User backup');
      progress.phase = BackupPhase.USER_BACKUP;
      const userBackup = await this.backupUsers(backupId, backupDir);

      this.logger.log('Phase 3: Storage backup');
      progress.phase = BackupPhase.STORAGE_BACKUP;
      const storageBackup = await this.backupStorage(backupId, backupDir);

      this.logger.log('Phase 4: Validation');
      progress.phase = BackupPhase.VALIDATION;
      const validation = await this.validateBackup(backupId, backupDir);

      if (!validation.isValid) {
        throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`);
      }

      // Calculate total size and overall checksum
      const totalSize = databaseBackup.size + userBackup.size + storageBackup.totalSize;
      const overallChecksum = this.calculateOverallChecksum([
        databaseBackup.checksum,
        userBackup.checksum,
        storageBackup.checksum,
      ]);

      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        description: description || `Complete backup created at ${timestamp.toISOString()}`,
        size: totalSize,
        checksum: overallChecksum,
        status: BackupStatus.COMPLETED,
      };

      // Save metadata
      await this.saveBackupMetadata(backupDir, metadata);

      progress.phase = BackupPhase.COMPLETED;
      progress.progress = 100;

      const result: CompleteBackupResult = {
        backupId,
        timestamp,
        database: databaseBackup,
        users: userBackup,
        storage: storageBackup,
        overallStatus: BackupStatus.COMPLETED,
        totalSize,
        overallChecksum,
        metadata,
      };

      this.logger.log(`Complete backup finished successfully. ID: ${backupId}, Size: ${this.formatBytes(totalSize)}`);
      return result;

    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Backup all database tables from public schema
   */
  private async backupDatabase(backupId: string, backupDir: string): Promise<DatabaseBackupResult> {
    const timestamp = new Date();
    const filePath = path.join(backupDir, 'database.json');
    
    try {
      this.logger.log('Starting database backup...');
      
      // Get all public schema tables
      const tables = await this.getPublicTables();
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      for (const tableName of tables) {
        this.logger.log(`Backing up table: ${tableName}`);
        
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          throw new Error(`Failed to backup table ${tableName}: ${error.message}`);
        }

        backupData[tableName] = data || [];
        totalRecords += (data || []).length;
        this.logger.log(`Backed up ${(data || []).length} records from ${tableName}`);
      }

      // Write backup data to file
      await fs.writeJson(filePath, backupData, { spaces: 2 });
      
      // Calculate file size and checksum
      const stats = await fs.stat(filePath);
      const fileBuffer = await fs.readFile(filePath);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const result: DatabaseBackupResult = {
        backupId,
        timestamp,
        filePath,
        size: stats.size,
        checksum,
        tableCount: tables.length,
        recordCount: totalRecords,
        status: BackupStatus.COMPLETED,
      };

      this.logger.log(`Database backup completed: ${tables.length} tables, ${totalRecords} records, ${this.formatBytes(stats.size)}`);
      return result;

    } catch (error) {
      this.logger.error(`Database backup failed: ${error.message}`);
      return {
        backupId,
        timestamp,
        filePath,
        size: 0,
        checksum: '',
        tableCount: 0,
        recordCount: 0,
        status: BackupStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Backup all users from auth.users
   */
  private async backupUsers(backupId: string, backupDir: string): Promise<UserBackupResult> {
    const timestamp = new Date();
    const filePath = path.join(backupDir, 'users.json');
    
    try {
      this.logger.log('Starting user backup...');
      
      // Get all users from auth.users using admin API
      const { data: authData, error } = await this.supabase.auth.admin.listUsers();

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      const users = authData.users || [];
      
      // Also get user profiles and metadata from public tables if they exist
      const userProfiles = await this.getUserProfiles();
      
      const backupData = {
        auth_users: users,
        user_profiles: userProfiles,
        backup_metadata: {
          total_users: users.length,
          backup_timestamp: timestamp.toISOString(),
          includes_profiles: userProfiles.length > 0,
        },
      };

      // Write backup data to file
      await fs.writeJson(filePath, backupData, { spaces: 2 });
      
      // Calculate file size and checksum
      const stats = await fs.stat(filePath);
      const fileBuffer = await fs.readFile(filePath);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const result: UserBackupResult = {
        backupId,
        timestamp,
        filePath,
        size: stats.size,
        checksum,
        userCount: users.length,
        status: BackupStatus.COMPLETED,
      };

      this.logger.log(`User backup completed: ${users.length} users, ${this.formatBytes(stats.size)}`);
      return result;

    } catch (error) {
      this.logger.error(`User backup failed: ${error.message}`);
      return {
        backupId,
        timestamp,
        filePath,
        size: 0,
        checksum: '',
        userCount: 0,
        status: BackupStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Backup all files from Supabase Storage
   */
  private async backupStorage(backupId: string, backupDir: string): Promise<StorageBackupResult> {
    const timestamp = new Date();
    const storageDir = path.join(backupDir, 'storage');
    await fs.ensureDir(storageDir);
    
    try {
      this.logger.log('Starting storage backup...');
      
      // Get all storage buckets
      const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets();

      if (bucketsError) {
        throw new Error(`Failed to list buckets: ${bucketsError.message}`);
      }

      const bucketBackups: BucketBackupInfo[] = [];
      let totalFiles = 0;
      let totalSize = 0;

      for (const bucket of buckets || []) {
        this.logger.log(`Backing up bucket: ${bucket.name}`);
        
        const bucketBackup = await this.backupBucket(bucket.name, storageDir);
        bucketBackups.push(bucketBackup);
        totalFiles += bucketBackup.fileCount;
        totalSize += bucketBackup.totalSize;
      }

      // Create storage manifest
      const manifest = {
        backup_id: backupId,
        timestamp: timestamp.toISOString(),
        total_buckets: buckets?.length || 0,
        total_files: totalFiles,
        total_size: totalSize,
        buckets: bucketBackups,
      };

      await fs.writeJson(path.join(storageDir, 'manifest.json'), manifest, { spaces: 2 });

      // Calculate overall storage checksum
      const checksums = bucketBackups.map(b => b.checksum);
      const overallChecksum = this.calculateOverallChecksum(checksums);

      const result: StorageBackupResult = {
        backupId,
        timestamp,
        backupPath: storageDir,
        totalFiles,
        totalSize,
        checksum: overallChecksum,
        buckets: bucketBackups,
        status: BackupStatus.COMPLETED,
      };

      this.logger.log(`Storage backup completed: ${buckets?.length || 0} buckets, ${totalFiles} files, ${this.formatBytes(totalSize)}`);
      return result;

    } catch (error) {
      this.logger.error(`Storage backup failed: ${error.message}`);
      return {
        backupId,
        timestamp,
        backupPath: storageDir,
        totalFiles: 0,
        totalSize: 0,
        checksum: '',
        buckets: [],
        status: BackupStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Backup a single storage bucket
   */
  private async backupBucket(bucketName: string, storageDir: string): Promise<BucketBackupInfo> {
    const bucketDir = path.join(storageDir, bucketName);
    await fs.ensureDir(bucketDir);
    
    try {
      // List all files in bucket
      const { data: files, error } = await this.supabase.storage
        .from(bucketName)
        .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

      if (error) {
        throw new Error(`Failed to list files in bucket ${bucketName}: ${error.message}`);
      }

      let fileCount = 0;
      let totalSize = 0;
      const fileChecksums: string[] = [];

      // Download all files
      for (const file of files || []) {
        if (file.name) {
          const fileBackup = await this.backupFile(bucketName, file.name, bucketDir);
          if (fileBackup) {
            fileCount++;
            totalSize += fileBackup.size;
            fileChecksums.push(fileBackup.checksum);
          }
        }
      }

      // Handle nested directories recursively
      await this.backupBucketRecursive(bucketName, '', bucketDir, fileChecksums);

      const checksum = this.calculateOverallChecksum(fileChecksums);

      return {
        bucketName,
        fileCount,
        totalSize,
        backupPath: bucketDir,
        checksum,
      };

    } catch (error) {
      this.logger.error(`Failed to backup bucket ${bucketName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recursively backup files in bucket directories
   */
  private async backupBucketRecursive(
    bucketName: string, 
    prefix: string, 
    baseDir: string, 
    checksums: string[]
  ): Promise<void> {
    const { data: files, error } = await this.supabase.storage
      .from(bucketName)
      .list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      this.logger.warn(`Failed to list files in ${bucketName}/${prefix}: ${error.message}`);
      return;
    }

    for (const file of files || []) {
      const fullPath = prefix ? `${prefix}/${file.name}` : file.name;
      
      if (file.metadata?.size !== undefined) {
        // It's a file
        const fileBackup = await this.backupFile(bucketName, fullPath, baseDir);
        if (fileBackup) {
          checksums.push(fileBackup.checksum);
        }
      } else {
        // It's a directory, recurse
        await this.backupBucketRecursive(bucketName, fullPath, baseDir, checksums);
      }
    }
  }

  /**
   * Backup a single file
   */
  private async backupFile(bucketName: string, filePath: string, bucketDir: string): Promise<FileBackupInfo | null> {
    try {
      // Download file
      const { data: fileData, error } = await this.supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        this.logger.warn(`Failed to download file ${bucketName}/${filePath}: ${error.message}`);
        return null;
      }

      // Create directory structure
      const localFilePath = path.join(bucketDir, filePath);
      await fs.ensureDir(path.dirname(localFilePath));

      // Write file
      const buffer = Buffer.from(await fileData.arrayBuffer());
      await fs.writeFile(localFilePath, buffer);

      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      return {
        fileName: path.basename(filePath),
        originalPath: filePath,
        backupPath: localFilePath,
        size: buffer.length,
        checksum,
        mimetype: fileData.type,
      };

    } catch (error) {
      this.logger.warn(`Failed to backup file ${bucketName}/${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate backup integrity
   */
  private async validateBackup(backupId: string, backupDir: string): Promise<BackupValidationResult> {
    const errors: string[] = [];
    let checksumMatch = true;
    let filesIntact = true;
    let databaseAccessible = true;

    try {
      // Validate database backup
      const dbPath = path.join(backupDir, 'database.json');
      if (await fs.pathExists(dbPath)) {
        try {
          const dbData = await fs.readJson(dbPath);
          if (!dbData || typeof dbData !== 'object') {
            errors.push('Database backup file is corrupted');
            databaseAccessible = false;
          }
        } catch (error) {
          errors.push(`Database backup validation failed: ${error.message}`);
          databaseAccessible = false;
        }
      } else {
        errors.push('Database backup file not found');
        databaseAccessible = false;
      }

      // Validate user backup
      const usersPath = path.join(backupDir, 'users.json');
      if (await fs.pathExists(usersPath)) {
        try {
          const userData = await fs.readJson(usersPath);
          if (!userData || !userData.auth_users) {
            errors.push('User backup file is corrupted');
          }
        } catch (error) {
          errors.push(`User backup validation failed: ${error.message}`);
        }
      } else {
        errors.push('User backup file not found');
      }

      // Validate storage backup
      const storageDir = path.join(backupDir, 'storage');
      const manifestPath = path.join(storageDir, 'manifest.json');
      if (await fs.pathExists(manifestPath)) {
        try {
          const manifest = await fs.readJson(manifestPath);
          if (!manifest || !manifest.buckets) {
            errors.push('Storage manifest is corrupted');
            filesIntact = false;
          }
        } catch (error) {
          errors.push(`Storage backup validation failed: ${error.message}`);
          filesIntact = false;
        }
      } else {
        errors.push('Storage backup manifest not found');
        filesIntact = false;
      }

    } catch (error) {
      errors.push(`Backup validation error: ${error.message}`);
      checksumMatch = false;
    }

    return {
      isValid: errors.length === 0,
      checksumMatch,
      filesIntact,
      databaseAccessible,
      errors,
      validationTimestamp: new Date(),
    };
  }

  /**
   * Get all public schema tables
   */
  private async getPublicTables(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_name', 'schema_migrations');

      if (error) {
        // Fallback to common tables if information_schema is not accessible
        this.logger.warn('Could not access information_schema, using fallback table list');
        return [
          'affaires',
          'audiences',
          'dossiers_recouvrement',
          'immeubles',
          'locataires',
          'honoraires_depenses',
          'actions',
          'evenements',
          'alertes',
        ];
      }

      return (data || []).map(row => row.table_name);
    } catch (error) {
      this.logger.warn(`Failed to get table list: ${error.message}, using fallback`);
      return [
        'affaires',
        'audiences', 
        'dossiers_recouvrement',
        'immeubles',
        'locataires',
        'honoraires_depenses',
        'actions',
        'evenements',
        'alertes',
      ];
    }
  }

  /**
   * Get user profiles from public tables
   */
  private async getUserProfiles(): Promise<any[]> {
    try {
      // Try to get user profiles if the table exists
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*');

      if (error) {
        this.logger.warn('No profiles table found or accessible');
        return [];
      }

      return data || [];
    } catch (error) {
      this.logger.warn(`Failed to get user profiles: ${error.message}`);
      return [];
    }
  }

  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(backupDir: string, metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(backupDir, 'metadata.json');
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  }

  /**
   * Calculate overall checksum from multiple checksums
   */
  private calculateOverallChecksum(checksums: string[]): string {
    const combined = checksums.sort().join('');
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backupDirs = await fs.readdir(this.backupPath);
      const backups: BackupMetadata[] = [];

      for (const dir of backupDirs) {
        const metadataPath = path.join(this.backupPath, dir, 'metadata.json');
        if (await fs.pathExists(metadataPath)) {
          try {
            const metadata = await fs.readJson(metadataPath);
            backups.push(metadata);
          } catch (error) {
            this.logger.warn(`Failed to read metadata for backup ${dir}: ${error.message}`);
          }
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Get backup details by ID
   */
  async getBackupDetails(backupId: string): Promise<CompleteBackupResult | null> {
    try {
      const backupDir = path.join(this.backupPath, backupId);
      const metadataPath = path.join(backupDir, 'metadata.json');

      if (!await fs.pathExists(metadataPath)) {
        return null;
      }

      const metadata = await fs.readJson(metadataPath);
      
      // Read individual backup results
      const dbPath = path.join(backupDir, 'database.json');
      const usersPath = path.join(backupDir, 'users.json');
      const storagePath = path.join(backupDir, 'storage', 'manifest.json');

      const [dbStats, usersStats, storageManifest] = await Promise.all([
        fs.pathExists(dbPath) ? fs.stat(dbPath) : null,
        fs.pathExists(usersPath) ? fs.stat(usersPath) : null,
        fs.pathExists(storagePath) ? fs.readJson(storagePath) : null,
      ]);

      // Reconstruct the complete backup result
      const result: CompleteBackupResult = {
        backupId,
        timestamp: new Date(metadata.timestamp),
        database: {
          backupId,
          timestamp: new Date(metadata.timestamp),
          filePath: dbPath,
          size: dbStats?.size || 0,
          checksum: '',
          tableCount: 0,
          recordCount: 0,
          status: BackupStatus.COMPLETED,
        },
        users: {
          backupId,
          timestamp: new Date(metadata.timestamp),
          filePath: usersPath,
          size: usersStats?.size || 0,
          checksum: '',
          userCount: 0,
          status: BackupStatus.COMPLETED,
        },
        storage: {
          backupId,
          timestamp: new Date(metadata.timestamp),
          backupPath: path.join(backupDir, 'storage'),
          totalFiles: storageManifest?.total_files || 0,
          totalSize: storageManifest?.total_size || 0,
          checksum: '',
          buckets: storageManifest?.buckets || [],
          status: BackupStatus.COMPLETED,
        },
        overallStatus: metadata.status,
        totalSize: metadata.size,
        overallChecksum: metadata.checksum,
        metadata,
      };

      return result;
    } catch (error) {
      this.logger.error(`Failed to get backup details for ${backupId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backupDir = path.join(this.backupPath, backupId);
      
      if (await fs.pathExists(backupDir)) {
        await fs.remove(backupDir);
        this.logger.log(`Backup ${backupId} deleted successfully`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete backup ${backupId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Calculate checksum for a buffer
   */
  private async calculateChecksum(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}