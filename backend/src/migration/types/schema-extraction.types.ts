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

export interface SchemaValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface SchemaExtractionOptions {
  migrationPath?: string;
  includeLiveSchema?: boolean;
  validateSchema?: boolean;
  exportToFile?: string;
}