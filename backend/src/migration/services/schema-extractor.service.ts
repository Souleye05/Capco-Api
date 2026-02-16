import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TableMetadata {
  name: string;
  columns: ColumnMetadata[];
  constraints: ConstraintMetadata[];
  indexes: IndexMetadata[];
  policies: PolicyMetadata[];
  triggers: TriggerMetadata[];
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  };
}

export interface ConstraintMetadata {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  definition: string;
  referencedTable?: string;
  referencedColumns?: string[];
}

export interface IndexMetadata {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}

export interface PolicyMetadata {
  name: string;
  command: string;
  roles: string[];
  using?: string;
  withCheck?: string;
}

export interface TriggerMetadata {
  name: string;
  timing: string;
  event: string;
  function: string;
}

export interface EnumMetadata {
  name: string;
  values: string[];
}

export interface FunctionMetadata {
  name: string;
  returnType: string;
  parameters: Array<{
    name: string;
    type: string;
    defaultValue?: string;
  }>;
  definition: string;
  language: string;
  security: 'DEFINER' | 'INVOKER';
}

export interface SchemaExtractionResult {
  tables: TableMetadata[];
  enums: EnumMetadata[];
  functions: FunctionMetadata[];
  migrationFiles: string[];
  extractedAt: Date;
  supabaseVersion?: string;
}

