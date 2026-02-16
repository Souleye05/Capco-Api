import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { SchemaExtractorService } from './schema-extractor.service';
import {
  SchemaExtractionResult,
  TableMetadata,
  EnumMetadata,
  FunctionMetadata,
  ColumnMetadata,
  ConstraintMetadata,
  PolicyMetadata,
  TriggerMetadata,
} from '../types/schema-extraction.types';

/**
 * Property-Based Tests for Schema Extraction Completeness
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 * 
 * These tests verify that the schema extraction process maintains completeness
 * and integrity across all extraction operations.
 */
describe('SchemaExtractorService - Property-Based Tests', () => {
  let service: SchemaExtractorService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchemaExtractorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'SUPABASE_URL':
                  return 'https://test.supabase.co';
                case 'SUPABASE_SERVICE_ROLE_KEY':
                  return 'test-service-role-key';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SchemaExtractorService>(SchemaExtractorService);
    configService = module.get<ConfigService>(ConfigService);
  });

  /**
   * Property 5: Schema Extraction Completeness
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   */
  describe('Property 5: Schema Extraction Completeness', () => {
    
    /**
     * Property: All tables extracted from migration files must be present in result
     */
    it('should extract all tables defined in migration files', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateMigrationFilesArbitrary(),
          async (migrationFiles) => {
            // Create temporary migration files
            const tempDir = await createTempMigrationFiles(migrationFiles);
            
            try {
              // Extract schema
              const result = await service.extractCompleteSchema(tempDir);
              
              // Verify all expected tables are present
              const expectedTables = extractExpectedTablesFromFiles(migrationFiles);
              
              for (const expectedTable of expectedTables) {
                const foundTable = result.tables.find(t => t.name === expectedTable.name);
                expect(foundTable).toBeDefined();
                expect(foundTable!.name).toBe(expectedTable.name);
                
                // Verify essential columns are present
                for (const expectedColumn of expectedTable.columns) {
                  const foundColumn = foundTable!.columns.find(c => c.name === expectedColumn.name);
                  expect(foundColumn).toBeDefined();
                  expect(foundColumn!.type).toBe(expectedColumn.type);
                }
              }
              
              // Verify extraction metadata
              expect(result.extractedAt).toBeInstanceOf(Date);
              expect(result.migrationFiles).toHaveLength(migrationFiles.length);
              expect(result.tables.length).toBeGreaterThanOrEqual(expectedTables.length);
              
            } finally {
              // Cleanup temp files
              await cleanupTempFiles(tempDir);
            }
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    });

    /**
     * Property: All enums extracted from migration files must be present in result
     */
    it('should extract all enums defined in migration files', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateEnumMigrationFilesArbitrary(),
          async (migrationFiles) => {
            const tempDir = await createTempMigrationFiles(migrationFiles);
            
            try {
              const result = await service.extractCompleteSchema(tempDir);
              const expectedEnums = extractExpectedEnumsFromFiles(migrationFiles);
              
              for (const expectedEnum of expectedEnums) {
                const foundEnum = result.enums.find(e => e.name === expectedEnum.name);
                expect(foundEnum).toBeDefined();
                expect(foundEnum!.values).toEqual(expect.arrayContaining(expectedEnum.values));
              }
              
              expect(result.enums.length).toBeGreaterThanOrEqual(expectedEnums.length);
              
            } finally {
              await cleanupTempFiles(tempDir);
            }
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    });

    /**
     * Property: Schema extraction must be idempotent
     */
    it('should produce identical results when run multiple times on same input', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateMigrationFilesArbitrary(),
          async (migrationFiles) => {
            const tempDir = await createTempMigrationFiles(migrationFiles);
            
            try {
              // Extract schema twice
              const result1 = await service.extractCompleteSchema(tempDir);
              const result2 = await service.extractCompleteSchema(tempDir);
              
              // Results should be identical (excluding timestamps)
              expect(result1.tables).toHaveLength(result2.tables.length);
              expect(result1.enums).toHaveLength(result2.enums.length);
              expect(result1.functions).toHaveLength(result2.functions.length);
              
              // Compare table structures
              for (let i = 0; i < result1.tables.length; i++) {
                const table1 = result1.tables[i];
                const table2 = result2.tables.find(t => t.name === table1.name);
                expect(table2).toBeDefined();
                expect(table1.columns).toHaveLength(table2!.columns.length);
                expect(table1.constraints).toHaveLength(table2!.constraints.length);
              }
              
              // Compare enum structures
              for (let i = 0; i < result1.enums.length; i++) {
                const enum1 = result1.enums[i];
                const enum2 = result2.enums.find(e => e.name === enum1.name);
                expect(enum2).toBeDefined();
                expect(enum1.values).toEqual(enum2!.values);
              }
              
            } finally {
              await cleanupTempFiles(tempDir);
            }
          }
        ),
        { numRuns: 5, timeout: 30000 }
      );
    });

    /**
     * Property: Schema validation must correctly identify missing essential elements
     */
    it('should validate schema completeness and identify missing elements', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateIncompleteSchemaArbitrary(),
          async (incompleteSchema) => {
            const validation = await service.validateExtractedSchema(incompleteSchema);
            
            // If schema is missing essential tables, validation should have warnings
            const hasEssentialTables = ['user_roles', 'affaires', 'audiences', 'dossiers_recouvrement']
              .every(tableName => incompleteSchema.tables.some(t => t.name === tableName));
            
            if (!hasEssentialTables) {
              expect(validation.warnings.length).toBeGreaterThan(0);
            }
            
            // If schema has broken references, validation should have errors
            const hasBrokenReferences = incompleteSchema.tables.some(table =>
              table.columns.some(column =>
                column.isForeignKey && 
                column.references && 
                !incompleteSchema.tables.some(t => t.name === column.references!.table)
              )
            );
            
            if (hasBrokenReferences) {
              expect(validation.errors.length).toBeGreaterThan(0);
              expect(validation.isValid).toBe(false);
            }
            
            // Validation result should be consistent
            expect(validation.isValid).toBe(validation.errors.length === 0);
          }
        ),
        { numRuns: 15, timeout: 30000 }
      );
    });

    /**
     * Property: Foreign key relationships must be preserved during extraction
     */
    it('should preserve all foreign key relationships in extracted schema', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateRelatedTablesArbitrary(),
          async (migrationFiles) => {
            const tempDir = await createTempMigrationFiles(migrationFiles);
            
            try {
              const result = await service.extractCompleteSchema(tempDir);
              const expectedRelationships = extractExpectedRelationshipsFromFiles(migrationFiles);
              
              for (const expectedRel of expectedRelationships) {
                const sourceTable = result.tables.find(t => t.name === expectedRel.sourceTable);
                expect(sourceTable).toBeDefined();
                
                const foreignKeyColumn = sourceTable!.columns.find(c => 
                  c.name === expectedRel.sourceColumn && c.isForeignKey
                );
                expect(foreignKeyColumn).toBeDefined();
                expect(foreignKeyColumn!.references).toBeDefined();
                expect(foreignKeyColumn!.references!.table).toBe(expectedRel.targetTable);
                expect(foreignKeyColumn!.references!.column).toBe(expectedRel.targetColumn);
                
                // Verify target table exists
                const targetTable = result.tables.find(t => t.name === expectedRel.targetTable);
                expect(targetTable).toBeDefined();
              }
              
            } finally {
              await cleanupTempFiles(tempDir);
            }
          }
        ),
        { numRuns: 8, timeout: 30000 }
      );
    });

    /**
     * Property: Enum values must be completely extracted and preserved
     */
    it('should extract all enum values without loss or corruption', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateComplexEnumArbitrary(),
          async (enumDefinitions) => {
            const migrationFiles = enumDefinitions.map((enumDef, index) => ({
              name: `migration_${index}.sql`,
              content: `CREATE TYPE ${enumDef.name} AS ENUM (${enumDef.values.map(v => `'${v}'`).join(', ')});`
            }));
            
            const tempDir = await createTempMigrationFiles(migrationFiles);
            
            try {
              const result = await service.extractCompleteSchema(tempDir);
              
              for (const expectedEnum of enumDefinitions) {
                const extractedEnum = result.enums.find(e => e.name === expectedEnum.name);
                expect(extractedEnum).toBeDefined();
                
                // All expected values must be present
                for (const expectedValue of expectedEnum.values) {
                  expect(extractedEnum!.values).toContain(expectedValue);
                }
                
                // No extra values should be added
                expect(extractedEnum!.values).toHaveLength(expectedEnum.values.length);
                
                // Order might not be preserved, but content must be identical
                expect(new Set(extractedEnum!.values)).toEqual(new Set(expectedEnum.values));
              }
              
            } finally {
              await cleanupTempFiles(tempDir);
            }
          }
        ),
        { numRuns: 12, timeout: 30000 }
      );
    });
  });
});
// Test Data Generators

