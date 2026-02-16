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
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../common/services/prisma.service';

/**
 * Contrôleur simple pour la gestion des affaires
 * Compatible avec les données migrées depuis Supabase
 */

interface CreateAffaireDto {
  reference: string;
  intitule: string;
  demandeurs?: any[];
  defendeurs?: any[];
  juridiction: string;
  chambre: string;
  notes?: string;
}

interface UpdateAffaireDto {
  reference?: string;
  intitule?: string;
  demandeurs?: any[];
  defendeurs?: any[];
  juridiction?: string;
  chambre?: string;
  statut?: 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
  notes?: string;
}

interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

@Controller('affaires')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SimpleAffairesController {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer toutes les affaires avec pagination
   */
  @Get()
  async findAll(
    @Query() query: PaginationQuery,
    @CurrentUser() user: any
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    // Construction des conditions de recherche
    const where: any = {};
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { intitule: { contains: query.search, mode: 'insensitive' } },
        { juridiction: { contains: query.search, mode: 'insensitive' } },
        { chambre: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    try {
      const [data, total] = await Promise.all([
        this.prisma.affaires.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            audienceses: {
              orderBy: { date: 'desc' },
              take: 3
            }
          }
        }),
        this.prisma.affaires.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: data.map(item => this.transformResponse(item)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des affaires: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupérer une affaire par ID
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any
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

      return this.transformResponse(affaire);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la récupération de l'affaire: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Créer une nouvelle affaire
   */
  @Post()
  async create(
    @Body() createDto: CreateAffaireDto,
    @CurrentUser() user: any
  ) {
    // Validation des données
    if (!createDto.reference || !createDto.intitule || !createDto.juridiction || !createDto.chambre) {
      throw new HttpException(
        'Les champs reference, intitule, juridiction et chambre sont obligatoires',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const affaire = await this.prisma.affaires.create({
        data: {
          reference: createDto.reference.trim(),
          intitule: createDto.intitule.trim(),
          demandeurs: createDto.demandeurs || [],
          defendeurs: createDto.defendeurs || [],
          juridiction: createDto.juridiction.trim(),
          chambre: createDto.chambre.trim(),
          statut: 'ACTIVE',
          notes: createDto.notes?.trim() || null,
          createdBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          audienceses: true
        }
      });

      return this.transformResponse(affaire);
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la création de l'affaire: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Mettre à jour une affaire
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAffaireDto,
    @CurrentUser() user: any
  ) {
    try {
      // Vérifier que l'affaire existe
      const existingAffaire = await this.prisma.affaires.findUnique({
        where: { id }
      });

      if (!existingAffaire) {
        throw new HttpException(
          `Affaire avec l'ID ${id} non trouvée`,
          HttpStatus.NOT_FOUND
        );
      }

      // Préparer les données de mise à jour
      const updateData: any = { updatedAt: new Date() };

      if (updateDto.reference !== undefined) {
        if (!updateDto.reference.trim()) {
          throw new HttpException('La référence ne peut pas être vide', HttpStatus.BAD_REQUEST);
        }
        updateData.reference = updateDto.reference.trim();
      }

      if (updateDto.intitule !== undefined) {
        if (!updateDto.intitule.trim()) {
          throw new HttpException('L\'intitulé ne peut pas être vide', HttpStatus.BAD_REQUEST);
        }
        updateData.intitule = updateDto.intitule.trim();
      }

      if (updateDto.demandeurs !== undefined) {
        updateData.demandeurs = updateDto.demandeurs;
      }

      if (updateDto.defendeurs !== undefined) {
        updateData.defendeurs = updateDto.defendeurs;
      }

      if (updateDto.juridiction !== undefined) {
        if (!updateDto.juridiction.trim()) {
          throw new HttpException('La juridiction ne peut pas être vide', HttpStatus.BAD_REQUEST);
        }
        updateData.juridiction = updateDto.juridiction.trim();
      }

      if (updateDto.chambre !== undefined) {
        if (!updateDto.chambre.trim()) {
          throw new HttpException('La chambre ne peut pas être vide', HttpStatus.BAD_REQUEST);
        }
        updateData.chambre = updateDto.chambre.trim();
      }

      if (updateDto.statut !== undefined) {
        if (!['ACTIVE', 'CLOTUREE', 'RADIEE'].includes(updateDto.statut)) {
          throw new HttpException('Statut invalide', HttpStatus.BAD_REQUEST);
        }
        updateData.statut = updateDto.statut;
      }

      if (updateDto.notes !== undefined) {
        updateData.notes = updateDto.notes?.trim() || null;
      }

      const affaire = await this.prisma.affaires.update({
        where: { id },
        data: updateData,
        include: {
          audienceses: {
            orderBy: { date: 'desc' }
          }
        }
      });

      return this.transformResponse(affaire);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la mise à jour de l'affaire: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Supprimer une affaire
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    // Seuls les admins peuvent supprimer des affaires
    if (!user.roles.includes('admin')) {
      throw new HttpException(
        'Seuls les administrateurs peuvent supprimer des affaires',
        HttpStatus.FORBIDDEN
      );
    }

    try {
      // Vérifier que l'affaire existe
      const existingAffaire = await this.prisma.affaires.findUnique({
        where: { id }
      });

      if (!existingAffaire) {
        throw new HttpException(
          `Affaire avec l'ID ${id} non trouvée`,
          HttpStatus.NOT_FOUND
        );
      }

      await this.prisma.affaires.delete({
        where: { id }
      });

      return { message: 'Affaire supprimée avec succès' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la suppression de l'affaire: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
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