@Injectable()
export class SchemaExtractorService {
  private readonly logger = new Logger(SchemaExtractorService.name);
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }
  }
  /**
   * Extract complete schema from Supabase migrations and live database
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  async extractCompleteSchema(migrationPath?: string): Promise<SchemaExtractionResult> {
    this.logger.log('Starting complete schema extraction from Supabase');
    
    const startTime = Date.now();
    const migrationFiles = await this.findMigrationFiles(migrationPath);
    
    this.logger.log(`Found ${migrationFiles.length} migration files`);
    
    // Extract schema from migration files
    const fileBasedSchema = await this.extractSchemaFromMigrations(migrationFiles);
    
    // Extract live schema from Supabase database
    const liveSchema = await this.extractLiveSchema();
    
    // Merge and validate schemas
    const mergedSchema = await this.mergeSchemas(fileBasedSchema, liveSchema);
    
    const result: SchemaExtractionResult = {
      tables: mergedSchema.tables,
      enums: mergedSchema.enums,
      functions: mergedSchema.functions,
      migrationFiles: migrationFiles.map(f => path.basename(f)),
      extractedAt: new Date(),
      supabaseVersion: await this.getSupabaseVersion(),
    };
    
    const duration = Date.now() - startTime;
    this.logger.log(`Schema extraction completed in ${duration}ms`);
    this.logger.log(`Extracted: ${result.tables.length} tables, ${result.enums.length} enums, ${result.functions.length} functions`);
    
    return result;
  }

  /**
   * Find all Supabase migration files
   */
  private async findMigrationFiles(migrationPath?: string): Promise<string[]> {
    const defaultPaths = [
      'frontend/supabase/migrations',
      'supabase/migrations',
      '../frontend/supabase/migrations',
      './migrations'
    ];
    
    const searchPaths = migrationPath ? [migrationPath, ...defaultPaths] : defaultPaths;
    
    for (const searchPath of searchPaths) {
      try {
        if (fs.existsSync(searchPath)) {
          const files = fs.readdirSync(searchPath)
            .filter(file => file.endsWith('.sql'))
            .sort()
            .map(file => path.join(searchPath, file));
          
          if (files.length > 0) {
            this.logger.log(`Found migration files in: ${searchPath}`);
            return files;
          }
        }
      } catch (error) {
        this.logger.debug(`Could not access path: ${searchPath}`);
      }
    }
    
    throw new Error('No Supabase migration files found. Please ensure migration files are accessible.');
  }

  /**
   * Extract schema information from migration SQL files
   */
  private async extractSchemaFromMigrations(migrationFiles: string[]): Promise<Partial<SchemaExtractionResult>> {
    this.logger.log('Extracting schema from migration files');
    
    const tables: TableMetadata[] = [];
    const enums: EnumMetadata[] = [];
    const functions: FunctionMetadata[] = [];
    
    for (const filePath of migrationFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.logger.debug(`Processing migration file: ${path.basename(filePath)}`);
        
        // Extract enums
        const fileEnums = this.extractEnumsFromSQL(content);
        enums.push(...fileEnums);
        
        // Extract tables
        const fileTables = this.extractTablesFromSQL(content);
        tables.push(...fileTables);
        
        // Extract functions
        const fileFunctions = this.extractFunctionsFromSQL(content);
        functions.push(...fileFunctions);
        
      } catch (error) {
        this.logger.error(`Error processing migration file ${filePath}: ${error.message}`);
        throw error;
      }
    }
    
    // Remove duplicates and merge
    const uniqueTables = this.deduplicateTables(tables);
    const uniqueEnums = this.deduplicateEnums(enums);
    const uniqueFunctions = this.deduplicateFunctions(functions);
    
    this.logger.log(`Extracted from files: ${uniqueTables.length} tables, ${uniqueEnums.length} enums, ${uniqueFunctions.length} functions`);
    
    return {
      tables: uniqueTables,
      enums: uniqueEnums,
      functions: uniqueFunctions,
    };
  }
  /**
   * Extract live schema from Supabase database using information_schema
   */
  private async extractLiveSchema(): Promise<Partial<SchemaExtractionResult>> {
    if (!this.supabaseClient) {
      this.logger.warn('Supabase client not configured, skipping live schema extraction');
      return { tables: [], enums: [], functions: [] };
    }
    
    this.logger.log('Extracting live schema from Supabase database');
    
    try {
      // Get all public schema tables
      const { data: tablesData, error: tablesError } = await this.supabaseClient
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public')
        .neq('table_name', 'schema_migrations'); // Exclude internal tables
      
      if (tablesError) {
        this.logger.error('Error fetching tables from live schema:', tablesError);
        return { tables: [], enums: [], functions: [] };
      }
      
      const tables: TableMetadata[] = [];
      
      for (const tableInfo of tablesData || []) {
        const tableMetadata = await this.extractTableMetadata(tableInfo.table_name);
        if (tableMetadata) {
          tables.push(tableMetadata);
        }
      }
      
      // Extract enums from live database
      const enums = await this.extractLiveEnums();
      
      // Extract functions from live database
      const functions = await this.extractLiveFunctions();
      
      this.logger.log(`Extracted from live DB: ${tables.length} tables, ${enums.length} enums, ${functions.length} functions`);
      
      return { tables, enums, functions };
      
    } catch (error) {
      this.logger.error('Error extracting live schema:', error);
      return { tables: [], enums: [], functions: [] };
    }
  }

  /**
   * Extract detailed metadata for a specific table
   */
  private async extractTableMetadata(tableName: string): Promise<TableMetadata | null> {
    try {
      // Get columns information
      const { data: columnsData, error: columnsError } = await this.supabaseClient
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (columnsError || !columnsData) {
        this.logger.error(`Error fetching columns for table ${tableName}:`, columnsError);
        return null;
      }
      
      const columns: ColumnMetadata[] = columnsData.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isPrimaryKey: false, // Will be updated below
        isForeignKey: false, // Will be updated below
      }));
      
      // Get constraints
      const constraints = await this.extractTableConstraints(tableName);
      
      // Update primary key and foreign key information
      this.updateColumnConstraintInfo(columns, constraints);
      
      // Get indexes
      const indexes = await this.extractTableIndexes(tableName);
      
      // Get RLS policies
      const policies = await this.extractTablePolicies(tableName);
      
      // Get triggers
      const triggers = await this.extractTableTriggers(tableName);
      
      return {
        name: tableName,
        columns,
        constraints,
        indexes,
        policies,
        triggers,
      };
      
    } catch (error) {
      this.logger.error(`Error extracting metadata for table ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Extract table constraints from information_schema
   */
  private async extractTableConstraints(tableName: string): Promise<ConstraintMetadata[]> {
    try {
      const { data: constraintsData, error } = await this.supabaseClient
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (error || !constraintsData) {
        return [];
      }
      
      const constraints: ConstraintMetadata[] = [];
      
      for (const constraint of constraintsData) {
        // Get constraint columns
        const { data: columnsData } = await this.supabaseClient
          .from('information_schema.key_column_usage')
          .select('column_name, referenced_table_name, referenced_column_name')
          .eq('constraint_name', constraint.constraint_name);
        
        const columns = columnsData?.map(c => c.column_name) || [];
        
        constraints.push({
          name: constraint.constraint_name,
          type: constraint.constraint_type,
          columns,
          definition: '', // Would need to query pg_constraint for full definition
          referencedTable: columnsData?.[0]?.referenced_table_name,
          referencedColumns: columnsData?.map(c => c.referenced_column_name).filter(Boolean),
        });
      }
      
      return constraints;
      
    } catch (error) {
      this.logger.error(`Error extracting constraints for table ${tableName}:`, error);
      return [];
    }
  }
  /**
   * Extract enums from SQL content
   */
  private extractEnumsFromSQL(sqlContent: string): EnumMetadata[] {
    const enums: EnumMetadata[] = [];
    
    // Match CREATE TYPE statements
    const enumRegex = /CREATE\s+TYPE\s+(?:public\.)?(\w+)\s+AS\s+ENUM\s*\(\s*([^)]+)\s*\)/gi;
    let match;
    
    while ((match = enumRegex.exec(sqlContent)) !== null) {
      const enumName = match[1];
      const valuesString = match[2];
      
      // Parse enum values
      const values = valuesString
        .split(',')
        .map(v => v.trim().replace(/^'|'$/g, ''))
        .filter(v => v.length > 0);
      
      enums.push({
        name: enumName,
        values,
      });
    }
    
    // Also match ALTER TYPE ADD VALUE statements
    const alterEnumRegex = /ALTER\s+TYPE\s+(\w+)\s+ADD\s+VALUE\s+(?:IF\s+NOT\s+EXISTS\s+)?'([^']+)'/gi;
    
    while ((match = alterEnumRegex.exec(sqlContent)) !== null) {
      const enumName = match[1];
      const newValue = match[2];
      
      // Find existing enum and add value if not present
      let existingEnum = enums.find(e => e.name === enumName);
      if (!existingEnum) {
        existingEnum = { name: enumName, values: [] };
        enums.push(existingEnum);
      }
      
      if (!existingEnum.values.includes(newValue)) {
        existingEnum.values.push(newValue);
      }
    }
    
    return enums;
  }

  /**
   * Extract tables from SQL content
   */
  private extractTablesFromSQL(sqlContent: string): TableMetadata[] {
    const tables: TableMetadata[] = [];
    
    // Match CREATE TABLE statements
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(\s*([^;]+?)\s*\);/gis;
    let match;
    
    while ((match = tableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const tableDefinition = match[2];
      
      const columns = this.parseTableColumns(tableDefinition);
      const constraints = this.parseTableConstraints(tableDefinition);
      
      tables.push({
        name: tableName,
        columns,
        constraints,
        indexes: [], // Will be populated from separate CREATE INDEX statements
        policies: [], // Will be populated from separate CREATE POLICY statements
        triggers: [], // Will be populated from separate CREATE TRIGGER statements
      });
    }
    
    // Extract indexes
    this.extractIndexesFromSQL(sqlContent, tables);
    
    // Extract policies
    this.extractPoliciesFromSQL(sqlContent, tables);
    
    // Extract triggers
    this.extractTriggersFromSQL(sqlContent, tables);
    
    return tables;
  }

  /**
   * Parse table column definitions
   */
  private parseTableColumns(tableDefinition: string): ColumnMetadata[] {
    const columns: ColumnMetadata[] = [];
    
    // Split by commas, but be careful with nested parentheses
    const lines = this.splitTableDefinition(tableDefinition);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip constraint definitions
      if (trimmedLine.match(/^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)/i)) {
        continue;
      }
      
      // Parse column definition
      const columnMatch = trimmedLine.match(/^(\w+)\s+([^,\s]+(?:\s*\([^)]+\))?)\s*(.*)?$/i);
      if (columnMatch) {
        const columnName = columnMatch[1];
        const columnType = columnMatch[2];
        const modifiers = columnMatch[3] || '';
        
        const column: ColumnMetadata = {
          name: columnName,
          type: columnType,
          nullable: !modifiers.includes('NOT NULL'),
          isPrimaryKey: modifiers.includes('PRIMARY KEY'),
          isForeignKey: modifiers.includes('REFERENCES'),
          defaultValue: this.extractDefaultValue(modifiers),
        };
        
        // Extract foreign key reference
        if (column.isForeignKey) {
          const refMatch = modifiers.match(/REFERENCES\s+(?:public\.)?(\w+)\s*\(\s*(\w+)\s*\)(?:\s+ON\s+DELETE\s+(\w+))?(?:\s+ON\s+UPDATE\s+(\w+))?/i);
          if (refMatch) {
            column.references = {
              table: refMatch[1],
              column: refMatch[2],
              onDelete: refMatch[3],
              onUpdate: refMatch[4],
            };
          }
        }
        
        columns.push(column);
      }
    }
    
    return columns;
  }

  /**
   * Parse table constraint definitions
   */
  private parseTableConstraints(tableDefinition: string): ConstraintMetadata[] {
    const constraints: ConstraintMetadata[] = [];
    const lines = this.splitTableDefinition(tableDefinition);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Primary key constraint
      const pkMatch = trimmedLine.match(/PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i);
      if (pkMatch) {
        const columns = pkMatch[1].split(',').map(c => c.trim());
        constraints.push({
          name: 'PRIMARY',
          type: 'PRIMARY KEY',
          columns,
          definition: trimmedLine,
        });
        continue;
      }
      
      // Foreign key constraint
      const fkMatch = trimmedLine.match(/(?:CONSTRAINT\s+(\w+)\s+)?FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+REFERENCES\s+(?:public\.)?(\w+)\s*\(\s*([^)]+)\s*\)/i);
      if (fkMatch) {
        const constraintName = fkMatch[1] || 'FOREIGN_KEY';
        const columns = fkMatch[2].split(',').map(c => c.trim());
        const referencedTable = fkMatch[3];
        const referencedColumns = fkMatch[4].split(',').map(c => c.trim());
        
        constraints.push({
          name: constraintName,
          type: 'FOREIGN KEY',
          columns,
          definition: trimmedLine,
          referencedTable,
          referencedColumns,
        });
        continue;
      }
      
      // Unique constraint
      const uniqueMatch = trimmedLine.match(/(?:CONSTRAINT\s+(\w+)\s+)?UNIQUE\s*\(\s*([^)]+)\s*\)/i);
      if (uniqueMatch) {
        const constraintName = uniqueMatch[1] || 'UNIQUE';
        const columns = uniqueMatch[2].split(',').map(c => c.trim());
        
        constraints.push({
          name: constraintName,
          type: 'UNIQUE',
          columns,
          definition: trimmedLine,
        });
        continue;
      }
      
      // Check constraint
      const checkMatch = trimmedLine.match(/(?:CONSTRAINT\s+(\w+)\s+)?CHECK\s*\(\s*([^)]+)\s*\)/i);
      if (checkMatch) {
        const constraintName = checkMatch[1] || 'CHECK';
        
        constraints.push({
          name: constraintName,
          type: 'CHECK',
          columns: [], // Check constraints don't necessarily reference specific columns
          definition: trimmedLine,
        });
      }
    }
    
    return constraints;
  }
  /**
   * Extract functions from SQL content
   */
  private extractFunctionsFromSQL(sqlContent: string): FunctionMetadata[] {
    const functions: FunctionMetadata[] = [];
    
    // Match CREATE OR REPLACE FUNCTION statements
    const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)\s*\(\s*([^)]*)\s*\)\s*RETURNS\s+([^\s]+)(?:\s+LANGUAGE\s+(\w+))?(?:\s+(?:STABLE|IMMUTABLE|VOLATILE))?(?:\s+SECURITY\s+(DEFINER|INVOKER))?\s+(?:SET\s+[^$]+)?\s*AS\s+\$([^$]*)\$\s*(.*?)\s*\$\6\$/gis;
    let match;
    
    while ((match = functionRegex.exec(sqlContent)) !== null) {
      const functionName = match[1];
      const parametersString = match[2];
      const returnType = match[3];
      const language = match[4] || 'sql';
      const security = (match[5] as 'DEFINER' | 'INVOKER') || 'INVOKER';
      const definition = match[7];
      
      // Parse parameters
      const parameters = this.parseFunctionParameters(parametersString);
      
      functions.push({
        name: functionName,
        returnType,
        parameters,
        definition,
        language,
        security,
      });
    }
    
    return functions;
  }

  /**
   * Parse function parameters
   */
  private parseFunctionParameters(parametersString: string): Array<{ name: string; type: string; defaultValue?: string }> {
    if (!parametersString.trim()) {
      return [];
    }
    
    const parameters: Array<{ name: string; type: string; defaultValue?: string }> = [];
    const paramParts = parametersString.split(',');
    
    for (const part of paramParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      // Match parameter definition: [IN|OUT|INOUT] name type [DEFAULT value]
      const paramMatch = trimmed.match(/(?:(?:IN|OUT|INOUT)\s+)?(\w+)\s+([^\s=]+)(?:\s+DEFAULT\s+(.+))?/i);
      if (paramMatch) {
        parameters.push({
          name: paramMatch[1],
          type: paramMatch[2],
          defaultValue: paramMatch[3],
        });
      }
    }
    
    return parameters;
  }

  /**
   * Extract indexes from SQL content and associate with tables
   */
  private extractIndexesFromSQL(sqlContent: string, tables: TableMetadata[]): void {
    const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(?:public\.)?(\w+)\s*\(\s*([^)]+)\s*\)/gi;
    let match;
    
    while ((match = indexRegex.exec(sqlContent)) !== null) {
      const indexName = match[1];
      const tableName = match[2];
      const columnsString = match[3];
      const isUnique = match[0].includes('UNIQUE');
      
      const columns = columnsString.split(',').map(c => c.trim());
      
      const table = tables.find(t => t.name === tableName);
      if (table) {
        table.indexes.push({
          name: indexName,
          columns,
          unique: isUnique,
          type: 'btree', // Default type
        });
      }
    }
  }

  /**
   * Extract RLS policies from SQL content and associate with tables
   */
  private extractPoliciesFromSQL(sqlContent: string, tables: TableMetadata[]): void {
    const policyRegex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+(?:public\.)?(\w+)\s+FOR\s+(\w+)\s+TO\s+([^U]+)(?:\s+USING\s*\(\s*([^)]+)\s*\))?(?:\s+WITH\s+CHECK\s*\(\s*([^)]+)\s*\))?/gi;
    let match;
    
    while ((match = policyRegex.exec(sqlContent)) !== null) {
      const policyName = match[1];
      const tableName = match[2];
      const command = match[3];
      const roles = match[4].trim().split(',').map(r => r.trim());
      const using = match[5];
      const withCheck = match[6];
      
      const table = tables.find(t => t.name === tableName);
      if (table) {
        table.policies.push({
          name: policyName,
          command,
          roles,
          using,
          withCheck,
        });
      }
    }
  }

  /**
   * Extract triggers from SQL content and associate with tables
   */
  private extractTriggersFromSQL(sqlContent: string, tables: TableMetadata[]): void {
    const triggerRegex = /CREATE\s+TRIGGER\s+(\w+)\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE)\s+ON\s+(?:public\.)?(\w+)\s+FOR\s+EACH\s+ROW\s+EXECUTE\s+(?:PROCEDURE\s+|FUNCTION\s+)?(\w+)/gi;
    let match;
    
    while ((match = triggerRegex.exec(sqlContent)) !== null) {
      const triggerName = match[1];
      const timing = match[2];
      const event = match[3];
      const tableName = match[4];
      const functionName = match[5];
      
      const table = tables.find(t => t.name === tableName);
      if (table) {
        table.triggers.push({
          name: triggerName,
          timing,
          event,
          function: functionName,
        });
      }
    }
  }

  /**
   * Helper method to split table definition by commas while respecting parentheses
   */
  private splitTableDefinition(definition: string): string[] {
    const parts: string[] = [];
    let current = '';
    let parenthesesLevel = 0;
    
    for (let i = 0; i < definition.length; i++) {
      const char = definition[i];
      
      if (char === '(') {
        parenthesesLevel++;
      } else if (char === ')') {
        parenthesesLevel--;
      } else if (char === ',' && parenthesesLevel === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    return parts;
  }

  /**
   * Extract default value from column modifiers
   */
  private extractDefaultValue(modifiers: string): string | undefined {
    const defaultMatch = modifiers.match(/DEFAULT\s+([^,\s]+(?:\s*\([^)]*\))?)/i);
    return defaultMatch ? defaultMatch[1] : undefined;
  }
  /**
   * Extract live enums from Supabase database
   */
  private async extractLiveEnums(): Promise<EnumMetadata[]> {
    try {
      const { data, error } = await this.supabaseClient.rpc('get_enum_types');
      
      if (error) {
        // Fallback to direct query if RPC doesn't exist
        const { data: enumData, error: enumError } = await this.supabaseClient
          .from('pg_type')
          .select('typname, enumlabel')
          .eq('typtype', 'e');
        
        if (enumError) {
          this.logger.warn('Could not extract enums from live database:', enumError);
          return [];
        }
        
        // Group enum values by type name
        const enumMap = new Map<string, string[]>();
        for (const row of enumData || []) {
          if (!enumMap.has(row.typname)) {
            enumMap.set(row.typname, []);
          }
          enumMap.get(row.typname)!.push(row.enumlabel);
        }
        
        return Array.from(enumMap.entries()).map(([name, values]) => ({
          name,
          values,
        }));
      }
      
      return data || [];
      
    } catch (error) {
      this.logger.warn('Could not extract enums from live database:', error);
      return [];
    }
  }

  /**
   * Extract live functions from Supabase database
   */
  private async extractLiveFunctions(): Promise<FunctionMetadata[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('information_schema.routines')
        .select('*')
        .eq('routine_schema', 'public')
        .eq('routine_type', 'FUNCTION');
      
      if (error) {
        this.logger.warn('Could not extract functions from live database:', error);
        return [];
      }
      
      const functions: FunctionMetadata[] = [];
      
      for (const routine of data || []) {
        // Get function parameters
        const { data: paramsData } = await this.supabaseClient
          .from('information_schema.parameters')
          .select('*')
          .eq('specific_name', routine.specific_name)
          .order('ordinal_position');
        
        const parameters = paramsData?.map(param => ({
          name: param.parameter_name || `param_${param.ordinal_position}`,
          type: param.data_type,
          defaultValue: param.parameter_default,
        })) || [];
        
        functions.push({
          name: routine.routine_name,
          returnType: routine.data_type || 'void',
          parameters,
          definition: routine.routine_definition || '',
          language: routine.external_language || 'sql',
          security: routine.security_type === 'DEFINER' ? 'DEFINER' : 'INVOKER',
        });
      }
      
      return functions;
      
    } catch (error) {
      this.logger.warn('Could not extract functions from live database:', error);
      return [];
    }
  }

  /**
   * Extract table indexes from live database
   */
  private async extractTableIndexes(tableName: string): Promise<IndexMetadata[]> {
    try {
      // This would require a custom query to pg_indexes or similar
      // For now, return empty array as this is complex to implement
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract table policies from live database
   */
  private async extractTablePolicies(tableName: string): Promise<PolicyMetadata[]> {
    try {
      // This would require querying pg_policies
      // For now, return empty array as this is complex to implement
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract table triggers from live database
   */
  private async extractTableTriggers(tableName: string): Promise<TriggerMetadata[]> {
    try {
      // This would require querying information_schema.triggers
      // For now, return empty array as this is complex to implement
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Update column constraint information based on extracted constraints
   */
  private updateColumnConstraintInfo(columns: ColumnMetadata[], constraints: ConstraintMetadata[]): void {
    for (const constraint of constraints) {
      if (constraint.type === 'PRIMARY KEY') {
        for (const columnName of constraint.columns) {
          const column = columns.find(c => c.name === columnName);
          if (column) {
            column.isPrimaryKey = true;
          }
        }
      } else if (constraint.type === 'FOREIGN KEY') {
        for (const columnName of constraint.columns) {
          const column = columns.find(c => c.name === columnName);
          if (column) {
            column.isForeignKey = true;
            if (constraint.referencedTable && constraint.referencedColumns?.[0]) {
              column.references = {
                table: constraint.referencedTable,
                column: constraint.referencedColumns[0],
              };
            }
          }
        }
      }
    }
  }

  /**
   * Merge file-based and live schema information
   */
  private async mergeSchemas(
    fileSchema: Partial<SchemaExtractionResult>,
    liveSchema: Partial<SchemaExtractionResult>
  ): Promise<{ tables: TableMetadata[]; enums: EnumMetadata[]; functions: FunctionMetadata[] }> {
    
    // Prioritize file-based schema as it's more complete for structure
    // Use live schema to fill in gaps or validate
    
    const tables = fileSchema.tables || [];
    const enums = fileSchema.enums || [];
    const functions = fileSchema.functions || [];
    
    // Add any tables from live schema that weren't in files
    for (const liveTable of liveSchema.tables || []) {
      if (!tables.find(t => t.name === liveTable.name)) {
        tables.push(liveTable);
        this.logger.log(`Added table from live schema: ${liveTable.name}`);
      }
    }
    
    // Add any enums from live schema that weren't in files
    for (const liveEnum of liveSchema.enums || []) {
      if (!enums.find(e => e.name === liveEnum.name)) {
        enums.push(liveEnum);
        this.logger.log(`Added enum from live schema: ${liveEnum.name}`);
      }
    }
    
    // Add any functions from live schema that weren't in files
    for (const liveFunction of liveSchema.functions || []) {
      if (!functions.find(f => f.name === liveFunction.name)) {
        functions.push(liveFunction);
        this.logger.log(`Added function from live schema: ${liveFunction.name}`);
      }
    }
    
    return { tables, enums, functions };
  }
  /**
   * Remove duplicate tables and merge their metadata
   */
  private deduplicateTables(tables: TableMetadata[]): TableMetadata[] {
    const tableMap = new Map<string, TableMetadata>();
    
    for (const table of tables) {
      const existing = tableMap.get(table.name);
      if (existing) {
        // Merge table metadata
        existing.columns = this.mergeColumns(existing.columns, table.columns);
        existing.constraints = this.mergeConstraints(existing.constraints, table.constraints);
        existing.indexes = this.mergeIndexes(existing.indexes, table.indexes);
        existing.policies = this.mergePolicies(existing.policies, table.policies);
        existing.triggers = this.mergeTriggers(existing.triggers, table.triggers);
      } else {
        tableMap.set(table.name, { ...table });
      }
    }
    
    return Array.from(tableMap.values());
  }

  /**
   * Remove duplicate enums and merge their values
   */
  private deduplicateEnums(enums: EnumMetadata[]): EnumMetadata[] {
    const enumMap = new Map<string, EnumMetadata>();
    
    for (const enumDef of enums) {
      const existing = enumMap.get(enumDef.name);
      if (existing) {
        // Merge enum values
        const allValues = [...existing.values, ...enumDef.values];
        existing.values = Array.from(new Set(allValues));
      } else {
        enumMap.set(enumDef.name, { ...enumDef });
      }
    }
    
    return Array.from(enumMap.values());
  }

  /**
   * Remove duplicate functions
   */
  private deduplicateFunctions(functions: FunctionMetadata[]): FunctionMetadata[] {
    const functionMap = new Map<string, FunctionMetadata>();
    
    for (const func of functions) {
      // Use function name as key (could be enhanced to include parameter signature)
      if (!functionMap.has(func.name)) {
        functionMap.set(func.name, { ...func });
      }
    }
    
    return Array.from(functionMap.values());
  }

  /**
   * Merge column arrays, preferring more complete definitions
   */
  private mergeColumns(existing: ColumnMetadata[], incoming: ColumnMetadata[]): ColumnMetadata[] {
    const columnMap = new Map<string, ColumnMetadata>();
    
    // Add existing columns
    for (const col of existing) {
      columnMap.set(col.name, { ...col });
    }
    
    // Merge or add incoming columns
    for (const col of incoming) {
      const existingCol = columnMap.get(col.name);
      if (existingCol) {
        // Merge column metadata, preferring non-null/non-undefined values
        columnMap.set(col.name, {
          ...existingCol,
          type: col.type || existingCol.type,
          nullable: col.nullable !== undefined ? col.nullable : existingCol.nullable,
          defaultValue: col.defaultValue || existingCol.defaultValue,
          isPrimaryKey: col.isPrimaryKey || existingCol.isPrimaryKey,
          isForeignKey: col.isForeignKey || existingCol.isForeignKey,
          references: col.references || existingCol.references,
        });
      } else {
        columnMap.set(col.name, { ...col });
      }
    }
    
    return Array.from(columnMap.values());
  }

  /**
   * Merge constraint arrays
   */
  private mergeConstraints(existing: ConstraintMetadata[], incoming: ConstraintMetadata[]): ConstraintMetadata[] {
    const constraintMap = new Map<string, ConstraintMetadata>();
    
    for (const constraint of existing) {
      constraintMap.set(constraint.name, { ...constraint });
    }
    
    for (const constraint of incoming) {
      if (!constraintMap.has(constraint.name)) {
        constraintMap.set(constraint.name, { ...constraint });
      }
    }
    
    return Array.from(constraintMap.values());
  }

  /**
   * Merge index arrays
   */
  private mergeIndexes(existing: IndexMetadata[], incoming: IndexMetadata[]): IndexMetadata[] {
    const indexMap = new Map<string, IndexMetadata>();
    
    for (const index of existing) {
      indexMap.set(index.name, { ...index });
    }
    
    for (const index of incoming) {
      if (!indexMap.has(index.name)) {
        indexMap.set(index.name, { ...index });
      }
    }
    
    return Array.from(indexMap.values());
  }

  /**
   * Merge policy arrays
   */
  private mergePolicies(existing: PolicyMetadata[], incoming: PolicyMetadata[]): PolicyMetadata[] {
    const policyMap = new Map<string, PolicyMetadata>();
    
    for (const policy of existing) {
      policyMap.set(policy.name, { ...policy });
    }
    
    for (const policy of incoming) {
      if (!policyMap.has(policy.name)) {
        policyMap.set(policy.name, { ...policy });
      }
    }
    
    return Array.from(policyMap.values());
  }

  /**
   * Merge trigger arrays
   */
  private mergeTriggers(existing: TriggerMetadata[], incoming: TriggerMetadata[]): TriggerMetadata[] {
    const triggerMap = new Map<string, TriggerMetadata>();
    
    for (const trigger of existing) {
      triggerMap.set(trigger.name, { ...trigger });
    }
    
    for (const trigger of incoming) {
      if (!triggerMap.has(trigger.name)) {
        triggerMap.set(trigger.name, { ...trigger });
      }
    }
    
    return Array.from(triggerMap.values());
  }

  /**
   * Get Supabase version information
   */
  private async getSupabaseVersion(): Promise<string | undefined> {
    try {
      if (!this.supabaseClient) {
        return undefined;
      }
      
      const { data, error } = await this.supabaseClient.rpc('version');
      if (error) {
        return undefined;
      }
      
      return data;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Validate extracted schema for completeness
   */
  async validateExtractedSchema(schema: SchemaExtractionResult): Promise<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check for essential tables
    const essentialTables = ['user_roles', 'affaires', 'audiences', 'dossiers_recouvrement'];
    for (const tableName of essentialTables) {
      if (!schema.tables.find(t => t.name === tableName)) {
        warnings.push(`Essential table '${tableName}' not found in extracted schema`);
      }
    }
    
    // Check for essential enums
    const essentialEnums = ['app_role', 'statut_affaire', 'mode_paiement'];
    for (const enumName of essentialEnums) {
      if (!schema.enums.find(e => e.name === enumName)) {
        warnings.push(`Essential enum '${enumName}' not found in extracted schema`);
      }
    }
    
    // Validate table relationships
    for (const table of schema.tables) {
      for (const column of table.columns) {
        if (column.isForeignKey && column.references) {
          const referencedTable = schema.tables.find(t => t.name === column.references!.table);
          if (!referencedTable) {
            errors.push(`Table '${table.name}' column '${column.name}' references non-existent table '${column.references.table}'`);
          }
        }
      }
    }
    
    const isValid = errors.length === 0;
    
    this.logger.log(`Schema validation completed: ${isValid ? 'VALID' : 'INVALID'}`);
    if (warnings.length > 0) {
      this.logger.warn(`Schema validation warnings: ${warnings.length}`);
    }
    if (errors.length > 0) {
      this.logger.error(`Schema validation errors: ${errors.length}`);
    }
    
    return { isValid, warnings, errors };
  }

  /**
   * Export extracted schema to JSON file
   */
  async exportSchemaToFile(schema: SchemaExtractionResult, filePath: string): Promise<void> {
    try {
      const schemaJson = JSON.stringify(schema, null, 2);
      fs.writeFileSync(filePath, schemaJson, 'utf8');
      this.logger.log(`Schema exported to: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error exporting schema to file: ${error.message}`);
      throw error;
    }
  }
}