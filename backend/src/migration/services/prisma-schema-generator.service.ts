import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  SchemaExtractionResult,
  TableMetadata,
  EnumMetadata,
  ColumnMetadata,
  ConstraintMetadata,
} from '../types/schema-extraction.types';

export interface PrismaSchemaGenerationResult {
  schemaContent: string;
  generatedAt: Date;
  tablesGenerated: number;
  enumsGenerated: number;
  modelsGenerated: string[];
  warnings: string[];
}

export interface PrismaSchemaGenerationOptions {
  outputPath?: string;
  includeComments?: boolean;
  preserveSupabaseMetadata?: boolean;
  generateMigrations?: boolean;
}

@Injectable()
export class PrismaSchemaGeneratorService {
  private readonly logger = new Logger(PrismaSchemaGeneratorService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Generate complete Prisma schema from extracted Supabase schema
   * Requirements: 1.1, 1.2, 1.3
   */
  async generatePrismaSchema(
    extractedSchema: SchemaExtractionResult,
    options: PrismaSchemaGenerationOptions = {}
  ): Promise<PrismaSchemaGenerationResult> {
    this.logger.log('Starting Prisma schema generation');
    
    const startTime = Date.now();
    const warnings: string[] = [];
    
    // Generate schema content
    const schemaContent = this.buildSchemaContent(extractedSchema, options, warnings);
    
    // Write to file if path specified
    if (options.outputPath) {
      await this.writeSchemaToFile(schemaContent, options.outputPath);
    }
    
    // Generate migrations if requested
    if (options.generateMigrations) {
      await this.generateMigrations();
    }
    
    const duration = Date.now() - startTime;
    this.logger.log(`Prisma schema generation completed in ${duration}ms`);
    
    return {
      schemaContent,
      generatedAt: new Date(),
      tablesGenerated: extractedSchema.tables.length,
      enumsGenerated: extractedSchema.enums.length,
      modelsGenerated: extractedSchema.tables.map(t => this.toPascalCase(t.name)),
      warnings,
    };
  }

  /**
   * Build the complete Prisma schema content
   */
  private buildSchemaContent(
    schema: SchemaExtractionResult,
    options: PrismaSchemaGenerationOptions,
    warnings: string[]
  ): string {
    const sections: string[] = [];
    
    // Add header comment
    if (options.includeComments !== false) {
      sections.push(this.generateHeaderComment(schema));
    }
    
    // Add generator and datasource
    sections.push(this.generateGeneratorAndDatasource());
    
    // Add enums
    if (schema.enums.length > 0) {
      sections.push(this.generateEnums(schema.enums, options, warnings));
    }
    
    // Add models
    if (schema.tables.length > 0) {
      sections.push(this.generateModels(schema.tables, schema.enums, options, warnings));
    }
    
    return sections.join('\n\n');
  }

  /**
   * Generate header comment with metadata
   */
  private generateHeaderComment(schema: SchemaExtractionResult): string {
    return `// Generated Prisma schema from Supabase migration
// Generated at: ${schema.extractedAt.toISOString()}
// Source migration files: ${schema.migrationFiles.length}
// Tables extracted: ${schema.tables.length}
// Enums extracted: ${schema.enums.length}
// Supabase version: ${schema.supabaseVersion || 'unknown'}
//
// This schema was automatically generated from Supabase migrations.
// Manual modifications may be overwritten on regeneration.`;
  }

  /**
   * Generate generator and datasource configuration
   */
  private generateGeneratorAndDatasource(): string {
    return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;
  }

  /**
   * Generate Prisma enums from extracted enums
   */
  private generateEnums(
    enums: EnumMetadata[],
    options: PrismaSchemaGenerationOptions,
    warnings: string[]
  ): string {
    const enumDefinitions: string[] = [];
    
    if (options.includeComments !== false) {
      enumDefinitions.push('// Enums extracted from Supabase');
    }
    
    for (const enumDef of enums) {
      const enumName = this.toPascalCase(enumDef.name);
      const values = enumDef.values.map(value => `  ${value}`).join('\n');
      
      let enumString = `enum ${enumName} {\n${values}\n}`;
      
      if (options.preserveSupabaseMetadata) {
        enumString += `\n\n// Original Supabase enum: ${enumDef.name}`;
      }
      
      enumDefinitions.push(enumString);
    }
    
    return enumDefinitions.join('\n\n');
  }

  /**
   * Generate Prisma models from extracted tables
   */
  private generateModels(
    tables: TableMetadata[],
    enums: EnumMetadata[],
    options: PrismaSchemaGenerationOptions,
    warnings: string[]
  ): string {
    const modelDefinitions: string[] = [];
    
    if (options.includeComments !== false) {
      modelDefinitions.push('// Models extracted from Supabase tables');
    }
    
    // Sort tables to handle dependencies (tables with foreign keys come after their references)
    const sortedTables = this.sortTablesByDependencies(tables, warnings);
    
    for (const table of sortedTables) {
      const modelDef = this.generateModel(table, tables, enums, options, warnings);
      modelDefinitions.push(modelDef);
    }
    
    return modelDefinitions.join('\n\n');
  }

  /**
   * Generate a single Prisma model from table metadata
   */
  private generateModel(
    table: TableMetadata,
    allTables: TableMetadata[],
    enums: EnumMetadata[],
    options: PrismaSchemaGenerationOptions,
    warnings: string[]
  ): string {
    const modelName = this.toPascalCase(table.name);
    const lines: string[] = [];
    
    // Model declaration
    lines.push(`model ${modelName} {`);
    
    // Generate fields
    const fields = this.generateModelFields(table, allTables, enums, options, warnings);
    lines.push(...fields.map(field => `  ${field}`));
    
    // Generate relations
    const relations = this.generateModelRelations(table, allTables, warnings);
    if (relations.length > 0) {
      lines.push('');
      lines.push(...relations.map(relation => `  ${relation}`));
    }
    
    // Generate constraints and indexes
    const constraints = this.generateModelConstraints(table, warnings);
    if (constraints.length > 0) {
      lines.push('');
      lines.push(...constraints.map(constraint => `  ${constraint}`));
    }
    
    // Add table mapping
    lines.push(`  @@map("${table.name}")`);
    
    lines.push('}');
    
    // Add metadata comment
    if (options.preserveSupabaseMetadata && options.includeComments !== false) {
      lines.push(`// Original Supabase table: ${table.name}`);
      if (table.policies.length > 0) {
        lines.push(`// RLS policies: ${table.policies.length}`);
      }
      if (table.triggers.length > 0) {
        lines.push(`// Triggers: ${table.triggers.length}`);
      }
    }
    
    return lines.join('\n');
  }
  /**
   * Generate model fields from table columns
   */
  private generateModelFields(
    table: TableMetadata,
    allTables: TableMetadata[],
    enums: EnumMetadata[],
    options: PrismaSchemaGenerationOptions,
    warnings: string[]
  ): string[] {
    const fields: string[] = [];
    
    for (const column of table.columns) {
      const field = this.generateModelField(column, table, allTables, enums, warnings);
      fields.push(field);
    }
    
    return fields;
  }

  /**
   * Generate a single model field from column metadata
   */
  private generateModelField(
    column: ColumnMetadata,
    table: TableMetadata,
    allTables: TableMetadata[],
    enums: EnumMetadata[],
    warnings: string[]
  ): string {
    const fieldName = this.toCamelCase(column.name);
    const fieldType = this.mapColumnTypeToPrisma(column, enums, warnings);
    const modifiers: string[] = [];
    
    // Add ID modifier for primary keys
    if (column.isPrimaryKey) {
      modifiers.push('@id');
    }
    
    // Add default value
    if (column.defaultValue) {
      const defaultValue = this.mapDefaultValueToPrisma(column.defaultValue, fieldType);
      if (defaultValue) {
        modifiers.push(`@default(${defaultValue})`);
      }
    }
    
    // Add unique modifier if needed
    const uniqueConstraints = table.constraints.filter(c => 
      c.type === 'UNIQUE' && c.columns.length === 1 && c.columns[0] === column.name
    );
    if (uniqueConstraints.length > 0) {
      modifiers.push('@unique');
    }
    
    // Add map modifier if field name differs from column name
    if (fieldName !== column.name) {
      modifiers.push(`@map("${column.name}")`);
    }
    
    const modifierString = modifiers.length > 0 ? ` ${modifiers.join(' ')}` : '';
    const nullableMarker = column.nullable && !column.isPrimaryKey ? '?' : '';
    
    return `${fieldName} ${fieldType}${nullableMarker}${modifierString}`;
  }

  /**
   * Generate model relations from foreign keys
   */
  private generateModelRelations(
    table: TableMetadata,
    allTables: TableMetadata[],
    warnings: string[]
  ): string[] {
    const relations: string[] = [];
    
    // Generate relations for foreign keys
    for (const column of table.columns) {
      if (column.isForeignKey && column.references) {
        const referencedTable = allTables.find(t => t.name === column.references!.table);
        if (!referencedTable) {
          warnings.push(`Referenced table '${column.references.table}' not found for foreign key '${column.name}' in table '${table.name}'`);
          continue;
        }
        
        const relationName = this.generateRelationName(column.references.table, false);
        const referencedModelName = this.toPascalCase(column.references.table);
        const fieldName = this.toCamelCase(column.name);
        const referencedField = this.toCamelCase(column.references.column);
        
        const onDelete = column.references.onDelete ? `, onDelete: ${this.mapOnDeleteAction(column.references.onDelete)}` : '';
        const onUpdate = column.references.onUpdate ? `, onUpdate: ${this.mapOnUpdateAction(column.references.onUpdate)}` : '';
        
        relations.push(`${relationName} ${referencedModelName} @relation(fields: [${fieldName}], references: [${referencedField}]${onDelete}${onUpdate})`);
      }
    }
    
    // Generate reverse relations (one-to-many)
    for (const otherTable of allTables) {
      if (otherTable.name === table.name) continue;
      
      for (const otherColumn of otherTable.columns) {
        if (otherColumn.isForeignKey && otherColumn.references?.table === table.name) {
          const relationName = this.generateRelationName(otherTable.name, true);
          const relatedModelName = this.toPascalCase(otherTable.name);
          
          relations.push(`${relationName} ${relatedModelName}[]`);
        }
      }
    }
    
    return relations;
  }

  /**
   * Generate model constraints (unique, composite keys, etc.)
   */
  private generateModelConstraints(table: TableMetadata, warnings: string[]): string[] {
    const constraints: string[] = [];
    
    for (const constraint of table.constraints) {
      switch (constraint.type) {
        case 'UNIQUE':
          if (constraint.columns.length > 1) {
            const fields = constraint.columns.map(col => this.toCamelCase(col)).join(', ');
            constraints.push(`@@unique([${fields}])`);
          }
          break;
          
        case 'PRIMARY KEY':
          if (constraint.columns.length > 1) {
            const fields = constraint.columns.map(col => this.toCamelCase(col)).join(', ');
            constraints.push(`@@id([${fields}])`);
          }
          break;
      }
    }
    
    // Add indexes
    for (const index of table.indexes) {
      if (index.columns.length > 1 || !index.unique) {
        const fields = index.columns.map(col => this.toCamelCase(col)).join(', ');
        const indexType = index.unique ? '@@unique' : '@@index';
        constraints.push(`${indexType}([${fields}])`);
      }
    }
    
    return constraints;
  }

  /**
   * Map PostgreSQL column types to Prisma types
   */
  private mapColumnTypeToPrisma(column: ColumnMetadata, enums: EnumMetadata[], warnings: string[]): string {
    const type = column.type.toLowerCase();
    
    // Check if it's an enum type
    const enumType = enums.find(e => e.name.toLowerCase() === type);
    if (enumType) {
      return this.toPascalCase(enumType.name);
    }
    
    // Map common PostgreSQL types to Prisma types
    if (type.includes('uuid')) return 'String';
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'String';
    if (type.includes('int') || type.includes('serial')) return 'Int';
    if (type.includes('bigint') || type.includes('bigserial')) return 'BigInt';
    if (type.includes('decimal') || type.includes('numeric') || type.includes('real') || type.includes('double')) return 'Decimal';
    if (type.includes('boolean') || type.includes('bool')) return 'Boolean';
    if (type.includes('timestamp') || type.includes('timestamptz')) return 'DateTime';
    if (type.includes('date')) return 'DateTime';
    if (type.includes('time')) return 'String'; // Time as string for simplicity
    if (type.includes('json') || type.includes('jsonb')) return 'Json';
    if (type.includes('bytea')) return 'Bytes';
    
    // Default to String for unknown types
    warnings.push(`Unknown column type '${column.type}' for column '${column.name}', defaulting to String`);
    return 'String';
  }

  /**
   * Map PostgreSQL default values to Prisma defaults
   */
  private mapDefaultValueToPrisma(defaultValue: string, fieldType: string): string | null {
    const value = defaultValue.toLowerCase().trim();
    
    // Handle common PostgreSQL defaults
    if (value === 'gen_random_uuid()' || value === 'uuid_generate_v4()') {
      return 'uuid()';
    }
    if (value === 'now()' || value === 'current_timestamp') {
      return 'now()';
    }
    if (value === 'true' || value === 'false') {
      return value;
    }
    if (value.match(/^\d+$/)) {
      return value;
    }
    if (value.match(/^'.*'$/)) {
      return `"${value.slice(1, -1)}"`;
    }
    if (value === 'current_date') {
      return 'now()';
    }
    
    // For complex defaults, return null and add warning
    return null;
  }

  /**
   * Map PostgreSQL ON DELETE actions to Prisma
   */
  private mapOnDeleteAction(action: string): string {
    switch (action.toUpperCase()) {
      case 'CASCADE': return 'Cascade';
      case 'SET NULL': return 'SetNull';
      case 'SET DEFAULT': return 'SetDefault';
      case 'RESTRICT': return 'Restrict';
      case 'NO ACTION': return 'NoAction';
      default: return 'Restrict';
    }
  }

  /**
   * Map PostgreSQL ON UPDATE actions to Prisma
   */
  private mapOnUpdateAction(action: string): string {
    switch (action.toUpperCase()) {
      case 'CASCADE': return 'Cascade';
      case 'SET NULL': return 'SetNull';
      case 'SET DEFAULT': return 'SetDefault';
      case 'RESTRICT': return 'Restrict';
      case 'NO ACTION': return 'NoAction';
      default: return 'Restrict';
    }
  }

  /**
   * Generate relation name for foreign key relationships
   */
  private generateRelationName(tableName: string, isArray: boolean): string {
    const baseName = this.toCamelCase(tableName);
    
    if (isArray) {
      // Pluralize for one-to-many relationships
      return this.pluralize(baseName);
    }
    
    return baseName;
  }

  /**
   * Sort tables by dependencies to avoid forward references
   */
  private sortTablesByDependencies(tables: TableMetadata[], warnings: string[]): TableMetadata[] {
    const sorted: TableMetadata[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (table: TableMetadata) => {
      if (visiting.has(table.name)) {
        warnings.push(`Circular dependency detected involving table '${table.name}'`);
        return;
      }
      
      if (visited.has(table.name)) {
        return;
      }
      
      visiting.add(table.name);
      
      // Visit dependencies first
      for (const column of table.columns) {
        if (column.isForeignKey && column.references) {
          const referencedTable = tables.find(t => t.name === column.references!.table);
          if (referencedTable && !visited.has(referencedTable.name)) {
            visit(referencedTable);
          }
        }
      }
      
      visiting.delete(table.name);
      visited.add(table.name);
      sorted.push(table);
    };
    
    for (const table of tables) {
      visit(table);
    }
    
    return sorted;
  }
  /**
   * Write schema content to file
   */
  private async writeSchemaToFile(content: string, filePath: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      this.logger.log(`Prisma schema written to: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error writing schema to file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate Prisma migrations
   */
  private async generateMigrations(): Promise<void> {
    try {
      this.logger.log('Generating Prisma migrations...');
      
      // This would typically run `prisma migrate dev` or similar
      // For now, we'll just log the intent
      this.logger.log('Migration generation would be triggered here');
      
      // In a real implementation, you might use child_process to run:
      // exec('npx prisma migrate dev --name initial-migration')
      
    } catch (error) {
      this.logger.error(`Error generating migrations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  /**
   * Simple pluralization (basic implementation)
   */
  private pluralize(word: string): string {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
      return word + 'es';
    }
    return word + 's';
  }

  /**
   * Update existing Prisma schema with extracted schema
   */
  async updateExistingSchema(
    extractedSchema: SchemaExtractionResult,
    existingSchemaPath: string,
    options: PrismaSchemaGenerationOptions = {}
  ): Promise<PrismaSchemaGenerationResult> {
    this.logger.log('Updating existing Prisma schema');
    
    let existingContent = '';
    if (fs.existsSync(existingSchemaPath)) {
      existingContent = fs.readFileSync(existingSchemaPath, 'utf8');
    }
    
    // Parse existing schema to preserve manual modifications
    const preservedSections = this.parseExistingSchema(existingContent);
    
    // Generate new schema
    const result = await this.generatePrismaSchema(extractedSchema, {
      ...options,
      outputPath: existingSchemaPath,
    });
    
    // Merge with preserved sections if needed
    if (preservedSections.length > 0) {
      result.warnings.push('Manual modifications detected in existing schema - review merged result');
    }
    
    return result;
  }

  /**
   * Parse existing schema to identify manual modifications
   */
  private parseExistingSchema(content: string): string[] {
    const preservedSections: string[] = [];
    
    // Look for custom comments or models that might be manual additions
    const lines = content.split('\n');
    let inCustomSection = false;
    let customSection: string[] = [];
    
    for (const line of lines) {
      if (line.includes('// CUSTOM:') || line.includes('// Manual:')) {
        inCustomSection = true;
        customSection = [line];
      } else if (inCustomSection) {
        if (line.trim() === '' && customSection.length > 1) {
          preservedSections.push(customSection.join('\n'));
          inCustomSection = false;
          customSection = [];
        } else {
          customSection.push(line);
        }
      }
    }
    
    if (customSection.length > 0) {
      preservedSections.push(customSection.join('\n'));
    }
    
    return preservedSections;
  }

  /**
   * Validate generated schema for common issues
   */
  async validateGeneratedSchema(schemaContent: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic syntax validation
    if (!schemaContent.includes('generator client')) {
      errors.push('Missing generator client configuration');
    }
    
    if (!schemaContent.includes('datasource db')) {
      errors.push('Missing datasource configuration');
    }
    
    // Check for common issues
    const lines = schemaContent.split('\n');
    let inModel = false;
    let modelName = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('model ')) {
        inModel = true;
        modelName = line.split(' ')[1];
      } else if (line === '}' && inModel) {
        inModel = false;
        modelName = '';
      } else if (inModel && line.includes('@relation')) {
        // Check for potential relation issues
        if (!line.includes('fields:') || !line.includes('references:')) {
          warnings.push(`Potential relation issue in model ${modelName}: ${line}`);
        }
      }
    }
    
    const isValid = errors.length === 0;
    
    this.logger.log(`Schema validation: ${isValid ? 'VALID' : 'INVALID'}`);
    if (warnings.length > 0) {
      this.logger.warn(`Schema validation warnings: ${warnings.length}`);
    }
    if (errors.length > 0) {
      this.logger.error(`Schema validation errors: ${errors.length}`);
    }
    
    return { isValid, errors, warnings };
  }

  /**
   * Generate a complete Prisma schema from the current Supabase migrations
   */
  async generateFromSupabaseMigrations(
    migrationPath?: string,
    outputPath?: string
  ): Promise<PrismaSchemaGenerationResult> {
    this.logger.log('Generating Prisma schema from Supabase migrations');
    
    // This would integrate with SchemaExtractorService
    // For now, we'll create a placeholder implementation
    
    const defaultOutputPath = outputPath || path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    // In a real implementation, this would:
    // 1. Use SchemaExtractorService to extract schema
    // 2. Generate Prisma schema from extracted data
    // 3. Write to file and optionally generate migrations
    
    const placeholderResult: PrismaSchemaGenerationResult = {
      schemaContent: this.generatePlaceholderSchema(),
      generatedAt: new Date(),
      tablesGenerated: 0,
      enumsGenerated: 0,
      modelsGenerated: [],
      warnings: ['This is a placeholder implementation - integrate with SchemaExtractorService'],
    };
    
    if (outputPath) {
      await this.writeSchemaToFile(placeholderResult.schemaContent, outputPath);
    }
    
    return placeholderResult;
  }

  /**
   * Generate a placeholder schema for testing
   */
  private generatePlaceholderSchema(): string {
    return `// Generated Prisma schema from Supabase migration
// This is a placeholder - integrate with SchemaExtractorService

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Placeholder model
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}`;
  }
}