/**
 * Generate arbitrary migration files with table definitions
 */
function generateMigrationFilesArbitrary() {
  return fc.array(
    fc.record({
      name: fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)).map(s => `${s}.sql`),
      content: generateTableDefinitionArbitrary(),
    }),
    { minLength: 1, maxLength: 5 }
  );
}

/**
 * Generate arbitrary table definition SQL
 */
function generateTableDefinitionArbitrary() {
  return fc.record({
    tableName: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
    columns: fc.array(
      fc.record({
        name: fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
        type: fc.oneof(
          fc.constant('UUID'),
          fc.constant('TEXT'),
          fc.constant('INTEGER'),
          fc.constant('BOOLEAN'),
          fc.constant('TIMESTAMP WITH TIME ZONE'),
          fc.constant('DECIMAL(12,2)'),
          fc.constant('DATE')
        ),
        nullable: fc.boolean(),
        primaryKey: fc.boolean(),
        defaultValue: fc.option(fc.oneof(
          fc.constant('gen_random_uuid()'),
          fc.constant('now()'),
          fc.constant('false'),
          fc.constant('0')
        )),
      }),
      { minLength: 2, maxLength: 8 }
    ),
  }).map(({ tableName, columns }) => {
    const columnDefs = columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (!col.nullable && !col.primaryKey) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    }).join(',\n  ');
    
    return `CREATE TABLE public.${tableName} (\n  ${columnDefs}\n);`;
  });
}

