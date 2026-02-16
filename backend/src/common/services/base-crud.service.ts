import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PaginationQueryDto, PaginatedResponse, PaginationMeta } from '../dto/pagination.dto';

export interface CrudEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface SecurityContext {
  userId: string;
  roles: string[];
  cabinetId?: string;
}

@Injectable()
export abstract class BaseCrudService<
  TEntity extends CrudEntity,
  TCreateDto = any,
  TUpdateDto = any,
  TQueryDto extends PaginationQueryDto = PaginationQueryDto
> {
  protected abstract modelName: string;
  protected abstract searchFields: string[];
  protected defaultLimit = 20;
  protected maxLimit = 100;

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Récupérer tous les enregistrements avec pagination
   */
  async findAll(
    query: TQueryDto,
    securityContext: SecurityContext,
  ): Promise<PaginatedResponse<TEntity>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(
      this.maxLimit,
      Math.max(1, query.limit || this.defaultLimit),
    );
    const skip = (page - 1) * limit;

    // Construction des conditions
    const where = {
      ...this.buildSearchConditions(query.search),
      ...this.buildSecurityConditions(securityContext),
      ...this.buildCustomFilters(query),
    };

    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder);

    // Exécution des requêtes
    const [data, total] = await Promise.all([
      (this.prisma as any)[this.modelName].findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: this.getIncludeRelations(),
      }),
      (this.prisma as any)[this.modelName].count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((item: any) => this.transformResponse(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Récupérer un enregistrement par ID
   */
  async findOne(
    id: string,
    securityContext: SecurityContext,
  ): Promise<TEntity> {
    const where = {
      id,
      ...this.buildSecurityConditions(securityContext),
    };

    const item = await (this.prisma as any)[this.modelName].findFirst({
      where,
      include: this.getIncludeRelations(),
    });

    if (!item) {
      throw new NotFoundException(
        `${this.modelName} avec l'ID ${id} non trouvé`,
      );
    }

    return this.transformResponse(item);
  }

  /**
   * Créer un nouvel enregistrement
   */
  async create(
    createDto: TCreateDto,
    securityContext: SecurityContext,
  ): Promise<TEntity> {
    // Validation et préparation des données
    const validatedData = await this.validateCreateData(createDto, securityContext);
    
    const dataWithMetadata = {
      ...validatedData,
      createdBy: securityContext.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const item = await (this.prisma as any)[this.modelName].create({
      data: dataWithMetadata,
      include: this.getIncludeRelations(),
    });

    return this.transformResponse(item);
  }

  /**
   * Mettre à jour un enregistrement
   */
  async update(
    id: string,
    updateDto: TUpdateDto,
    securityContext: SecurityContext,
  ): Promise<TEntity> {
    // Vérifier l'existence et les permissions
    const existingItem = await this.findOne(id, securityContext);
    
    // Validation des données
    const validatedData = await this.validateUpdateData(
      updateDto,
      securityContext,
      existingItem,
    );

    const dataWithMetadata = {
      ...validatedData,
      updatedAt: new Date(),
    };

    const item = await (this.prisma as any)[this.modelName].update({
      where: { id },
      data: dataWithMetadata,
      include: this.getIncludeRelations(),
    });

    return this.transformResponse(item);
  }

  /**
   * Supprimer un enregistrement
   */
  async remove(
    id: string,
    securityContext: SecurityContext,
  ): Promise<{ message: string }> {
    // Vérifier l'existence et les permissions
    const existingItem = await this.findOne(id, securityContext);
    
    // Validation des permissions de suppression
    await this.validateDeletePermissions(securityContext, existingItem);

    await (this.prisma as any)[this.modelName].delete({
      where: { id },
    });

    return { message: `${this.modelName} supprimé avec succès` };
  }

  // Méthodes abstraites à implémenter
  protected abstract buildSecurityConditions(context: SecurityContext): any;
  protected abstract validateCreateData(
    data: TCreateDto,
    context: SecurityContext,
  ): Promise<any>;
  protected abstract validateUpdateData(
    data: TUpdateDto,
    context: SecurityContext,
    existing: TEntity,
  ): Promise<any>;
  protected abstract validateDeletePermissions(
    context: SecurityContext,
    item: TEntity,
  ): Promise<void>;

  // Méthodes avec implémentation par défaut (surchargeable)
  protected buildSearchConditions(search?: string): any {
    if (!search || this.searchFields.length === 0) {
      return {};
    }

    return {
      OR: this.searchFields.map((field) => ({
        [field]: {
          contains: search,
          mode: 'insensitive',
        },
      })),
    };
  }

  protected buildOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): any {
    if (!sortBy) {
      return { createdAt: 'desc' };
    }
    return { [sortBy]: sortOrder };
  }

  protected buildCustomFilters(query: TQueryDto): any {
    // Implémentation par défaut vide
    // À surcharger dans les services enfants
    return {};
  }

  protected getIncludeRelations(): any {
    return {};
  }

  protected transformResponse(item: any): TEntity {
    return item;
  }
}