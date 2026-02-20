import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto, PaginatedAuditResponse } from './dto/audit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Get all audit logs with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs retrieved successfully',
    type: PaginatedAuditResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions (admin role required)',
  })
  async findAll(@Query() query: AuditQueryDto): Promise<PaginatedAuditResponse> {
    return this.auditService.findAll(query);
  }

  @Get('user/:userId')
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID to filter audit logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User audit logs retrieved successfully',
    type: PaginatedAuditResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions (admin role required)',
  })
  async findByUser(
    @Param('userId') userId: string,
    @Query() query: AuditQueryDto,
  ): Promise<PaginatedAuditResponse> {
    return this.auditService.findByUser(userId, query);
  }

  @Get('module/:module')
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Get audit logs for a specific module' })
  @ApiParam({ name: 'module', description: 'Module name to filter audit logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Module audit logs retrieved successfully',
    type: PaginatedAuditResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions (admin role required)',
  })
  async findByModule(
    @Param('module') module: string,
    @Query() query: AuditQueryDto,
  ): Promise<PaginatedAuditResponse> {
    return this.auditService.findByModule(module, query);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiParam({ name: 'entityType', description: 'Type of entity to filter audit logs' })
  @ApiParam({ name: 'entityId', description: 'Entity ID to filter audit logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity audit logs retrieved successfully',
    type: PaginatedAuditResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: AuditQueryDto,
  ): Promise<PaginatedAuditResponse> {
    return this.auditService.findByEntity(entityType, entityId, query);
  }

  @Get('statistics')
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Get audit statistics and analytics' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Start date for statistics (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'End date for statistics (ISO string)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalLogs: { type: 'number', description: 'Total number of audit logs' },
        actionBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        moduleBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              module: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        topUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              userEmail: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions (admin role required)',
  })
  async getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.auditService.getStatistics(fromDate, toDate);
  }

  @Delete('cleanup')
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Clean up old audit logs (maintenance operation)' })
  @ApiQuery({ 
    name: 'daysToKeep', 
    required: false, 
    description: 'Number of days to keep audit logs (default: 365)',
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old audit logs cleaned up successfully',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number', description: 'Number of audit logs deleted' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions (admin role required)',
  })
  async cleanupOldLogs(@Query('daysToKeep', new ParseIntPipe({ optional: true })) daysToKeep?: number) {
    const deletedCount = await this.auditService.cleanupOldLogs(daysToKeep);
    return { deletedCount };
  }
}