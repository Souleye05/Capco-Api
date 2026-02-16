# Backup and Rollback System

This module provides a comprehensive backup and rollback system for migrating from Supabase to NestJS with complete data preservation and integrity validation.

## Features

### ✅ Complete Backup System
- **Database Backup**: Exports all tables from the public schema with full data preservation
- **User Backup**: Exports all users from `auth.users` with metadata and profiles
- **Storage Backup**: Downloads all files from Supabase Storage with folder structure preservation
- **Integrity Validation**: Generates SHA-256 checksums for all backed up data
- **Progress Monitoring**: Real-time progress tracking with detailed logging

### ✅ Rollback System
- **Complete Restoration**: Restores database, users, and files from backup
- **Validation**: Pre and post-rollback integrity checks
- **Granular Control**: Rollback specific components or complete system
- **Audit Trail**: Complete logging of all rollback operations

### ✅ Safety Features
- **Checksum Validation**: Ensures data integrity throughout the process
- **Transaction Safety**: Database operations are wrapped in transactions
- **Error Handling**: Comprehensive error handling with detailed logging
- **Backup Validation**: Validates backup integrity before allowing rollback

## Architecture

```
Migration Module
├── Services
│   ├── BackupService      # Complete backup functionality
│   └── RollbackService    # Rollback and restoration
├── Controllers
│   └── MigrationController # REST API endpoints
├── Types
│   ├── backup.types.ts    # Backup-related interfaces
│   └── rollback.types.ts  # Rollback-related interfaces
└── Demo
    └── backup-demo.ts     # Demonstration script
```

## Usage

### Creating a Backup

```typescript
import { BackupService } from './services/backup.service';

// Create complete backup
const backupResult = await backupService.createCompleteBackup(
  'Pre-migration backup'
);

console.log(`Backup ID: ${backupResult.backupId}`);
console.log(`Total Size: ${backupResult.totalSize} bytes`);
console.log(`Status: ${backupResult.overallStatus}`);
```

### Rolling Back

```typescript
import { RollbackService } from './services/rollback.service';

// Rollback to specific backup
const rollbackResult = await rollbackService.rollbackToBackup(backupId);

console.log(`Rollback Status: ${rollbackResult.overallStatus}`);
```

### Validation

```typescript
// Validate backup integrity
const validation = await rollbackService.validateBackupIntegrity(backupId);

if (validation.isValid) {
  console.log('Backup is valid and ready for rollback');
} else {
  console.log('Backup validation errors:', validation.errors);
}
```

## API Endpoints

### Backup Operations
- `POST /migration/backup` - Create a complete backup
- `GET /migration/backups` - List all backups
- `GET /migration/backup/:id` - Get backup details
- `DELETE /migration/backup/:id` - Delete a backup

### Rollback Operations
- `POST /migration/rollback/:backupId` - Rollback to backup
- `GET /migration/rollbacks` - List rollback history
- `POST /migration/validate-backup/:id` - Validate backup integrity

## Configuration

Required environment variables:

```env
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Backup Configuration
BACKUP_PATH="./backups"
TEMP_PATH="./temp"
```

## Backup Structure

Each backup creates the following structure:

```
backups/
└── {backup-id}/
    ├── metadata.json      # Backup metadata and checksums
    ├── database.json      # All database tables and records
    ├── users.json         # All users from auth.users
    └── storage/           # All files from Supabase Storage
        ├── manifest.json  # Storage manifest with file metadata
        └── {bucket-name}/ # Files organized by bucket
            └── ...        # Original folder structure preserved
```

## Safety Guarantees

### Data Integrity
- **Checksums**: SHA-256 checksums for all data
- **Validation**: Pre and post-operation integrity checks
- **Atomic Operations**: Database operations are transactional

### Error Recovery
- **Comprehensive Logging**: Detailed logs for troubleshooting
- **Graceful Failures**: Partial failures don't corrupt existing data
- **Rollback Validation**: Ensures rollback was successful

### Production Safety
- **No Data Loss**: Original data is never modified during backup
- **Incremental Backups**: Support for checkpoint-based backups
- **Audit Trail**: Complete history of all operations

## Requirements Compliance

This implementation satisfies the following requirements:

- **Requirement 4.1**: Complete backup of all Supabase data
- **Requirement 4.2**: Complete rollback system with validation
- **Requirement 4.8**: Checksum validation for backup integrity
- **Requirement 4.9**: Rollback validation and testing

## Testing

Run the test suite:

```bash
npm run test
```

Run the demonstration:

```bash
npx ts-node src/migration/demo/backup-demo.ts
```

## Production Deployment

1. **Configure Environment**: Set all required environment variables
2. **Test Backup**: Create a test backup to verify configuration
3. **Validate Integrity**: Run integrity validation on test backup
4. **Monitor Logs**: Ensure comprehensive logging is configured
5. **Test Rollback**: Perform rollback test in staging environment

## Monitoring and Alerting

The system provides detailed logging and progress monitoring:

- **Real-time Progress**: Track backup/rollback progress
- **Error Alerts**: Immediate notification of failures
- **Performance Metrics**: Backup size, duration, and success rates
- **Audit Logs**: Complete history for compliance

## Support

For issues or questions:

1. Check the logs for detailed error information
2. Validate environment configuration
3. Test with smaller datasets first
4. Ensure sufficient disk space for backups
5. Verify Supabase credentials and permissions