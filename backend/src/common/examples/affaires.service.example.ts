import { Injectable, ForbiddenException } from '@nestjs/common';
import { BaseCrudService, SecurityContext, CrudEntity } from '../services/base-crud.service';
import { SecurityUtils } from '../utils/security.utils';
import { PrismaService } from '../services/prisma.service';

// Types d'exemple
interface Affaire extends CrudEntity {
  reference: string;
  intitule: string;
  cabinetId: string;
  statut: string;
}

interface CreateAffaireDto {
  intitule: string;
  demandeurs: any[];
  defendeurs: any[];
  juridiction: string;
  chambre: string;
  notes?: string;
}

interface UpdateAffaireDto extends Partial<CreateAffaireDto> {
  statut?: string;
}

interface AffairesQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  statut?: string;
  juridiction?: string;
}

@Injectable()
export class AffairesService extends BaseCrudService<
  Affaire,
  CreateAffaireDto,
  UpdateAffaireDto,
  AffairesQueryDto
> {
  protected modelName = 'affaire';
  protected searchFields = ['reference', 'intitule', 'notes'];

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Implémentation des méthodes abstraites
  protected buildSecurityConditions(context: SecurityContext): any {
    return SecurityUtils.buildDefaultSecurityConditions(context);
  }

  protected async validateCreateData(
    data: CreateAffaireDto,
    context: SecurityContext,
  ): Promise<any> {
    // Génération automatique de la référence
    const reference = await this.generateReference();
    
    return {
      ...data,
      reference,
      cabinetId: context.cabinetId,
      statut: 'EN_COURS',
    };
  }

  protected async validateUpdateData(
    data: UpdateAffaireDto,
    context: SecurityContext,
    existing: Affaire,
  ): Promise<any> {
    // Vérifier les permissions de modification
    if (!SecurityUtils.canModifyEntity(context, existing)) {
      throw new ForbiddenException('Insufficient permissions to modify this affaire');
    }

    return data;
  }

  protected async validateDeletePermissions(
    context: SecurityContext,
    item: Affaire,
  ): Promise<void> {
    if (!SecurityUtils.canModifyEntity(context, item)) {
      throw new ForbiddenException('Insufficient permissions to delete this affaire');
    }

    // Vérifier qu'il n'y a pas d'audiences liées
    const audiencesCount = await this.prisma.audience.count({
      where: { affaireId: item.id },
    });

    if (audiencesCount > 0) {
      throw new ForbiddenException('Cannot delete affaire with linked audiences');
    }
  }

  // Surcharge des méthodes par défaut
  protected buildCustomFilters(query: AffairesQueryDto): any {
    const filters: any = {};

    if (query.statut) {
      filters.statut = query.statut;
    }

    if (query.juridiction) {
      filters.juridiction = query.juridiction;
    }

    return filters;
  }

  protected getIncludeRelations(): any {
    return {
      audiences: {
        select: {
          id: true,
          dateAudience: true,
          typeAudience: true,
        },
      },
      honoraires: {
        select: {
          id: true,
          montant: true,
          statut: true,
        },
      },
    };
  }

  protected transformResponse(item: any): Affaire {
    return {
      ...item,
      // Transformation spécifique si nécessaire
      audiencesCount: item.audiences?.length || 0,
    };
  }

  // Méthodes métier spécifiques
  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.affaire.count({
      where: {
        reference: {
          startsWith: `AFF-${year}-`,
        },
      },
    });

    return `AFF-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async findByReference(
    reference: string,
    context: SecurityContext,
  ): Promise<Affaire | null> {
    const where = {
      reference,
      ...this.buildSecurityConditions(context),
    };

    const item = await this.prisma.affaire.findFirst({
      where,
      include: this.getIncludeRelations(),
    });

    return item ? this.transformResponse(item) : null;
  }

  async getStatistics(context: SecurityContext) {
    const where = this.buildSecurityConditions(context);

    const [total, enCours, terminees, enAttente] = await Promise.all([
      this.prisma.affaire.count({ where }),
      this.prisma.affaire.count({ where: { ...where, statut: 'EN_COURS' } }),
      this.prisma.affaire.count({ where: { ...where, statut: 'TERMINEE' } }),
      this.prisma.affaire.count({ where: { ...where, statut: 'EN_ATTENTE' } }),
    ]);

    return {
      total,
      enCours,
      terminees,
      enAttente,
    };
  }
}

// Contrôleur correspondant
import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../controllers/base-crud.controller';

@Controller('affaires')
export class AffairesController extends BaseCrudController<
  Affaire,
  CreateAffaireDto,
  UpdateAffaireDto,
  AffairesQueryDto
> {
  constructor(private readonly affairesService: AffairesService) {
    super(affairesService);
  }

  // Endpoints spécifiques peuvent être ajoutés ici
  // @Get('statistics')
  // async getStatistics(@CurrentUser() user: AuthenticatedUser) {
  //   const context = this.buildSecurityContext(user);
  //   return this.affairesService.getStatistics(context);
  // }
}