import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PaginationQueryDto, PaginatedResponse, PaginationMeta } from '../dto/pagination.dto';

/**
 * Options for pagination configuration
 */
export interface PaginationOptions<T = any> {
  /** Prisma where clause for filtering */
  where?: T;
  /** Prisma include clause for relations */
  include?: any;
  /** Prisma select clause for field selection */
  select?: any;
  /** Array of searchable field names for dynamic search */
  searchFields?: string[];
  /** Default sort field if none provided */
  defaultSortBy?: string;
}

/**
 * Generic pagination service that centralizes pagination logic for all Prisma models
 * Supports dynamic search, sorting, and optimized queries using Prisma transactions
 */
@Injectable()
export class PaginationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generic pagination method that works with any Prisma model delegate
   * 
   * @param delegate - Prisma model delegate (e.g., prisma.user, prisma.affaires)
   * @param paginationQuery - Pagination parameters from request
   * @param options - Additional Prisma options (where, include, select, searchFields)
   * @returns Promise<PaginatedResponse<T>> - Paginated results with metadata
   * 
   * @example
   * ```typescript
   * // Basic usage
   * const result = await this.paginationService.paginate(
   *   this.prisma.user,
   *   paginationQuery,
   *   { searchFields: ['email', 'name'] }
   * );
   * 
   * // With custom where clause
   * const result = await this.paginationService.paginate(
   *   this.prisma.affaires,
   *   paginationQuery,
   *   {
   *     where: { statut: 'ACTIVE' },
   *     include: { audienceses: true },
   *     searchFields: ['reference', 'intitule']
   *   }
   * );
   * ```
   */
  async paginate<T>(
    delegate: any,
    paginationQuery: PaginationQueryDto,
    options: PaginationOptions = {}
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy,
      sortOrder = 'desc'
    } = paginationQuery;

    const {
      where = {},
      include,
      select,
      searchFields = [],
      defaultSortBy = 'createdAt'
    } = options;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build dynamic search conditions
    const searchConditions = this.buildSearchConditions(search, searchFields);

    // Combine base where clause with search conditions
    const finalWhere = searchConditions.length > 0
      ? {
          ...where,
          OR: searchConditions
        }
      : where;

    // Build dynamic sort conditions
    const orderBy = this.buildOrderBy(sortBy || defaultSortBy, sortOrder);

    // Build query options
    const queryOptions: any = {
      where: finalWhere,
      skip,
      take: limit,
      orderBy,
    };

    // Add include/select if provided
    if (include) queryOptions.include = include;
    if (select) queryOptions.select = select;

    // Use Prisma transaction for optimized parallel queries
    const [data, total] = await this.prisma.$transaction([
      delegate.findMany(queryOptions),
      delegate.count({ where: finalWhere })
    ]);

    // Calculate pagination metadata
    const pagination = this.calculatePaginationMeta(page, limit, total);

    return {
      data,
      pagination
    };
  }

  /**
   * Builds dynamic search conditions for multiple fields
   * 
   * @param search - Search term
   * @param searchFields - Array of field names to search in
   * @returns Array of search conditions for Prisma OR clause
   */
  private buildSearchConditions(search: string | undefined, searchFields: string[]): any[] {
    if (!search || searchFields.length === 0) {
      return [];
    }

    return searchFields.map(field => {
      // Handle nested field paths (e.g., 'user.email')
      if (field.includes('.')) {
        const [relation, nestedField] = field.split('.');
        return {
          [relation]: {
            [nestedField]: {
              contains: search,
              mode: 'insensitive'
            }
          }
        };
      }

      // Handle direct field search
      return {
        [field]: {
          contains: search,
          mode: 'insensitive'
        }
      };
    });
  }

  /**
   * Builds dynamic orderBy clause for Prisma
   * 
   * @param sortBy - Field name to sort by
   * @param sortOrder - Sort direction ('asc' or 'desc')
   * @returns Prisma orderBy object
   */
  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): any {
    // Handle nested field paths (e.g., 'user.createdAt')
    if (sortBy.includes('.')) {
      const [relation, nestedField] = sortBy.split('.');
      return {
        [relation]: {
          [nestedField]: sortOrder
        }
      };
    }

    // Handle direct field sorting
    return {
      [sortBy]: sortOrder
    };
  }

  /**
   * Calculates pagination metadata
   * 
   * @param page - Current page number
   * @param limit - Items per page
   * @param total - Total number of items
   * @returns PaginationMeta object with calculated values
   */
  private calculatePaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    };
  }

  /**
   * Helper method to create search-only pagination (useful for autocomplete)
   * 
   * @param delegate - Prisma model delegate
   * @param search - Search term
   * @param searchFields - Fields to search in
   * @param limit - Maximum results to return
   * @returns Promise<T[]> - Array of matching results
   */
  async searchOnly<T>(
    delegate: any,
    search: string,
    searchFields: string[],
    limit: number = 10
  ): Promise<T[]> {
    if (!search || searchFields.length === 0) {
      return [];
    }

    const searchConditions = this.buildSearchConditions(search, searchFields);

    return delegate.findMany({
      where: {
        OR: searchConditions
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }
}