/**
 * Generate arbitrary migration files with enum definitions
 */
function generateEnumMigrationFilesArbitrary() {
  return fc.array(
    fc.record({
      name: fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)).map(s => `${s}.sql`),
      content: generateEnumDefinitionArbitrary(),
    }),
    { minLength: 1, maxLength: 3 }
  );
}

/**
 * Generate arbitrary enum definition SQL
 */
function generateEnumDefinitionArbitrary() {
  return fc.record({
    enumName: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
    values: fc.array(
      fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[A-Z][A-Z0-9_]*$/.test(s)),
      { minLength: 2, maxLength: 6 }
    ),
  }).map(({ enumName, values }) => {
    const uniqueValues = Array.from(new Set(values));
    const valuesList = uniqueValues.map(v => `'${v}'`).join(', ');
    return `CREATE TYPE ${enumName} AS ENUM (${valuesList});`;
  });
}

/**
 * Generate arbitrary incomplete schema for validation testing
 */
function generateIncompleteSchemaArbitrary() {
  return fc.record({
    tables: fc.array(
      fc.record({
        name: fc.oneof(
          fc.constant('user_roles'),
          fc.constant('affaires'),
          fc.constant('audiences'),
          fc.constant('dossiers_recouvrement'),
          fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s))
        ),
        columns: fc.array(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
            type: fc.oneof(fc.constant('UUID'), fc.constant('TEXT'), fc.constant('INTEGER')),
            nullable: fc.boolean(),
            isPrimaryKey: fc.boolean(),
            isForeignKey: fc.boolean(),
            references: fc.option(fc.record({
              table: fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
              column: fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
            })) as fc.Arbitrary<{ table: string; column: string; onDelete?: string; onUpdate?: string } | undefined>,
          }),
          { minLength: 1, maxLength: 5 }
        ),
        constraints: fc.array(fc.record({
          name: fc.string({ minLength: 3, maxLength: 20 }),
          type: fc.oneof(fc.constant('PRIMARY KEY'), fc.constant('FOREIGN KEY'), fc.constant('UNIQUE')) as fc.Arbitrary<'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'>,
          columns: fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
          definition: fc.string({ minLength: 10, maxLength: 100 }),
        }), { maxLength: 3 }),
        indexes: fc.array(fc.record({
          name: fc.string({ minLength: 3, maxLength: 20 }),
          columns: fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
          unique: fc.boolean(),
          type: fc.constant('btree'),
        }), { maxLength: 2 }),
        policies: fc.constant([]) as fc.Arbitrary<PolicyMetadata[]>,
        triggers: fc.constant([]) as fc.Arbitrary<TriggerMetadata[]>,
      }),
      { minLength: 1, maxLength: 8 }
    ),
    enums: fc.array(
      fc.record({
        name: fc.oneof(
          fc.constant('app_role'),
          fc.constant('statut_affaire'),
          fc.constant('mode_paiement'),
          fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s))
        ),
        values: fc.array(
          fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[A-Z][A-Z0-9_]*$/.test(s)),
          { minLength: 1, maxLength: 5 }
        ),
      }),
      { maxLength: 5 }
    ),
    functions: fc.constant([]) as fc.Arbitrary<FunctionMetadata[]>,
    migrationFiles: fc.array(fc.string(), { maxLength: 5 }),
    extractedAt: fc.constant(new Date()),
  });
}

/**
 * Generate arbitrary migration files with related tables (foreign keys)
 */
function generateRelatedTablesArbitrary() {
  return fc.tuple(
    // Parent table
    fc.record({
      name: fc.constant('parent_table.sql'),
      content: fc.constant(`
        CREATE TABLE public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `),
    }),
    // Child table with foreign key
    fc.record({
      name: fc.constant('child_table.sql'),
      content: fc.constant(`
        CREATE TABLE public.posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `),
    })
  ).map(([parent, child]) => [parent, child]);
}

