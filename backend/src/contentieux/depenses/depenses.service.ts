import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { UpdateDepenseDto } from './dto/update-depense.dto';
import { DepenseResponseDto } from './dto/depense-response.dto';
import { DepensesQueryDto } from './dto/depenses-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class DepensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Créer une nouvelle dépense
   */
  async create(createDepenseDto: CreateDepenseDto, userId: string): Promise<DepenseResponseDto> {
    // Vérifier que l'affaire existe
    const affaire = await this.prisma.affaires.findUnique({
      where: { id: createDepenseDto.affaireId },
    });

    if (!affaire) {
      throw new NotFoundException(`Affaire avec l'ID ${createDepenseDto.affaireId} non trouvée`);
    }

    const depense = await this.prisma.depensesAffaires.create({
      data: {
        affaireId: createDepenseDto.affaireId,
        date: createDepenseDto.date,
        typeDepense: createDepenseDto.typeDepense,
        nature: createDepenseDto.nature,
        montant: createDepenseDto.montant,
        description: createDepenseDto.description,
        justificatif: createDepenseDto.justificatif,
        createdBy: userId,
      },
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
      },
    });

    return this.mapToResponseDto(depense);
  }

  /**
   * Récupérer toutes les dépenses avec pagination et recherche
   */
  async findAll(query: DepensesQueryDto): Promise<PaginatedResponse<DepenseResponseDto>> {
    const whereClause: any = {};

    // Filtres
    if (query.affaireId) whereClause.affaireId = query.affaireId;
    if (query.typeDepense) whereClause.typeDepense = query.typeDepense;
    
    // Filtre par période
    if (query.dateDebut || query.dateFin) {
      whereClause.date = {};
      if (query.dateDebut) whereClause.date.gte = query.dateDebut;
      if (query.dateFin) whereClause.date.lte = query.dateFin;
    }

    // Filtre par montant
    if (query.montantMin || query.montantMax) {
      whereClause.montant = {};
      if (query.montantMin) whereClause.montant.gte = query.montantMin;
      if (query.montantMax) whereClause.montant.lte = query.montantMax;
    }

    const result = await this.paginationService.paginate(
      this.prisma.depensesAffaires,
      query,
      {
        where: whereClause,
        include: {
          affaires: {
            include: {
              parties_affaires: true,
            },
          },
        },
        searchFields: ['nature', 'description', 'typeDepense', 'affaires.reference', 'affaires.intitule'],
        defaultSortBy: 'date',
      }
    );

    return {
      data: result.data.map(depense => this.mapToResponseDto(depense)),
      pagination: result.pagination,
    };
  }

  /**
   * Récupérer une dépense par ID
   */
  async findOne(id: string): Promise<DepenseResponseDto> {
    const depense = await this.prisma.depensesAffaires.findUnique({
      where: { id },
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
      },
    });

    if (!depense) {
      throw new NotFoundException(`Dépense avec l'ID ${id} non trouvée`);
    }

    return this.mapToResponseDto(depense);
  }

  /**
   * Mettre à jour une dépense
   */
  async update(id: string, updateDepenseDto: UpdateDepenseDto): Promise<DepenseResponseDto> {
    // Vérifier que la dépense existe
    await this.findOne(id);

    const depense = await this.prisma.depensesAffaires.update({
      where: { id },
      data: updateDepenseDto,
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
      },
    });

    return this.mapToResponseDto(depense);
  }

  /**
   * Supprimer une dépense
   */
  async remove(id: string): Promise<void> {
    // Vérifier que la dépense existe
    await this.findOne(id);

    await this.prisma.depensesAffaires.delete({
      where: { id },
    });
  }

  /**
   * Récupérer les dépenses par affaire
   */
  async findByAffaire(affaireId: string): Promise<DepenseResponseDto[]> {
    const depenses = await this.prisma.depensesAffaires.findMany({
      where: { affaireId },
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return depenses.map(depense => this.mapToResponseDto(depense));
  }

  /**
   * Récupérer les dépenses par type
   */
  async findByType(typeDepense: string): Promise<DepenseResponseDto[]> {
    const depenses = await this.prisma.depensesAffaires.findMany({
      where: { typeDepense },
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return depenses.map(depense => this.mapToResponseDto(depense));
  }

  /**
   * Mapper une dépense vers le DTO de réponse
   */
  private mapToResponseDto(depense: any): DepenseResponseDto {
    return {
      id: depense.id,
      affaireId: depense.affaireId,
      affaire: {
        id: depense.affaires.id,
        reference: depense.affaires.reference,
        intitule: depense.affaires.intitule,
        parties: depense.affaires.parties_affaires?.map(partie => ({
          id: partie.id,
          nom: partie.nom,
          role: partie.role,
        })) || [],
      },
      date: depense.date,
      typeDepense: depense.typeDepense,
      nature: depense.nature,
      montant: Number(depense.montant),
      description: depense.description,
      justificatif: depense.justificatif,
      createdAt: depense.createdAt,
    };
  }

  /**
   * Obtenir les statistiques des dépenses
   */
  async getStatistics() {
    const result = await this.prisma.depensesAffaires.aggregate({
      _sum: {
        montant: true,
      },
      _count: true,
    });

    // Statistiques par type
    const parType = await this.prisma.depensesAffaires.groupBy({
      by: ['typeDepense'],
      _sum: {
        montant: true,
      },
      _count: true,
    });

    return {
      totalMontant: Number(result._sum.montant) || 0,
      nombreDepenses: result._count,
      parType: parType.map(item => ({
        type: item.typeDepense,
        montant: Number(item._sum.montant) || 0,
        nombre: item._count,
      })),
    };
  }

  /**
   * Obtenir le rapport des dépenses par période
   */
  async getRapportPeriode(dateDebut: Date, dateFin: Date) {
    const depenses = await this.prisma.depensesAffaires.findMany({
      where: {
        date: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      include: {
        affaires: {
          include: {
            parties_affaires: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalMontant = depenses.reduce((sum, depense) => sum + Number(depense.montant), 0);

    // Grouper par type
    const parType = depenses.reduce((acc, depense) => {
      const type = depense.typeDepense;
      if (!acc[type]) {
        acc[type] = { montant: 0, nombre: 0 };
      }
      acc[type].montant += Number(depense.montant);
      acc[type].nombre += 1;
      return acc;
    }, {} as Record<string, { montant: number; nombre: number }>);

    return {
      periode: { dateDebut, dateFin },
      totalMontant,
      nombreDepenses: depenses.length,
      parType: Object.entries(parType).map(([type, stats]) => ({
        type,
        ...stats,
      })),
      depenses: depenses.map(depense => this.mapToResponseDto(depense)),
    };
  }
}