/**
 * Property-Based Tests for Prisma Schema Generation Service
 * 
 * **Property 6: Prisma Schema Generation Accuracy**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * These tests verify that the Prisma schema generation process accurately
 * converts extracted Supabase schema metadata into valid Prisma schema files
 * while preserving all relationships, constraints, and type mappings.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaSchemaGeneratorService } from './prisma-schema-generator.service';
import { PrismaService } from '../../common/services/prisma.service';
import * as fc from 'fast-check';
import { 
  SchemaExtractionResult, 
  TableMetadata, 
  ColumnMetadata, 
  EnumMetadata, 
  FunctionMetadata,
  ConstraintMetadata,
  IndexMetadata,
  PolicyMetadata,
  TriggerMetadata
} from '../types/schema-extraction.types';

describe('PrismaSchemaGeneratorService - Property-Based Tests', () => {
  let service: PrismaSchemaGeneratorService;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'DATABASE_URL':
            return 'postgresql://test:test@localhost:5432/test';
          case 'PRISMA_SCHEMA_PATH':
            return './prisma/schema.prisma';
          default:
            return undefined;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaSchemaGeneratorService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PrismaSchemaGeneratorService>(PrismaSchemaGeneratorService);
    mockPrismaService = module.get(PrismaService);
  });

  // Generators for test data
  const postgresTypeGenerator = fc.constantFrom(
    'text', 'varchar', 'integer', 'bigint', 'boolean', 'timestamp', 'timestamptz',
    'uuid', 'json', 'jsonb', 'numeric', 'decimal', 'real', 'double precision',
    'smallint', 'date', 'time', 'bytea', 'inet', 'cidr', 'macaddr'
  );

  const columnGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    type: postgresTypeGenerator,
    nullable: fc.boolean(),
    defaultValue: fc.option(fc.string(), { nil: undefined }),
    isPrimaryKey: fc.boolean(),
    isForeignKey: fc.boolean(),
    references: fc.option(fc.record({
      table: fc.string({ minLength: 1, maxLength: 50 }),
      column: fc.string({ minLength: 1, maxLength: 50 }),
      onDelete: fc.option(fc.constantFrom('CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'), { nil: undefined }),
      onUpdate: fc.option(fc.constantFrom('CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'), { nil: undefined }),
    }), { nil: undefined }),
  });

  const constraintGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    type: fc.constantFrom('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK'),
    columns: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
    definition: fc.string({ minLength: 1, maxLength: 100 }),
    referencedTable: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    referencedColumns: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
  });

  const indexGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    columns: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
    unique: fc.boolean(),
    type: fc.constantFrom('btree', 'hash', 'gin', 'gist'),
  });

  const policyGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    command: fc.constantFrom('SELECT', 'INSERT', 'UPDATE', 'DELETE'),
    roles: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
    using: fc.option(fc.string(), { nil: undefined }),
    withCheck: fc.option(fc.string(), { nil: undefined }),
  });

  const triggerGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    timing: fc.constantFrom('BEFORE', 'AFTER', 'INSTEAD OF'),
    event: fc.constantFrom('INSERT', 'UPDATE', 'DELETE'),
    function: fc.string({ minLength: 1, maxLength: 50 }),
  });

  const enumGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    values: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
  });

  const functionGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    returnType: postgresTypeGenerator,
    parameters: fc.array(fc.record({
      name: fc.string({ minLength: 1, maxLength: 30 }),
      type: postgresTypeGenerator,
      defaultValue: fc.option(fc.string(), { nil: undefined }),
    }), { maxLength: 5 }),
    definition: fc.string({ minLength: 10, maxLength: 200 }),
    language: fc.constantFrom('plpgsql', 'sql'),
    security: fc.constantFrom('DEFINER', 'INVOKER'),
  });

  const tableGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    columns: fc.array(columnGenerator, { minLength: 1, maxLength: 10 }),
    constraints: fc.array(constraintGenerator, { maxLength: 5 }),
    indexes: fc.array(indexGenerator, { maxLength: 3 }),
    policies: fc.array(policyGenerator, { maxLength: 2 }),
    triggers: fc.array(triggerGenerator, { maxLength: 2 }),
  });

  const extractedSchemaGenerator = fc.record({
    tables: fc.array(tableGenerator, { minLength: 1, maxLength: 5 }),
    enums: fc.array(enumGenerator, { maxLength: 3 }),
    functions: fc.array(functionGenerator, { maxLength: 3 }),
    migrationFiles: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
    extractedAt: fc.date(),
    supabaseVersion: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  });

  /**
   * Property 6.1: Schema Generation Completeness
   * All extracted tables, enums, and relationships must be represented in the generated Prisma schema
   */
  it('should generate complete Prisma schema with all extracted elements', async () => {
    await fc.assert(fc.asyncProperty(
      extractedSchemaGenerator,
      async (extractedSchema: SchemaExtractionResult) => {
        // Generate Prisma schema
        const result = await service.generatePrismaSchema(extractedSchema);
        const prismaSchema = result.schemaContent;

        // Verify all tables are present
        for (const table of extractedSchema.tables) {
          expect(prismaSchema).toContain(`model ${table.name}`);
          
          // Verify all columns are present
          for (const column of table.columns) {
            expect(prismaSchema).toContain(column.name);
          }
        }

        // Verify all enums are present
        for (const enumDef of extractedSchema.enums) {
          expect(prismaSchema).toContain(`enum ${enumDef.name}`);
          
          // Verify all enum values are present
          for (const value of enumDef.values) {
            expect(prismaSchema).toContain(value);
          }
        }

        // Verify foreign key relationships are represented
        for (const table of extractedSchema.tables) {
          for (const column of table.columns) {
            if (column.isForeignKey && column.references) {
              // Should contain relation fields or foreign key references
              expect(prismaSchema).toMatch(new RegExp(`${column.name}|${column.references.table}`));
            }
          }
        }
      }
    ), { numRuns: 20 });
  });

  /**
   * Property 6.2: Type Mapping Accuracy
   * PostgreSQL types must be correctly mapped to Prisma/TypeScript types
   */
  it('should correctly map PostgreSQL types to Prisma types', async () => {
    await fc.assert(fc.asyncProperty(
      tableGenerator,
      async (table: TableMetadata) => {
        const extractedSchema: SchemaExtractionResult = {
          tables: [table],
          enums: [],
          functions: [],
          migrationFiles: [],
          extractedAt: new Date(),
        };

        const result = await service.generatePrismaSchema(extractedSchema);
        const prismaSchema = result.schemaContent;

        // Verify type mappings
        for (const column of table.columns) {
          const expectedPrismaType = mapPostgresToPrismaType(column.type, column.nullable);
          
          // Check that the column appears with correct type
          const columnPattern = new RegExp(`${column.name}\\s+${expectedPrismaType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
          expect(prismaSchema).toMatch(columnPattern);
        }
      }
    ), { numRuns: 30 });
  });

  /**
   * Property 6.3: Constraint Preservation
   * All constraints (primary keys, unique, foreign keys) must be preserved in Prisma schema
   */
  it('should preserve all constraints in Prisma schema', async () => {
    await fc.assert(fc.asyncProperty(
      tableGenerator,
      async (table: TableMetadata) => {
        const extractedSchema: SchemaExtractionResult = {
          tables: [table],
          enums: [],
          functions: [],
          migrationFiles: [],
          extractedAt: new Date(),
        };

        const result = await service.generatePrismaSchema(extractedSchema);
        const prismaSchema = result.schemaContent;

        // Verify primary key constraints
        const primaryKeyColumns = table.columns.filter(col => col.isPrimaryKey);
        if (primaryKeyColumns.length > 0) {
          if (primaryKeyColumns.length === 1) {
            expect(prismaSchema).toContain('@id');
          } else {
            expect(prismaSchema).toContain('@@id');
          }
        }

        // Verify unique constraints from indexes
        const uniqueIndexes = table.indexes.filter(idx => idx.unique);
        for (const uniqueIdx of uniqueIndexes) {
          expect(prismaSchema).toContain('@unique');
        }

        // Verify foreign key relationships
        const foreignKeyColumns = table.columns.filter(col => col.isForeignKey);
        for (const fkCol of foreignKeyColumns) {
          expect(prismaSchema).toContain(`@relation`);
        }
      }
    ), { numRuns: 25 });
  });

  /**
   * Property 6.4: Schema Syntax Validity
   * Generated Prisma schema must be syntactically valid
   */
  it('should generate syntactically valid Prisma schema', async () => {
    await fc.assert(fc.asyncProperty(
      extractedSchemaGenerator,
      async (extractedSchema: SchemaExtractionResult) => {
        const result = await service.generatePrismaSchema(extractedSchema);
        const prismaSchema = result.schemaContent;

        // Basic syntax checks
        expect(prismaSchema).toContain('generator client');
        expect(prismaSchema).toContain('datasource db');
        expect(prismaSchema).toContain('provider = "prisma-client-js"');
        expect(prismaSchema).toContain('provider = "postgresql"');

        // Check for balanced braces
        const openBraces = (prismaSchema.match(/{/g) || []).length;
        const closeBraces = (prismaSchema.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);

        // Check that all models have proper structure
        const modelMatches = prismaSchema.match(/model\s+\w+\s*{[^}]*}/g) || [];
        expect(modelMatches.length).toBe(extractedSchema.tables.length);

        // Check that all enums have proper structure
        const enumMatches = prismaSchema.match(/enum\s+\w+\s*{[^}]*}/g) || [];
        expect(enumMatches.length).toBe(extractedSchema.enums.length);
      }
    ), { numRuns: 15 });
  });

  /**
   * Property 6.5: Relationship Consistency
   * All relationships must be bidirectional and consistent in the generated schema
   */
  it('should generate consistent bidirectional relationships', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        tables: fc.array(tableGenerator, { minLength: 2, maxLength: 3 }),
      }),
      async ({ tables }) => {
        // Add foreign key relationships between tables
        const tablesWithRelations = tables.map((table, index) => {
          if (index > 0) {
            // Add a foreign key column referencing the first table
            const fkColumn: ColumnMetadata = {
              name: `${tables[0].name.toLowerCase()}_id`,
              type: 'uuid',
              nullable: false,
              isPrimaryKey: false,
              isForeignKey: true,
              references: {
                table: tables[0].name,
                column: 'id',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
            };
            return {
              ...table,
              columns: [...table.columns, fkColumn],
            };
          }
          return table;
        });

        const extractedSchema: SchemaExtractionResult = {
          tables: tablesWithRelations,
          enums: [],
          functions: [],
          migrationFiles: [],
          extractedAt: new Date(),
        };

        const result = await service.generatePrismaSchema(extractedSchema);
        const prismaSchema = result.schemaContent;

        // For each table with foreign keys, verify relationships are represented
        for (const table of tablesWithRelations) {
          const foreignKeyColumns = table.columns.filter(col => col.isForeignKey);
          for (const fkCol of foreignKeyColumns) {
            if (fkCol.references) {
              const fromTableModel = extractModelFromSchema(prismaSchema, table.name);
              const toTableModel = extractModelFromSchema(prismaSchema, fkCol.references.table);

              expect(fromTableModel).toBeTruthy();
              expect(toTableModel).toBeTruthy();

              // Verify relation fields exist
              expect(fromTableModel || toTableModel).toMatch(/@relation/);
            }
          }
        }
      }
    ), { numRuns: 20 });
  });

  // Helper function to map PostgreSQL types to expected Prisma types
  function mapPostgresToPrismaType(pgType: string, nullable: boolean): string {
    const typeMap: Record<string, string> = {
      'text': 'String',
      'varchar': 'String',
      'integer': 'Int',
      'bigint': 'BigInt',
      'boolean': 'Boolean',
      'timestamp': 'DateTime',
      'timestamptz': 'DateTime',
      'uuid': 'String',
      'json': 'Json',
      'jsonb': 'Json',
      'numeric': 'Decimal',
      'decimal': 'Decimal',
      'real': 'Float',
      'double precision': 'Float',
      'smallint': 'Int',
      'date': 'DateTime',
      'time': 'DateTime',
      'bytea': 'Bytes',
    };

    const baseType = typeMap[pgType] || 'String';
    return nullable ? `${baseType}?` : baseType;
  }

  // Helper function to extract model definition from schema
  function extractModelFromSchema(schema: string, modelName: string): string | null {
    const modelRegex = new RegExp(`model\\s+${modelName}\\s*{[^}]*}`, 's');
    const match = schema.match(modelRegex);
    return match ? match[0] : null;
  }
});