/**
 * Generate arbitrary complex enum definitions
 */
function generateComplexEnumArbitrary() {
  return fc.array(
    fc.record({
      name: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
      values: fc.array(
        fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[A-Z][A-Z0-9_]*$/.test(s)),
        { minLength: 2, maxLength: 8 }
      ).map(values => Array.from(new Set(values))), // Remove duplicates
    }),
    { minLength: 1, maxLength: 4 }
  );
}

// Helper Functions

/**
 * Create temporary migration files for testing
 */
async function createTempMigrationFiles(migrationFiles: Array<{ name: string; content: string }>): Promise<string> {
  const tempDir = path.join(__dirname, '..', '..', '..', 'test-temp', `migration-test-${Date.now()}`);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  for (const file of migrationFiles) {
    const filePath = path.join(tempDir, file.name);
    fs.writeFileSync(filePath, file.content, 'utf8');
  }
  
  return tempDir;
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(tempDir: string): Promise<void> {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Extract expected tables from migration file content
 */
function extractExpectedTablesFromFiles(migrationFiles: Array<{ name: string; content: string }>): Array<{ name: string; columns: Array<{ name: string; type: string }> }> {
  const tables: Array<{ name: string; columns: Array<{ name: string; type: string }> }> = [];
  
  for (const file of migrationFiles) {
    const tableMatches = file.content.match(/CREATE\s+TABLE\s+(?:public\.)?(\w+)\s*\(\s*([^;]+?)\s*\);/gis);
    
    if (tableMatches) {
      for (const match of tableMatches) {
        const tableNameMatch = match.match(/CREATE\s+TABLE\s+(?:public\.)?(\w+)/i);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          const columnDefs = match.match(/\(\s*([^)]+)\s*\)/s);
          
          if (columnDefs) {
            const columns = columnDefs[1]
              .split(',')
              .map(col => col.trim())
              .filter(col => !col.match(/^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE)/i))
              .map(col => {
                const colMatch = col.match(/^(\w+)\s+([^\s,]+)/);
                if (colMatch) {
                  return { name: colMatch[1], type: colMatch[2] };
                }
                return null;
              })
              .filter(Boolean) as Array<{ name: string; type: string }>;
            
            tables.push({ name: tableName, columns });
          }
        }
      }
    }
  }
  
  return tables;
}

/**
 * Extract expected enums from migration file content
 */
function extractExpectedEnumsFromFiles(migrationFiles: Array<{ name: string; content: string }>): Array<{ name: string; values: string[] }> {
  const enums: Array<{ name: string; values: string[] }> = [];
  
  for (const file of migrationFiles) {
    const enumMatches = file.content.match(/CREATE\s+TYPE\s+(\w+)\s+AS\s+ENUM\s*\(\s*([^)]+)\s*\)/gi);
    
    if (enumMatches) {
      for (const match of enumMatches) {
        const enumMatch = match.match(/CREATE\s+TYPE\s+(\w+)\s+AS\s+ENUM\s*\(\s*([^)]+)\s*\)/i);
        if (enumMatch) {
          const enumName = enumMatch[1];
          const values = enumMatch[2]
            .split(',')
            .map(v => v.trim().replace(/^'|'$/g, ''))
            .filter(v => v.length > 0);
          
          enums.push({ name: enumName, values });
        }
      }
    }
  }
  
  return enums;
}

/**
 * Extract expected relationships from migration file content
 */
function extractExpectedRelationshipsFromFiles(migrationFiles: Array<{ name: string; content: string }>): Array<{
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}> {
  const relationships: Array<{
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
  }> = [];
  
  for (const file of migrationFiles) {
    // Extract from column definitions with REFERENCES
    const refMatches = file.content.match(/CREATE\s+TABLE\s+(?:public\.)?(\w+)\s*\([^;]+?(\w+)\s+[^,\n]*REFERENCES\s+(?:public\.)?(\w+)\s*\(\s*(\w+)\s*\)[^;]*;/gis);
    
    if (refMatches) {
      for (const match of refMatches) {
        const tableMatch = match.match(/CREATE\s+TABLE\s+(?:public\.)?(\w+)/i);
        const refMatch = match.match(/(\w+)\s+[^,\n]*REFERENCES\s+(?:public\.)?(\w+)\s*\(\s*(\w+)\s*\)/i);
        
        if (tableMatch && refMatch) {
          relationships.push({
            sourceTable: tableMatch[1],
            sourceColumn: refMatch[1],
            targetTable: refMatch[2],
            targetColumn: refMatch[3],
          });
        }
      }
    }
  }
  
  return relationships;
}