import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PaginationService } from './pagination.service';
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

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly paginationService: PaginationService,
  ) {}

  /**
   * Récupérer tous les enregistrements avec pagination
   * Utilise maintenant le PaginationService centralisé
   */
  async findAll(
    query: TQueryDto,
    securityContext: SecurityContext,
  ): Promise<PaginatedResponse<TEntity>> {
    // Construction des conditions de sécurité et filtres personnalisés
    const securityConditions = this.buildSecurityConditions(securityContext);
    const customFilters = this.buildCustomFilters(query);
    
    // Combinaison des conditions where
    const whereConditions = {
      ...securityConditions,
      ...customFilters,
    };

    // Utilisation du PaginationService centralisé
    const result = await this.paginationService.paginate<TEntity>(
      (this.prisma as any)[this.modelName],
      query,
      {
        where: whereConditions,
        include: this.getIncludeRelations(),
        searchFields: this.searchFields,
        defaultSortBy: this.getDefaultSortBy(),
      }
    );

    // Transformation des données si nécessaire
    return {
      ...result,
      data: result.data.map((item: any) => this.transformResponse(item)),
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

  /**
   * Recherche rapide pour autocomplete
   * Utilise la méthode searchOnly du PaginationService
   */
  async search(
    search: string,
    securityContext: SecurityContext,
    limit: number = 10,
  ): Promise<TEntity[]> {
    const securityConditions = this.buildSecurityConditions(securityContext);
    
    // Si on a des conditions de sécurité, on utilise la pagination normale avec une limite
    if (Object.keys(securityConditions).length > 0) {
      const result = await this.paginationService.paginate<TEntity>(
        (this.prisma as any)[this.modelName],
        { search, limit, page: 1 },
        {
          where: securityConditions,
          include: this.getIncludeRelations(),
          searchFields: this.searchFields,
          defaultSortBy: this.getDefaultSortBy(),
        }
      );
      return result.data.map((item: any) => this.transformResponse(item));
    }

    // Sinon, on utilise searchOnly pour plus d'efficacité
    const results = await this.paginationService.searchOnly<TEntity>(
      (this.prisma as any)[this.modelName],
      search,
      this.searchFields,
      limit
    );

    return results.map((item: any) => this.transformResponse(item));
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
  protected buildCustomFilters(query: TQueryDto): any {
    // Implémentation par défaut vide
    // À surcharger dans les services enfants
    return {};
  }

  protected getIncludeRelations(): any {
    return {};
  }

  protected getDefaultSortBy(): string {
    return 'createdAt';
  }

  protected transformResponse(item: any): TEntity {
    return item;
  }
}