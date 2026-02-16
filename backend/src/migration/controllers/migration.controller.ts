import { Controller, Post, Get, Delete, Param, Body, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { BackupService } from '../services/backup.service';
import { RollbackService } from '../services/rollback.service';
import { CheckpointService } from '../services/checkpoint.service';
import { SchemaExtractorService } from '../services/schema-extractor.service';
import { PrismaSchemaGeneratorService } from '../services/prisma-schema-generator.service';
import { CheckpointValidatorService } from '../services/checkpoint-validator.service';
import { CheckpointPhase2ValidatorService } from '../services/checkpoint-phase2-validator.service';
import {
  CompleteBackupResult,
  BackupMetadata,
  BackupValidationResult,
} from '../types/backup.types';
import {
  RollbackResult,
  RollbackMetadata,
} from '../types/rollback.types';
import {
  CheckpointInfo,
  MigrationPhase,
  RollbackToCheckpointResult,
  CreateCheckpointRequest,
  CheckpointListResponse,
  CheckpointValidationRequest,
  CheckpointValidationResponse,
} from '../types/checkpoint.types';
import {
  Phase2ValidationOptions,
  Phase2ValidationResult,
} from '../types/checkpoint-validation.types';
import {
  SchemaExtractionResult,
  SchemaValidationResult,
  SchemaExtractionOptions,
} from '../types/schema-extraction.types';
import {
  PrismaSchemaGenerationResult,
  PrismaSchemaGenerationOptions,
} from '../services/prisma-schema-generator.service';

@ApiTags('Migration')
@Controller('migration')
export class MigrationController {
  private readonly logger = new Logger(MigrationController.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly rollbackService: RollbackService,
    private readonly checkpointService: CheckpointService,
    private readonly schemaExtractorService: SchemaExtractorService,
    private readonly prismaSchemaGeneratorService: PrismaSchemaGeneratorService,
    private readonly checkpointValidatorService: CheckpointValidatorService,
    private readonly checkpointPhase2ValidatorService: CheckpointPhase2ValidatorService,
  ) {}

  @Post('backup')
  @ApiOperation({ summary: 'Create a complete backup of all Supabase data' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Optional backup description' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Backup created successfully' })
  @ApiResponse({ status: 500, description: 'Backup creation failed' })
  async createBackup(@Body() body: { description?: string }): Promise<CompleteBackupResult> {
    this.logger.log('Creating complete backup...');
    return await this.backupService.createCompleteBackup(body.description);
  }

  @Get('backups')
  @ApiOperation({ summary: 'List all available backups' })
  @ApiResponse({ status: 200, description: 'List of backups retrieved successfully' })
  async listBackups(): Promise<BackupMetadata[]> {
    return await this.backupService.listBackups();
  }

  @Get('backup/:id')
  @ApiOperation({ summary: 'Get backup details by ID' })
  @ApiParam({ name: 'id', description: 'Backup ID' })
  @ApiResponse({ status: 200, description: 'Backup details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  async getBackupDetails(@Param('id') id: string): Promise<CompleteBackupResult | null> {
    return await this.backupService.getBackupDetails(id);
  }

  @Delete('backup/:id')
  @ApiOperation({ summary: 'Delete a backup by ID' })
  @ApiParam({ name: 'id', description: 'Backup ID' })
  @ApiResponse({ status: 200, description: 'Backup deleted successfully' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  async deleteBackup(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.backupService.deleteBackup(id);
    return { success };
  }

  @Post('rollback/:backupId')
  @ApiOperation({ summary: 'Rollback to a specific backup' })
  @ApiParam({ name: 'backupId', description: 'Backup ID to rollback to' })
  @ApiResponse({ status: 200, description: 'Rollback completed successfully' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  @ApiResponse({ status: 500, description: 'Rollback failed' })
  async rollbackToBackup(@Param('backupId') backupId: string): Promise<RollbackResult> {
    this.logger.log(`Starting rollback to backup: ${backupId}`);
    return await this.rollbackService.rollbackToBackup(backupId);
  }

  @Get('rollbacks')
  @ApiOperation({ summary: 'List all rollback operations' })
  @ApiResponse({ status: 200, description: 'List of rollback operations retrieved successfully' })
  async listRollbacks(): Promise<RollbackMetadata[]> {
    return await this.rollbackService.listRollbacks();
  }

  @Post('validate-backup/:id')
  @ApiOperation({ summary: 'Validate backup integrity' })
  @ApiParam({ name: 'id', description: 'Backup ID to validate' })
  @ApiResponse({ status: 200, description: 'Backup validation completed' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  async validateBackup(@Param('id') id: string): Promise<BackupValidationResult> {
    return await this.rollbackService.validateBackupIntegrity(id);
  }

  // Checkpoint Management Endpoints

  @Post('checkpoint')
  @ApiOperation({ summary: 'Create a migration checkpoint' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Checkpoint name' },
        phase: { 
          type: 'string', 
          enum: ['initial', 'schema_extracted', 'data_migrated', 'users_migrated', 'files_migrated', 'validation_complete', 'production_ready'],
          description: 'Migration phase' 
        },
        description: { type: 'string', description: 'Optional checkpoint description' },
      },
      required: ['name', 'phase'],
    },
  })
  @ApiResponse({ status: 201, description: 'Checkpoint created successfully' })
  @ApiResponse({ status: 500, description: 'Checkpoint creation failed' })
  async createCheckpoint(@Body() body: CreateCheckpointRequest): Promise<CheckpointInfo> {
    this.logger.log(`Creating checkpoint: ${body.name} for phase: ${body.phase}`);
    return await this.checkpointService.createCheckpoint(body.name, body.phase, body.description);
  }

  @Get('checkpoints')
  @ApiOperation({ summary: 'List all migration checkpoints' })
  @ApiQuery({ name: 'phase', required: false, description: 'Filter by migration phase' })
  @ApiResponse({ status: 200, description: 'List of checkpoints retrieved successfully' })
  async listCheckpoints(@Query('phase') phase?: MigrationPhase): Promise<CheckpointListResponse> {
    const checkpoints = await this.checkpointService.listCheckpoints(phase);
    return {
      checkpoints,
      total: checkpoints.length,
    };
  }

  @Get('checkpoint/:id')
  @ApiOperation({ summary: 'Get checkpoint details by ID' })
  @ApiParam({ name: 'id', description: 'Checkpoint ID' })
  @ApiResponse({ status: 200, description: 'Checkpoint details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found' })
  async getCheckpointDetails(@Param('id') id: string): Promise<CheckpointInfo | null> {
    return await this.checkpointService.getActiveCheckpointForPhase(id as MigrationPhase);
  }

  @Post('checkpoint/validate')
  @ApiOperation({ summary: 'Validate checkpoint before progression' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phase: { 
          type: 'string', 
          enum: ['initial', 'schema_extracted', 'data_migrated', 'users_migrated', 'files_migrated', 'validation_complete', 'production_ready'],
          description: 'Migration phase to validate' 
        },
      },
      required: ['phase'],
    },
  })
  @ApiResponse({ status: 200, description: 'Checkpoint validation completed' })
  async validateCheckpoint(@Body() body: CheckpointValidationRequest): Promise<CheckpointValidationResponse> {
    const valid = await this.checkpointService.validateCheckpointBeforeProgression(body.phase);
    const checkpoint = await this.checkpointService.getActiveCheckpointForPhase(body.phase);
    
    return {
      valid,
      checkpoint: checkpoint || undefined,
      validationResults: checkpoint?.validationResults || [],
    };
  }

  @Post('checkpoint/:id/rollback')
  @ApiOperation({ summary: 'Rollback to a specific checkpoint' })
  @ApiParam({ name: 'id', description: 'Checkpoint ID to rollback to' })
  @ApiResponse({ status: 200, description: 'Rollback to checkpoint completed' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found' })
  @ApiResponse({ status: 500, description: 'Rollback failed' })
  async rollbackToCheckpoint(@Param('id') id: string): Promise<RollbackToCheckpointResult> {
    this.logger.log(`Starting rollback to checkpoint: ${id}`);
    return await this.checkpointService.rollbackToCheckpoint(id);
  }

  @Get('checkpoint/active/:phase')
  @ApiOperation({ summary: 'Get active checkpoint for a specific phase' })
  @ApiParam({ 
    name: 'phase', 
    description: 'Migration phase',
    enum: ['initial', 'schema_extracted', 'data_migrated', 'users_migrated', 'files_migrated', 'validation_complete', 'production_ready']
  })
  @ApiResponse({ status: 200, description: 'Active checkpoint retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No active checkpoint found for phase' })
  async getActiveCheckpoint(@Param('phase') phase: MigrationPhase): Promise<CheckpointInfo | null> {
    return await this.checkpointService.getActiveCheckpointForPhase(phase);
  }

  @Post('checkpoint/validate/phase2')
  @ApiOperation({ summary: 'Validate Phase 2 - Data Migration Checkpoint' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        skipIntegrityValidation: { type: 'boolean', description: 'Skip integrity validation checks', default: false },
        skipPerformanceAnalysis: { type: 'boolean', description: 'Skip performance metrics analysis', default: false },
        detailedReporting: { type: 'boolean', description: 'Generate detailed validation reports', default: true },
        sampleSize: { type: 'number', description: 'Sample size for validation checks', default: 100 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Phase 2 checkpoint validation completed' })
  @ApiResponse({ status: 500, description: 'Checkpoint validation failed' })
  async validatePhase2Checkpoint(@Body() options: Phase2ValidationOptions = {}): Promise<Phase2ValidationResult> {
    this.logger.log('Starting Phase 2 checkpoint validation - Data Migration');
    const result = await this.checkpointPhase2ValidatorService.validatePhase2Checkpoint(options);
    
    // Prompt user with validation results
    await this.checkpointPhase2ValidatorService.promptUserForValidation(result);
    
    return result;
  }

  // Schema Extraction Endpoints

  @Post('schema/extract')
  @ApiOperation({ summary: 'Extract complete schema from Supabase migrations and database' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        migrationPath: { type: 'string', description: 'Optional path to migration files' },
        includeLiveSchema: { type: 'boolean', description: 'Include live database schema', default: true },
        validateSchema: { type: 'boolean', description: 'Validate extracted schema', default: true },
        exportToFile: { type: 'string', description: 'Optional file path to export schema' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Schema extracted successfully' })
  @ApiResponse({ status: 500, description: 'Schema extraction failed' })
  async extractSchema(@Body() options: SchemaExtractionOptions = {}): Promise<SchemaExtractionResult> {
    this.logger.log('Starting schema extraction...');
    const result = await this.schemaExtractorService.extractCompleteSchema(options.migrationPath);
    
    if (options.validateSchema) {
      const validation = await this.schemaExtractorService.validateExtractedSchema(result);
      this.logger.log(`Schema validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
      if (validation.warnings.length > 0) {
        this.logger.warn(`Schema warnings: ${validation.warnings.join(', ')}`);
      }
      if (validation.errors.length > 0) {
        this.logger.error(`Schema errors: ${validation.errors.join(', ')}`);
      }
    }
    
    if (options.exportToFile) {
      await this.schemaExtractorService.exportSchemaToFile(result, options.exportToFile);
    }
    
    return result;
  }

  @Post('schema/validate')
  @ApiOperation({ summary: 'Validate extracted schema for completeness and integrity' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        schema: { 
          type: 'object', 
          description: 'Schema extraction result to validate',
        },
      },
      required: ['schema'],
    },
  })
  @ApiResponse({ status: 200, description: 'Schema validation completed' })
  async validateSchema(@Body() body: { schema: SchemaExtractionResult }): Promise<SchemaValidationResult> {
    return await this.schemaExtractorService.validateExtractedSchema(body.schema);
  }

  @Post('schema/export')
  @ApiOperation({ summary: 'Export schema to file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        schema: { 
          type: 'object', 
          description: 'Schema extraction result to export',
        },
        filePath: { 
          type: 'string', 
          description: 'File path to export schema to',
        },
      },
      required: ['schema', 'filePath'],
    },
  })
  @ApiResponse({ status: 200, description: 'Schema exported successfully' })
  async exportSchema(@Body() body: { schema: SchemaExtractionResult; filePath: string }): Promise<{ success: boolean }> {
    await this.schemaExtractorService.exportSchemaToFile(body.schema, body.filePath);
    return { success: true };
  }

  // Prisma Schema Generation Endpoints

  @Post('schema/generate-prisma')
  @ApiOperation({ summary: 'Generate Prisma schema from extracted Supabase schema' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        extractedSchema: { 
          type: 'object', 
          description: 'Extracted schema from Supabase',
        },
        outputPath: { 
          type: 'string', 
          description: 'Optional output path for generated schema',
        },
        includeComments: { 
          type: 'boolean', 
          description: 'Include comments in generated schema',
          default: true,
        },
        preserveSupabaseMetadata: { 
          type: 'boolean', 
          description: 'Preserve Supabase metadata in comments',
          default: true,
        },
        generateMigrations: { 
          type: 'boolean', 
          description: 'Generate Prisma migrations after schema creation',
          default: false,
        },
      },
      required: ['extractedSchema'],
    },
  })
  @ApiResponse({ status: 200, description: 'Prisma schema generated successfully' })
  async generatePrismaSchema(@Body() body: {
    extractedSchema: SchemaExtractionResult;
    outputPath?: string;
    includeComments?: boolean;
    preserveSupabaseMetadata?: boolean;
    generateMigrations?: boolean;
  }): Promise<PrismaSchemaGenerationResult> {
    this.logger.log('Generating Prisma schema from extracted Supabase schema...');
    
    const options: PrismaSchemaGenerationOptions = {
      outputPath: body.outputPath,
      includeComments: body.includeComments,
      preserveSupabaseMetadata: body.preserveSupabaseMetadata,
      generateMigrations: body.generateMigrations,
    };
    
    return await this.prismaSchemaGeneratorService.generatePrismaSchema(body.extractedSchema, options);
  }

  @Post('schema/generate-from-migrations')
  @ApiOperation({ summary: 'Generate Prisma schema directly from Supabase migration files' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        migrationPath: { 
          type: 'string', 
          description: 'Path to Supabase migration files',
        },
        outputPath: { 
          type: 'string', 
          description: 'Output path for generated Prisma schema',
        },
        includeComments: { 
          type: 'boolean', 
          description: 'Include comments in generated schema',
          default: true,
        },
        preserveSupabaseMetadata: { 
          type: 'boolean', 
          description: 'Preserve Supabase metadata in comments',
          default: true,
        },
        generateMigrations: { 
          type: 'boolean', 
          description: 'Generate Prisma migrations after schema creation',
          default: false,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Prisma schema generated from migrations successfully' })
  async generatePrismaSchemaFromMigrations(@Body() body: {
    migrationPath?: string;
    outputPath?: string;
    includeComments?: boolean;
    preserveSupabaseMetadata?: boolean;
    generateMigrations?: boolean;
  }): Promise<PrismaSchemaGenerationResult> {
    this.logger.log('Generating Prisma schema from Supabase migrations...');
    
    // First extract schema from migrations
    const extractedSchema = await this.schemaExtractorService.extractCompleteSchema(body.migrationPath);
    
    // Then generate Prisma schema
    const options: PrismaSchemaGenerationOptions = {
      outputPath: body.outputPath,
      includeComments: body.includeComments,
      preserveSupabaseMetadata: body.preserveSupabaseMetadata,
      generateMigrations: body.generateMigrations,
    };
    
    return await this.prismaSchemaGeneratorService.generatePrismaSchema(extractedSchema, options);
  }

  @Post('schema/validate-prisma')
  @ApiOperation({ summary: 'Validate generated Prisma schema' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        schemaContent: { 
          type: 'string', 
          description: 'Prisma schema content to validate',
        },
      },
      required: ['schemaContent'],
    },
  })
  @ApiResponse({ status: 200, description: 'Schema validation completed' })
  async validatePrismaSchema(@Body() body: { schemaContent: string }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return await this.prismaSchemaGeneratorService.validateGeneratedSchema(body.schemaContent);
  }

  @Post('schema/update-existing')
  @ApiOperation({ summary: 'Update existing Prisma schema with extracted schema' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        extractedSchema: { 
          type: 'object', 
          description: 'Extracted schema from Supabase',
        },
        existingSchemaPath: { 
          type: 'string', 
          description: 'Path to existing Prisma schema file',
        },
        includeComments: { 
          type: 'boolean', 
          description: 'Include comments in updated schema',
          default: true,
        },
        preserveSupabaseMetadata: { 
          type: 'boolean', 
          description: 'Preserve Supabase metadata in comments',
          default: true,
        },
      },
      required: ['extractedSchema', 'existingSchemaPath'],
    },
  })
  @ApiResponse({ status: 200, description: 'Existing schema updated successfully' })
  async updateExistingSchema(@Body() body: {
    extractedSchema: SchemaExtractionResult;
    existingSchemaPath: string;
    includeComments?: boolean;
    preserveSupabaseMetadata?: boolean;
  }): Promise<PrismaSchemaGenerationResult> {
    this.logger.log(`Updating existing Prisma schema at: ${body.existingSchemaPath}`);
    
    const options: PrismaSchemaGenerationOptions = {
      includeComments: body.includeComments,
      preserveSupabaseMetadata: body.preserveSupabaseMetadata,
    };
    
    return await this.prismaSchemaGeneratorService.updateExistingSchema(
      body.extractedSchema,
      body.existingSchemaPath,
      options
    );
  }
}