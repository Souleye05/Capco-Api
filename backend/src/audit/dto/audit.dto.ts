import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'User ID who performed the action' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'User email who performed the action' })
  @IsString()
  userEmail: string;

  @ApiProperty({ description: 'Action performed (CREATE, UPDATE, DELETE, READ)' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Module where the action was performed' })
  @IsString()
  module: string;

  @ApiProperty({ description: 'Type of entity affected' })
  @IsString()
  entityType: string;

  @ApiPropertyOptional({ description: 'ID of the entity affected' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Reference of the entity affected' })
  @IsOptional()
  @IsString()
  entityReference?: string;
}

export class AuditQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by module' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: 'Filter by action' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO string)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO string)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Search term for general search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class AuditLogResponseDto {
  @ApiProperty({ description: 'Unique identifier of the audit log entry' })
  id: string;

  @ApiProperty({ description: 'User ID who performed the action' })
  userId: string;

  @ApiProperty({ description: 'User email who performed the action' })
  userEmail: string;

  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiProperty({ description: 'Module where the action was performed' })
  module: string;

  @ApiProperty({ description: 'Type of entity affected' })
  entityType: string;

  @ApiPropertyOptional({ description: 'ID of the entity affected' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'Reference of the entity affected' })
  entityReference?: string;

  @ApiProperty({ description: 'Timestamp when the action was performed' })
  createdAt: Date;
}

export class PaginatedAuditResponse {
  @ApiProperty({ type: [AuditLogResponseDto], description: 'Array of audit log entries' })
  data: AuditLogResponseDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}