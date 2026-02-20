import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { AppRole } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: ['collaborateur'], enum: AppRole, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(AppRole, { each: true })
  roles?: AppRole[];
}

export class UpdateUserDto {
  @ApiProperty({ example: 'newemail@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ example: 'admin', enum: AppRole })
  @IsEnum(AppRole)
  role: AppRole;
}

export class UsersQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: 'admin', enum: AppRole, required: false })
  @IsOptional()
  @IsEnum(AppRole)
  filterByRole?: AppRole;
}

export class UserRoleDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'admin', enum: AppRole })
  @IsEnum(AppRole)
  role: AppRole;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;
}

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiProperty({ example: ['admin', 'collaborateur'], isArray: true })
  roles: AppRole[];

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: '2024-01-15T14:30:00Z', required: false })
  lastSignIn?: Date;

  @ApiProperty({ example: 'supabase', required: false })
  migrationSource?: string | null;
}

export class UserWithoutPasswordDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiProperty({ example: ['admin', 'collaborateur'], isArray: true })
  roles: AppRole[];

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  updatedAt: Date;
}
