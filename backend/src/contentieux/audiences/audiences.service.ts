import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { AudienceResponseDto } from './dto/audience-response.dto';
import { AudiencesQueryDto } from './dto/audiences-query.dto';
import { CreateResultatAudienceDto } from './dto/create-resultat-audience.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AudiencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Créer une nouvelle audience
   */
  async create(createAudienceDto: CreateAudienceDto, userId: string): Promise<AudienceResponseDto> {
    // Vérifier que l'affaire existe
    const affaire = await this.prisma.affaires.findUnique({
      where: { id: createAudienceDto.affaireId },
    });

    if (!affaire) {
      throw new NotFoundException(`Affaire avec l'ID ${createAudienceDto.affaireId} non trouvée`);
    }

    // Calculer la date de rappel d'enrôlement (4 jours ouvrables avant)
    const dateRappelEnrolement = this.calculateRappelDate(new Date(createAudienceDto.date));

    const audience = await this.prisma.audiences.create({
      data: {
        affaireId: createAudienceDto.affaireId,
        date: new Date(createAudienceDto.date),
        heure: createAudienceDto.heure,
        type: createAudienceDto.type || 'MISE_EN_ETAT',
        juridiction: createAudienceDto.juridiction,
        chambre: createAudienceDto.chambre,
        ville: createAudienceDto.ville,
        statut: createAudienceDto.statut || 'A_VENIR',
        notesPreparation: createAudienceDto.notesPreparation,
        est_preparee: createAudienceDto.estPreparee || false,
        rappel_enrolement: createAudienceDto.rappelEnrolement || false,
        date_rappel_enrolement: dateRappelEnrolement,
        createdBy: userId,
      },
      include: {
        affaire: {
          include: {
            parties_affaires: true,
          },
        },
        resultat: true,
      },
    });

    return this.mapToResponseDto(audience);
  }

  /**
   * Récupérer toutes les audiences avec pagination et recherche
   */
  async findAll(query: AudiencesQueryDto): Promise<PaginatedResponse<AudienceResponseDto>> {
    const whereClause: any = {};

    // Filtres
    if (query.statut) whereClause.statut = query.statut;
    if (query.type) whereClause.type = query.type;
    if (query.affaireId) whereClause.affaireId = query.affaireId;
    
    // Filtre par date
    if (query.dateDebut || query.dateFin) {
      whereClause.date = {};
      if (query.dateDebut) whereClause.date.gte = query.dateDebut;
      if (query.dateFin) whereClause.date.lte = query.dateFin;
    }

    const result = await this.paginationService.paginate(
      this.prisma.audiences,
      query,
      {
        where: whereClause,
        include: {
          affaire: {
            include: {
              parties_affaires: true,
            },
          },
          resultat: true,
        },
        searchFields: ['juridiction', 'chambre', 'ville', 'affaire.reference', 'affaire.intitule'],
        defaultSortBy: 'date',
      }
    );

    return {
      data: result.data.map(audience => this.mapToResponseDto(audience)),
      pagination: result.pagination,
    };
  }

  /**
   * Récupérer une audience par ID
   */
  async findOne(id: string): Promise<AudienceResponseDto> {
    const audience = await this.prisma.audiences.findUnique({
      where: { id },
      include: {
        affaire: {
          include: {
            parties_affaires: true,
          },
        },
        resultat: true,
      },
    });

    if (!audience) {
      throw new NotFoundException(`Audience avec l'ID ${id} non trouvée`);
    }

    return this.mapToResponseDto(audience);
  }

  /**
   * Mettre à jour une audience
   */
  async update(id: string, updateAudienceDto: UpdateAudienceDto): Promise<AudienceResponseDto> {
    // Vérifier que l'audience existe
    await this.findOne(id);

    // Recalculer la date de rappel si la date change
    let dateRappelEnrolement: Date | undefined;
    if (updateAudienceDto.date) {
      dateRappelEnrolement = this.calculateRappelDate(new Date(updateAudienceDto.date));
    }

    const audience = await this.prisma.audiences.update({
      where: { id },
      data: {
        ...updateAudienceDto,
        date_rappel_enrolement: dateRappelEnrolement,
        updated_at: new Date(),
      },
      include: {
        affaire: {
          include: {
            parties_affaires: true,
          },
        },
        resultat: true,
      },
    });

    return this.mapToResponseDto(audience);
  }

  /**
   * Supprimer une audience
   */
  async remove(id: string): Promise<void> {
    // Vérifier que l'audience existe
    await this.findOne(id);

    await this.prisma.audiences.delete({
      where: { id },
    });
  }

  /**
   * Créer un résultat d'audience
   */
  async createResultat(audienceId: string, createResultatDto: CreateResultatAudienceDto, userId: string) {
    // Vérifier que l'audience existe
    const audience = await this.findOne(audienceId);

    // Vérifier qu'il n'y a pas déjà un résultat
    const existingResultat = await this.prisma.resultatsAudiences.findFirst({
      where: { audienceId },
    });

    if (existingResultat) {
      throw new BadRequestException('Cette audience a déjà un résultat');
    }

    const resultat = await this.prisma.resultatsAudiences.create({
      data: {
        audienceId,
        type: createResultatDto.type,
        nouvelleDate: createResultatDto.nouvelleDate,
        motifRenvoi: createResultatDto.motifRenvoi,
        motifRadiation: createResultatDto.motifRadiation,
        texteDelibere: createResultatDto.texteDelibere,
        createdBy: userId,
      },
    });

    // Mettre à jour le statut de l'audience
    await this.prisma.audiences.update({
      where: { id: audienceId },
      data: { statut: 'RENSEIGNEE' },
    });

    return resultat;
  }

  /**
   * Marquer l'enrôlement comme effectué
   */
  async marquerEnrolementEffectue(id: string): Promise<AudienceResponseDto> {
    const audience = await this.prisma.audiences.update({
      where: { id },
      data: { 
        enrolement_effectue: true,
        updated_at: new Date(),
      },
      include: {
        affaire: {
          include: {
            parties_affaires: true,
          },
        },
        resultat: true,
      },
    });

    return this.mapToResponseDto(audience);
  }

  /**
   * Récupérer les audiences nécessitant un rappel d'enrôlement
   */
  async getAudiencesRappelEnrolement(): Promise<AudienceResponseDto[]> {
    const audiences = await this.prisma.audiences.findMany({
      where: {
        rappel_enrolement: true,
        enrolement_effectue: false,
        date_rappel_enrolement: {
          lte: new Date(),
        },
        statut: 'A_VENIR',
      },
      include: {
        affaire: {
          include: {
            parties_affaires: true,
          },
        },
        resultat: true,
      },
      orderBy: { date: 'asc' },
    });

    return audiences.map(audience => this.mapToResponseDto(audience));
  }

  /**
   * Calculer la date de rappel d'enrôlement (4 jours ouvrables avant)
   */
  private calculateRappelDate(dateAudience: Date): Date {
    const date = new Date(dateAudience);
    let joursOuvrables = 0;
    
    while (joursOuvrables < 4) {
      date.setDate(date.getDate() - 1);
      const dayOfWeek = date.getDay();
      // Exclure samedi (6) et dimanche (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        joursOuvrables++;
      }
    }
    
    return date;
  }

  /**
   * Mapper une audience vers le DTO de réponse
   */
  private mapToResponseDto(audience: any): AudienceResponseDto {
    return {
      id: audience.id,
      affaireId: audience.affaireId,
      affaire: {
        id: audience.affaire.id,
        reference: audience.affaire.reference,
        intitule: audience.affaire.intitule,
        parties: audience.affaire.parties_affaires?.map(partie => ({
          id: partie.id,
          nom: partie.nom,
          role: partie.role,
        })) || [],
      },
      date: audience.date,
      heure: audience.heure,
      type: audience.type,
      juridiction: audience.juridiction,
      chambre: audience.chambre,
      ville: audience.ville,
      statut: audience.statut,
      notesPreparation: audience.notesPreparation,
      estPreparee: audience.est_preparee || false,
      rappelEnrolement: audience.rappel_enrolement || false,
      dateRappelEnrolement: audience.date_rappel_enrolement,
      enrolementEffectue: audience.enrolement_effectue || false,
      resultat: audience.resultat?.[0] ? {
        id: audience.resultat[0].id,
        type: audience.resultat[0].type,
        nouvelleDate: audience.resultat[0].nouvelleDate,
        motifRenvoi: audience.resultat[0].motifRenvoi,
        motifRadiation: audience.resultat[0].motifRadiation,
        texteDelibere: audience.resultat[0].texteDelibere,
      } : null,
      createdAt: audience.createdAt,
      updatedAt: audience.updated_at,
    };
  }

  /**
   * Obtenir les statistiques des audiences
   */
  async getStatistics() {
    const [total, aVenir, tenues, nonRenseignees] = await Promise.all([
      this.prisma.audiences.count(),
      this.prisma.audiences.count({ where: { statut: 'A_VENIR' } }),
      this.prisma.audiences.count({ where: { statut: 'RENSEIGNEE' } }),
      this.prisma.audiences.count({ where: { statut: 'PASSEE_NON_RENSEIGNEE' } }),
    ]);

    return {
      total,
      aVenir,
      tenues,
      nonRenseignees,
    };
  }
}