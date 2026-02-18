import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppRole } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'collaborateur', enum: AppRole, required: false })
  @IsOptional()
  @IsEnum(AppRole)
  role?: AppRole;
}

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-here' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentpassword' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh-token-here' })
  @IsString()
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: AppRole[];
  migrationSource: string | null;
  requiresPasswordReset: boolean;
  lastSignIn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    roles: AppRole[];
    migrationSource: string | null;
    requiresPasswordReset: boolean;
    lastSignIn: Date | null;
  };
  requiresPasswordReset: boolean;
}