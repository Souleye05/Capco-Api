import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateAuditLogDto, AuditQueryDto, AuditLogResponseDto, PaginatedAuditResponse } from './dto/audit.dto';
import { createDateFilter } from '../common/utils/date.utils';

// Types de remplacement pour AuditLog
interface AuditLogWhereInput {
  AND?: AuditLogWhereInput[];
  OR?: AuditLogWhereInput[];
  action?: { contains?: string; mode?: 'insensitive' };
  entityType?: { contains?: string; mode?: 'insensitive' };
  entityId?: { contains?: string; mode?: 'insensitive' };
  userId?: { contains?: string; mode?: 'insensitive' };
  userEmail?: { contains?: string; mode?: 'insensitive' };
  module?: { contains?: string; mode?: 'insensitive' };
  entityReference?: { contains?: string; mode?: 'insensitive' };
  createdAt?: DateTimeFilter;
}

interface DateTimeFilter {
  gte?: Date;
  lte?: Date;
}

interface AuditLogOrderByWithRelationInput {
  createdAt?: 'asc' | 'desc';
}

interface AuditLogGetPayload {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  module: string;
  entityReference: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  
  // Whitelist des champs autorisés pour le tri
  private readonly allowedSortFields = ['createdAt', 'action', 'module', 'userEmail'] as const;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new audit log entry
   */
  async log(createAuditLogDto: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: createAuditLogDto,
      });
      
      this.logger.debug(`Audit log created: ${createAuditLogDto.action} on ${createAuditLogDto.entityType} by ${createAuditLogDto.userEmail}`);
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Find all audit logs with pagination and filtering
   */
  async findAll(query: AuditQueryDto): Promise<PaginatedAuditResponse> {
    const {
      page = 1,
      limit = 10,
      userId,
      module,
      action,
      entityType,
      entityId,
      fromDate,
      toDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Validation et sécurisation du champ sortBy
    const safeSortBy = this.allowedSortFields.includes(sortBy as any) ? sortBy : 'createdAt';

    // Build where clause
    const where: AuditLogWhereInput = {};
    const conditions: AuditLogWhereInput[] = [];

    if (userId) {
      conditions.push({ 
        userId: {
          contains: userId,
          mode: 'insensitive',
        }
      });
    }

    if (module) {
      conditions.push({
        module: {
          contains: module,
          mode: 'insensitive',
        }
      });
    }

    if (action) {
      conditions.push({
        action: {
          contains: action,
          mode: 'insensitive',
        }
      });
    }

    if (entityType) {
      conditions.push({
        entityType: {
          contains: entityType,
          mode: 'insensitive',
        }
      });
    }

    if (entityId) {
      conditions.push({ 
        entityId: {
          contains: entityId,
          mode: 'insensitive',
        }
      });
    }

    if (fromDate || toDate) {
      const dateFilter = createDateFilter(fromDate, toDate);
      if (dateFilter) {
        conditions.push({ createdAt: dateFilter });
      }
    }

    // Gestion du search avec AND pour éviter les conflits
    if (search) {
      const searchCondition: AuditLogWhereInput = {
        OR: [
          { userEmail: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { module: { contains: search, mode: 'insensitive' } },
          { entityType: { contains: search, mode: 'insensitive' } },
          { entityReference: { contains: search, mode: 'insensitive' } },
        ]
      };
      conditions.push(searchCondition);
    }

    // Combine all conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    // Build orderBy clause avec le champ sécurisé
    const orderBy: AuditLogOrderByWithRelationInput = {};
    orderBy[safeSortBy] = sortOrder;

    try {
      const [auditLogs, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: auditLogs.map(this.mapToResponseDto),
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  /**
   * Find audit logs by user ID
   */
  async findByUser(userId: string, query: AuditQueryDto): Promise<PaginatedAuditResponse> {
    return this.findAll({ ...query, userId });
  }

  /**
   * Find audit logs by module
   */
  async findByModule(module: string, query: AuditQueryDto): Promise<PaginatedAuditResponse> {
    return this.findAll({ ...query, module });
  }

  /**
   * Find audit logs by entity
   */
  async findByEntity(entityType: string, entityId: string, query: AuditQueryDto): Promise<PaginatedAuditResponse> {
    return this.findAll({ ...query, entityType, entityId });
  }

  /**
   * Get audit statistics
   */
  async getStatistics(fromDate?: string, toDate?: string): Promise<{
    totalLogs: number;
    actionBreakdown: { action: string; count: number }[];
    moduleBreakdown: { module: string; count: number }[];
    topUsers: { userId: string; userEmail: string; count: number }[];
  }> {
    const where: AuditLogWhereInput = {};

    if (fromDate || toDate) {
      const dateFilter = createDateFilter(fromDate, toDate);
      if (dateFilter) {
        where.createdAt = dateFilter;
      }
    }

    try {
      const [totalLogs, actionStats, moduleStats, userStats] = await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
        }),
        this.prisma.auditLog.groupBy({
          by: ['module'],
          where,
          _count: { module: true },
          orderBy: { _count: { module: 'desc' } },
        }),
        this.prisma.auditLog.groupBy({
          by: ['userId', 'userEmail'],
          where,
          _count: { userId: true },
          orderBy: { _count: { userId: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        totalLogs,
        actionBreakdown: actionStats.map(stat => ({
          action: stat.action,
          count: stat._count.action,
        })),
        moduleBreakdown: moduleStats.map(stat => ({
          module: stat.module,
          count: stat._count.module,
        })),
        topUsers: userStats.map(stat => ({
          userId: stat.userId,
          userEmail: stat.userEmail,
          count: stat._count.userId,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get audit statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (for maintenance)
   */
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} audit logs older than ${daysToKeep} days`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup old audit logs:', error);
      throw error;
    }
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponseDto(auditLog: AuditLogGetPayload): AuditLogResponseDto {
    return {
      id: auditLog.id,
      userId: auditLog.userId,
      userEmail: auditLog.userEmail,
      action: auditLog.action,
      module: auditLog.module,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      entityReference: auditLog.entityReference,
      createdAt: auditLog.createdAt,
    };
  }
}