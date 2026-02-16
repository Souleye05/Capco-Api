import { 
  Controller, 
  Body, 
  UseGuards,
  HttpException,
  HttpStatus,
  Get,
  Post,
  Param,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../common/services/prisma.service';

/**
 * Contrôleur pour la gestion des affaires
 * Compatible avec les données migrées depuis Supabase
 */

export interface CreateAffaireDto {
  reference: string;
  intitule: string;
  demandeurs?: any[];
  defendeurs?: any[];
  juridiction: string;
  chambre: string;
  notes?: string;
}

export interface UpdateAffaireDto {
  reference?: string;
  intitule?: string;
  demandeurs?: any[];
  defendeurs?: any[];
  juridiction?: string;
  chambre?: string;
  statut?: 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
  notes?: string;
}

@Controller('affaires')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AffairesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('admin', 'collaborateur')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('statut') statut?: string
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (statut) {
      where.statut = statut;
    }
    
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { intitule: { contains: search, mode: 'insensitive' } },
        { juridiction: { contains: search, mode: 'insensitive' } },
        { chambre: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const [affaires, total] = await Promise.all([
        this.prisma.affaires.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          include: {
            audienceses: {
              orderBy: { date: 'desc' },
              take: 5
            },
            honorairesContentieuxes: true,
            depensesAffaireses: {
              orderBy: { date: 'desc' },
              take: 10
            }
          }
        }),
        this.prisma.affaires.count({ where })
      ]);

      return {
        data: affaires.map(this.transformResponse),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des affaires: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @Roles('admin', 'collaborateur')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    try {
      const affaire = await this.prisma.affaires.findUnique({
        where: { id },
        include: {
          audienceses: {
            orderBy: { date: 'desc' }
          },
          honorairesContentieuxes: true,
          depensesAffaireses: {
            orderBy: { date: 'desc' }
          }
        }
      });

      if (!affaire) {
        throw new HttpException(
          `Affaire avec l'ID ${id} non trouvée`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        data: this.transformResponse(affaire)
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la récupération de l'affaire: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @Roles('admin', 'collaborateur')
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateAffaireDto
  ) {
    const validatedData = this.validateCreateData(createDto, user);

    try {
      const affaire = await this.prisma.affaires.create({
        data: {
          ...validatedData,
          createdBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          audienceses: true,
          honorairesContentieuxes: true,
          depensesAffaireses: true
        }
      });

      return {
        data: this.transformResponse(affaire),
        message: 'Affaire créée avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la création de l'affaire: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Validation des données de création
   */
  private validateCreateData(data: CreateAffaireDto, user: any): any {
    if (!data.reference || !data.intitule || !data.juridiction || !data.chambre) {
      throw new HttpException(
        'Les champs reference, intitule, juridiction et chambre sont obligatoires',
        HttpStatus.BAD_REQUEST
      );
    }

    return {
      reference: data.reference.trim(),
      intitule: data.intitule.trim(),
      demandeurs: data.demandeurs || [],
      defendeurs: data.defendeurs || [],
      juridiction: data.juridiction.trim(),
      chambre: data.chambre.trim(),
      statut: 'ACTIVE',
      notes: data.notes?.trim() || null
    };
  }

  /**
   * Transformation de la réponse pour maintenir la compatibilité Supabase
   */
  private transformResponse(item: any): any {
    return {
      id: item.id,
      reference: item.reference,
      intitule: item.intitule,
      demandeurs: item.demandeurs,
      defendeurs: item.defendeurs,
      juridiction: item.juridiction,
      chambre: item.chambre,
      statut: item.statut,
      notes: item.notes,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      created_by: item.createdBy,
      // Relations
      audiences: item.audienceses?.map(audience => ({
        id: audience.id,
        date: audience.date,
        heure: audience.heure,
        objet: audience.objet,
        statut: audience.statut,
        notes_preparation: audience.notesPreparation,
        created_at: audience.createdAt
      })) || [],
      honoraires_contentieux: item.honorairesContentieuxes?.map(honoraire => ({
        id: honoraire.id,
        montant_facture: honoraire.montantFacture,
        montant_encaisse: honoraire.montantEncaisse,
        date_facturation: honoraire.dateFacturation,
        notes: honoraire.notes,
        created_at: honoraire.createdAt
      })) || [],
      depenses_affaires: item.depensesAffaireses?.map(depense => ({
        id: depense.id,
        date: depense.date,
        type_depense: depense.typeDepense,
        nature: depense.nature,
        montant: depense.montant,
        description: depense.description,
        justificatif: depense.justificatif,
        created_at: depense.createdAt
      })) || []
    };
  }
}