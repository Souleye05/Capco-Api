import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { AudienceResponseDto } from './dto/audience-response.dto';
import { AudiencesQueryDto } from './dto/audiences-query.dto';
import { CreateResultatAudienceDto } from './dto/create-resultat-audience.dto';
import { UpdateResultatAudienceDto } from './dto/update-resultat-audience.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { WorkingDayUtils } from '../../common/decorators/is-working-day.decorator';
import { createDateFilter } from '../../common/utils/date.utils';

@Injectable()
export class AudiencesService {
  private readonly logger = new Logger(AudiencesService.name);

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

    // Vérification du week-end avec blocage
    const audienceDate = new Date(createAudienceDto.date);
    if (WorkingDayUtils.isWeekend(audienceDate)) {
      const dayName = WorkingDayUtils.getDayName(audienceDate);
      throw new BadRequestException(
        `Impossible de programmer une audience un ${dayName}. ` +
        `Les tribunaux sont fermés le week-end. Veuillez choisir un jour ouvrable.`
      );
    }

    // Calculer la date de rappel d'enrôlement (4 jours ouvrables avant)
    const dateRappelEnrolement = this.calculateRappelDate(audienceDate);

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
      whereClause.date = createDateFilter(query.dateDebut, query.dateFin);
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
    const existingAudience = await this.findOne(id);

    // Si la date est modifiée, appliquer les mêmes validations que lors de la création
    let dateRappelEnrolement: Date | undefined;
    let statutAudience = updateAudienceDto.statut;
    
    if (updateAudienceDto.date) {
      const newAudienceDate = new Date(updateAudienceDto.date);
      
      // Vérification du week-end avec blocage
      if (WorkingDayUtils.isWeekend(newAudienceDate)) {
        const dayName = WorkingDayUtils.getDayName(newAudienceDate);
        throw new BadRequestException(
          `Impossible de programmer une audience un ${dayName}. ` +
          `Les tribunaux sont fermés le week-end. Veuillez choisir un jour ouvrable.`
        );
      }

      // Recalculer la date de rappel
      dateRappelEnrolement = this.calculateRappelDate(newAudienceDate);

      // Déterminer le statut automatiquement selon la nouvelle date si pas explicitement défini
      if (!statutAudience) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const audienceDateOnly = new Date(newAudienceDate);
        audienceDateOnly.setHours(0, 0, 0, 0);
        
        if (audienceDateOnly < now) {
          statutAudience = 'PASSEE_NON_RENSEIGNEE';
          this.logger.warn(
            `Audience mise à jour avec une date passée pour l'audience ${id}. ` +
            `Date: ${newAudienceDate.toLocaleDateString('fr-FR')}. ` +
            `Statut automatiquement défini sur "PASSEE_NON_RENSEIGNEE".`
          );
        } else if (existingAudience.statut === 'PASSEE_NON_RENSEIGNEE') {
          // Si l'audience était passée mais maintenant la date est future, remettre à A_VENIR
          statutAudience = 'A_VENIR';
        }
      }
    }

    const updateData: any = {
      ...updateAudienceDto,
      updated_at: new Date(),
    };

    // Ajouter les champs calculés seulement s'ils sont définis
    if (dateRappelEnrolement !== undefined) {
      updateData.date_rappel_enrolement = dateRappelEnrolement;
    }
    if (statutAudience !== undefined) {
      updateData.statut = statutAudience;
    }

    const audience = await this.prisma.audiences.update({
      where: { id },
      data: updateData,
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
        nouvelleDate: createResultatDto.nouvelleDate ? new Date(createResultatDto.nouvelleDate) : null,
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
   * Récupérer le résultat d'une audience
   */
  async getResultat(audienceId: string) {
    // Vérifier que l'audience existe
    await this.findOne(audienceId);

    const resultat = await this.prisma.resultatsAudiences.findFirst({
      where: { audienceId },
    });

    if (!resultat) {
      throw new NotFoundException('Aucun résultat trouvé pour cette audience');
    }

    return resultat;
  }

  /**
   * Mettre à jour le résultat d'une audience
   */
  async updateResultat(audienceId: string, updateResultatDto: UpdateResultatAudienceDto, userId: string) {
    // Vérifier que l'audience existe
    await this.findOne(audienceId);

    // Vérifier que le résultat existe
    const existingResultat = await this.prisma.resultatsAudiences.findFirst({
      where: { audienceId },
    });

    if (!existingResultat) {
      throw new NotFoundException('Aucun résultat trouvé pour cette audience');
    }

    const resultat = await this.prisma.resultatsAudiences.update({
      where: { id: existingResultat.id },
      data: {
        type: updateResultatDto.type,
        nouvelleDate: updateResultatDto.nouvelleDate ? new Date(updateResultatDto.nouvelleDate) : undefined,
        motifRenvoi: updateResultatDto.motifRenvoi,
        motifRadiation: updateResultatDto.motifRadiation,
        texteDelibere: updateResultatDto.texteDelibere,
        // Note: createdBy reste inchangé, on ne met pas à jour le créateur
      },
    });

    return resultat;
  }

  /**
   * Supprimer le résultat d'une audience
   */
  async removeResultat(audienceId: string) {
    // Vérifier que l'audience existe
    await this.findOne(audienceId);

    // Vérifier que le résultat existe
    const existingResultat = await this.prisma.resultatsAudiences.findFirst({
      where: { audienceId },
    });

    if (!existingResultat) {
      throw new NotFoundException('Aucun résultat trouvé pour cette audience');
    }

    await this.prisma.resultatsAudiences.delete({
      where: { id: existingResultat.id },
    });

    // Remettre le statut de l'audience à "PASSEE_NON_RENSEIGNEE" si la date est passée
    const audience = await this.prisma.audiences.findUnique({
      where: { id: audienceId },
    });

    if (audience && new Date(audience.date) < new Date()) {
      await this.prisma.audiences.update({
        where: { id: audienceId },
        data: { statut: 'PASSEE_NON_RENSEIGNEE' },
      });
    }
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

    /**
     * Parse une date du DTO frontend vers UTC midi
     * Format attendu: "YYYY-MM-DD" (ex: "2026-02-01")
     * Stockage: UTC à 12:00 pour éviter les décalages timezone
     *
     * @param dateInput - Format "YYYY-MM-DD" ou Date object
     * @returns Date en UTC à 12:00:00
     * @throws BadRequestException si format invalide
     *
     * @example
     * parseDateFromDTO("2026-02-01") // → Date("2026-02-01T12:00:00.000Z")
     */
    private parseDateFromDTO(dateInput: string | Date): Date {
      if (dateInput instanceof Date) {
        return dateInput;
      }

      // Si format YYYY-MM-DD (date calendrier utilisateur)
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);

        // Validation basique
        if (month < 1 || month > 12 || day < 1 || day > 31) {
          throw new BadRequestException('Format de date invalide');
        }

        // ✅ CRITIQUE: Créer en UTC à midi (12:00)
        // Cela garantit que tous les timezones (-12 à +14) voient le bon jour
        const result = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        // Validation de la date réelle (attrape "31 février", etc.)
        if (result.getUTCFullYear() !== year ||
            result.getUTCMonth() !== month - 1 ||
            result.getUTCDate() !== day) {
          throw new BadRequestException('Date invalide (ex: 31 février)');
        }

        // Log utile pour debug production
        this.logger.debug(`[UTC] parseDateFromDTO: ${dateInput} → ${result.toISOString()}`);
        return result;
      }

      // Fallback pour format ISO complet
      return new Date(dateInput);
    }
}