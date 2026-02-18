import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateHonoraireDto } from './dto/create-honoraire.dto';
import { UpdateHonoraireDto } from './dto/update-honoraire.dto';
import { HonoraireResponseDto } from './dto/honoraire-response.dto';
import { HonorairesQueryDto } from './dto/honoraires-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class HonorairesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Créer un nouvel honoraire
   */
  async create(createHonoraireDto: CreateHonoraireDto, userId: string): Promise<HonoraireResponseDto> {
    // Vérifier que l'affaire existe
    const affaire = await this.prisma.affaires.findUnique({
      where: { id: createHonoraireDto.affaireId },
    });

    if (!affaire) {
      throw new NotFoundException(`Affaire avec l'ID ${createHonoraireDto.affaireId} non trouvée`);
    }

    const honoraire = await this.prisma.honorairesContentieux.create({
      data: {
        affaireId: createHonoraireDto.affaireId,
        montantFacture: createHonoraireDto.montantFacture,
        montantEncaisse: createHonoraireDto.montantEncaisse || 0,
        dateFacturation: createHonoraireDto.dateFacturation,
        notes: createHonoraireDto.notes,
        createdBy: userId,
      },
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
        paiementsHonorairesContentieuxes: true,
      },
    });

    return this.mapToResponseDto(honoraire);
  }

  /**
   * Récupérer tous les honoraires avec pagination et recherche
   */
  async findAll(query: HonorairesQueryDto): Promise<PaginatedResponse<HonoraireResponseDto>> {
    const whereClause: any = {};

    // Filtres
    if (query.affaireId) whereClause.affaireId = query.affaireId;
    
    // Filtre par période de facturation
    if (query.dateDebutFacturation || query.dateFinFacturation) {
      whereClause.dateFacturation = {};
      if (query.dateDebutFacturation) whereClause.dateFacturation.gte = query.dateDebutFacturation;
      if (query.dateFinFacturation) whereClause.dateFacturation.lte = query.dateFinFacturation;
    }

    const result = await this.paginationService.paginate(
      this.prisma.honorairesContentieux,
      query,
      {
        where: whereClause,
        include: {
          affaires: {
            include: {
              parties_affaires: true,
            },
          },
          paiementsHonorairesContentieuxes: true,
        },
        searchFields: ['notes', 'affaires.reference', 'affaires.intitule'],
        defaultSortBy: 'dateFacturation',
      }
    );

    return {
      data: result.data.map(honoraire => this.mapToResponseDto(honoraire)),
      pagination: result.pagination,
    };
  }

  /**
   * Récupérer un honoraire par ID
   */
  async findOne(id: string): Promise<HonoraireResponseDto> {
    const honoraire = await this.prisma.honorairesContentieux.findUnique({
      where: { id },
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
        paiementsHonorairesContentieuxes: true,
      },
    });

    if (!honoraire) {
      throw new NotFoundException(`Honoraire avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(honoraire);
  }

  /**
   * Mettre à jour un honoraire
   */
  async update(id: string, updateHonoraireDto: UpdateHonoraireDto): Promise<HonoraireResponseDto> {
    // Vérifier que l'honoraire existe
    await this.findOne(id);

    const honoraire = await this.prisma.honorairesContentieux.update({
      where: { id },
      data: updateHonoraireDto,
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
        paiementsHonorairesContentieuxes: true,
      },
    });

    return this.mapToResponseDto(honoraire);
  }

  /**
   * Supprimer un honoraire
   */
  async remove(id: string): Promise<void> {
    // Vérifier que l'honoraire existe
    await this.findOne(id);

    await this.prisma.honorairesContentieux.delete({
      where: { id },
    });
  }

  /**
   * Récupérer les honoraires par affaire
   */
  async findByAffaire(affaireId: string): Promise<HonoraireResponseDto[]> {
    const honoraires = await this.prisma.honorairesContentieux.findMany({
      where: { affaireId },
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
        paiementsHonorairesContentieuxes: true,
      },
      orderBy: { dateFacturation: 'desc' },
    });

    return honoraires.map(honoraire => this.mapToResponseDto(honoraire));
  }

  /**
   * Mapper un honoraire vers le DTO de réponse
   */
  private mapToResponseDto(honoraire: any): HonoraireResponseDto {
    const totalPaiements = honoraire.paiementsHonorairesContentieuxes?.reduce(
      (sum, paiement) => sum + Number(paiement.montant), 0
    ) || 0;

    return {
      id: honoraire.id,
      affaireId: honoraire.affaireId,
      affaire: {
        id: honoraire.affaires.id,
        reference: honoraire.affaires.reference,
        intitule: honoraire.affaires.intitule,
        parties: honoraire.affaires.parties_affaires?.map(partie => ({
          id: partie.id,
          nom: partie.nom,
          role: partie.role,
        })) || [],
      },
      montantFacture: Number(honoraire.montantFacture),
      montantEncaisse: Number(honoraire.montantEncaisse),
      montantRestant: Number(honoraire.montantFacture) - totalPaiements,
      dateFacturation: honoraire.dateFacturation,
      notes: honoraire.notes,
      paiements: honoraire.paiementsHonorairesContentieuxes?.map(paiement => ({
        id: paiement.id,
        date: paiement.date,
        montant: Number(paiement.montant),
        modePaiement: paiement.modePaiement,
        notes: paiement.notes,
      })) || [],
      createdAt: honoraire.createdAt,
    };
  }

  /**
   * Obtenir les statistiques des honoraires
   */
  async getStatistics() {
    const result = await this.prisma.honorairesContentieux.aggregate({
      _sum: {
        montantFacture: true,
        montantEncaisse: true,
      },
      _count: true,
    });

    return {
      totalFacture: Number(result._sum.montantFacture) || 0,
      totalEncaisse: Number(result._sum.montantEncaisse) || 0,
      totalRestant: (Number(result._sum.montantFacture) || 0) - (Number(result._sum.montantEncaisse) || 0),
      nombreHonoraires: result._count,
    };
  }
}