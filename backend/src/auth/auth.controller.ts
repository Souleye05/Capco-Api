import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ChangePasswordDto,
  PasswordResetRequestDto,
  RefreshTokenDto,
  AuthResponse,
  UserProfile,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'User login with support for migrated users' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Register new user (non-migrated)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { refreshToken?: string }): Promise<{ message: string }> {
    return this.authService.logout(body.refreshToken);
  }

  @ApiOperation({ summary: 'Request password reset (especially for migrated users)' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  @Post('password-reset-request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto);
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req): Promise<UserProfile> {
    return this.authService.getProfile(req.user.id);
  }

  @ApiOperation({ summary: 'Check if current user is migrated from Supabase' })
  @ApiResponse({ status: 200, description: 'Migration status retrieved' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('migration-status')
  async getMigrationStatus(@Request() req): Promise<{ isMigrated: boolean }> {
    const isMigrated = await this.authService.isMigratedUser(req.user.id);
    return { isMigrated };
  }

  @ApiOperation({ summary: 'Get migration statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Migration stats retrieved' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('migration-stats')
  async getMigrationStats() {
    return this.authService.getMigrationStats();
  }

  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('validate')
  async validateToken(@Request() req): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: req.user,
    };
  }
}