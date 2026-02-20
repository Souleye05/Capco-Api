import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditLog } from '../common/decorators/audit-log.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { UsersService, UserWithRoles } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto,
  UserResponseDto,
  AssignRoleDto,
  UserRoleDto,
} from './dto/users.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { AppRole } from '@prisma/client';
import { SecurityContext } from '../common/services/base-crud.service';

interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Array<{ role: string }>;
  cabinetId?: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(AppRole.admin)
  @Get()
  @AuditLog({ action: 'LIST', module: 'users', entityType: 'User' })
  async findAll(
    @Query() query: UsersQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const securityContext = this.buildSecurityContext(user);
    const result = await this.usersService.findAll(query, securityContext);
    
    return {
      ...result,
      data: result.data.map(this.transformUserResponse),
    };
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  @AuditLog({ action: 'READ', module: 'users', entityType: 'User' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const securityContext = this.buildSecurityContext(user);
    const result = await this.usersService.findOne(id, securityContext);
    return this.transformUserResponse(result);
  }

  @ApiOperation({ summary: 'Create new user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid user data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(AppRole.admin)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({ action: 'CREATE', module: 'users', entityType: 'User' })
  async create(
    @Body() createDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const securityContext = this.buildSecurityContext(user);
    const result = await this.usersService.create(createDto, securityContext);
    return this.transformUserResponse(result);
  }

  @ApiOperation({ summary: 'Update user (admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(AppRole.admin)
  @Put(':id')
  @AuditLog({ action: 'UPDATE', module: 'users', entityType: 'User' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const securityContext = this.buildSecurityContext(user);
    const result = await this.usersService.update(id, updateDto, securityContext);
    return this.transformUserResponse(result);
  }

  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(AppRole.admin)
  @Delete(':id')
  @AuditLog({ action: 'DELETE', module: 'users', entityType: 'User' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    const securityContext = this.buildSecurityContext(user);
    return this.usersService.remove(id, securityContext);
  }

  @ApiOperation({ summary: 'Get user roles' })
  @ApiResponse({ status: 200, description: 'List of user roles' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Get(':id/roles')
  @AuditLog({ action: 'READ', module: 'users', entityType: 'UserRoles' })
  async getRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ roles: AppRole[] }> {
    const securityContext = this.buildSecurityContext(user);
    const roles = await this.usersService.getRoles(id, securityContext);
    return { roles };
  }

  @ApiOperation({ summary: 'Assign role to user (admin only)' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(AppRole.admin)
  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'CREATE', module: 'users', entityType: 'UserRoles' })
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    const securityContext = this.buildSecurityContext(user);
    await this.usersService.assignRole(id, assignRoleDto.role, securityContext);
    return { message: `Role ${assignRoleDto.role} assigned successfully` };
  }

  @ApiOperation({ summary: 'Remove role from user (admin only)' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(AppRole.admin)
  @Delete(':id/roles/:role')
  @AuditLog({ action: 'DELETE', module: 'users', entityType: 'UserRoles' })
  async removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('role') role: AppRole,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    const securityContext = this.buildSecurityContext(user);
    await this.usersService.removeRole(id, role, securityContext);
    return { message: `Role ${role} removed successfully` };
  }

  @ApiOperation({ summary: 'Get users by role (admin only)' })
  @ApiResponse({ status: 200, description: 'List of users with the specified role' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'role', description: 'Role name', enum: AppRole })
  @Roles(AppRole.admin)
  @Get('role/:role')
  @AuditLog({ action: 'READ', module: 'users', entityType: 'User' })
  async getUsersByRole(
    @Param('role') role: AppRole,
    @Query() query: UsersQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponse<any>> {
    const securityContext = this.buildSecurityContext(user);
    return this.usersService.getUsersByRole(role, query, securityContext);
  }

  private buildSecurityContext(user: AuthenticatedUser): SecurityContext {
    return {
      userId: user.id,
      roles: Array.isArray(user.roles) 
        ? user.roles.map(r => typeof r === 'string' ? r : r.role)
        : [],
      cabinetId: user.cabinetId,
    };
  }

  private transformUserResponse(userWithRoles: any): UserResponseDto {
    return {
      id: userWithRoles.id,
      email: userWithRoles.email,
      emailVerified: userWithRoles.emailVerified,
      roles: userWithRoles.userRoles.map((ur: any) => ur.role),
      createdAt: userWithRoles.createdAt,
      updatedAt: userWithRoles.updatedAt,
      lastSignIn: userWithRoles.lastSignIn,
      migrationSource: userWithRoles.migrationSource,
    };
  }
}
