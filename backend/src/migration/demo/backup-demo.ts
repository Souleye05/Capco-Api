/**
 * Demonstration script for the Backup and Rollback System
 * 
 * This script shows how to use the BackupService and RollbackService
 * for creating complete backups of Supabase data and rolling back when needed.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { BackupService } from '../services/backup.service';
import { RollbackService } from '../services/rollback.service';

async function demonstrateBackupSystem() {
  console.log('🚀 Starting Backup and Rollback System Demonstration');
  
  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get services
    const backupService = app.get(BackupService);
    const rollbackService = app.get(RollbackService);
    
    console.log('\n📋 Step 1: List existing backups');
    const existingBackups = await backupService.listBackups();
    console.log(`Found ${existingBackups.length} existing backups`);
    
    console.log('\n💾 Step 2: Create a complete backup');
    console.log('This will backup:');
    console.log('  - All database tables from public schema');
    console.log('  - All users from auth.users');
    console.log('  - All files from Supabase Storage');
    console.log('  - Generate checksums for integrity validation');
    
    const backupResult = await backupService.createCompleteBackup(
      'Demo backup created by backup-demo script'
    );
    
    console.log(`✅ Backup completed successfully!`);
    console.log(`   Backup ID: ${backupResult.backupId}`);
    console.log(`   Total Size: ${formatBytes(backupResult.totalSize)}`);
    console.log(`   Database: ${backupResult.database.tableCount} tables, ${backupResult.database.recordCount} records`);
    console.log(`   Users: ${backupResult.users.userCount} users`);
    console.log(`   Storage: ${backupResult.storage.totalFiles} files in ${backupResult.storage.buckets.length} buckets`);
    
    console.log('\n🔍 Step 3: Validate backup integrity');
    const validation = await rollbackService.validateBackupIntegrity(backupResult.backupId);
    
    if (validation.isValid) {
      console.log('✅ Backup validation passed - all data is intact');
    } else {
      console.log('❌ Backup validation failed:');
      validation.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n📊 Step 4: Get backup details');
    const backupDetails = await backupService.getBackupDetails(backupResult.backupId);
    if (backupDetails) {
      console.log(`   Created: ${backupDetails.timestamp.toISOString()}`);
      console.log(`   Status: ${backupDetails.overallStatus}`);
      console.log(`   Checksum: ${backupDetails.overallChecksum.substring(0, 16)}...`);
    }
    
    console.log('\n🔄 Step 5: Demonstrate rollback capability');
    console.log('Note: This is a demonstration - actual rollback would restore all data');
    console.log(`Would rollback to backup: ${backupResult.backupId}`);
    
    // In a real scenario, you would call:
    // const rollbackResult = await rollbackService.rollbackToBackup(backupResult.backupId);
    
    console.log('\n📋 Step 6: List rollback history');
    const rollbacks = await rollbackService.listRollbacks();
    console.log(`Found ${rollbacks.length} previous rollback operations`);
    
    console.log('\n🎉 Demonstration completed successfully!');
    console.log('\nThe backup and rollback system provides:');
    console.log('  ✅ Complete data backup (database, users, files)');
    console.log('  ✅ Integrity validation with checksums');
    console.log('  ✅ Granular rollback capabilities');
    console.log('  ✅ Progress monitoring and error handling');
    console.log('  ✅ Audit trail for compliance');
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error.message);
    console.error('This is expected if Supabase credentials are not configured');
  } finally {
    await app.close();
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the demonstration
if (require.main === module) {
  demonstrateBackupSystem().catch(console.error);
}

export { demonstrateBackupSystem };