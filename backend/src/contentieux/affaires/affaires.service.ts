import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { CreateAffaireDto } from './dto/create-affaire.dto';
import { UpdateAffaireDto } from './dto/update-affaire.dto';
import { AffaireResponseDto } from './dto/affaire-response.dto';
import { AffairesQueryDto } from './dto/affaires-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AffairesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly referenceGenerator: ReferenceGeneratorService,
  ) { }

  /**
   * Créer une nouvelle affaire avec génération automatique de référence
   */
  async create(createAffaireDto: CreateAffaireDto, userId: string): Promise<AffaireResponseDto> {
    // Vérifier que userId est bien une string
    if (typeof userId !== 'string') {
      console.error('userId is not a string:', userId);
      throw new BadRequestException('Invalid user ID format');
    }

    // Générer une référence unique
    const reference = await this.referenceGenerator.generateAffaireReference();

    // Créer l'affaire avec les parties dans une transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Créer l'affaire
      const affaire = await tx.affaires.create({
        data: {
          reference,
          intitule: createAffaireDto.intitule,
          nature: createAffaireDto.nature || 'CIVILE',
          statut: createAffaireDto.statut || 'ACTIVE',
          observations: createAffaireDto.observations,
          createdBy: userId,
        },
      });

      // Créer les parties
      const parties = [
        ...createAffaireDto.demandeurs.map(partie => ({
          nom: partie.nom,
          role: partie.role || 'DEMANDEUR' as const,
          telephone: partie.telephone,
          adresse: partie.adresse,
          affaire_id: affaire.id,
        })),
        ...createAffaireDto.defendeurs.map(partie => ({
          nom: partie.nom,
          role: partie.role || 'DEFENDEUR' as const,
          telephone: partie.telephone,
          adresse: partie.adresse,
          affaire_id: affaire.id,
        })),
      ];

      if (parties.length > 0) {
        await tx.parties_affaires.createMany({
          data: parties,
        });
      }

      // Créer l'honoraire initial si fourni
      if (createAffaireDto.honoraire) {
        await tx.honorairesContentieux.create({
          data: {
            affaireId: affaire.id,
            montantFacture: createAffaireDto.honoraire.montantFacture,
            montantEncaisse: createAffaireDto.honoraire.montantEncaisse || 0,
            dateFacturation: createAffaireDto.honoraire.dateFacturation
              ? new Date(createAffaireDto.honoraire.dateFacturation)
              : null,
            notes: createAffaireDto.honoraire.notes,
            createdBy: userId,
          },
        });
      }

      return affaire;
    });

    return this.findOne(result.id);
  }

  /**
   * Récupérer toutes les affaires avec pagination et recherche
   */
  async findAll(query: AffairesQueryDto): Promise<PaginatedResponse<AffaireResponseDto>> {
    const result = await this.paginationService.paginate(
      this.prisma.affaires,
      query,
      {
        where: query.statut ? { statut: query.statut } : {},
        include: {
          parties_affaires: true,
          audiences: {
            orderBy: { date: 'desc' },
            take: 1, // Dernière audience
          },
          honorairesContentieuxes: true,
          depensesAffaireses: true,
        },
        searchFields: ['reference', 'intitule', 'observations'],
        defaultSortBy: 'createdAt',
      }
    );

    return {
      data: result.data.map(affaire => this.mapToResponseDto(affaire)),
      pagination: result.pagination,
    };
  }

  /**
   * Récupérer une affaire par ID
   */
  async findOne(id: string): Promise<AffaireResponseDto> {
    const affaire = await this.prisma.affaires.findUnique({
      where: { id },
      include: {
        parties_affaires: true,
        audiences: {
          orderBy: { date: 'desc' },
        },
        honorairesContentieuxes: true,
        depensesAffaireses: true,
      },
    });

    if (!affaire) {
      throw new NotFoundException(`Affaire avec l'ID ${id} non trouvée`);
    }

    return this.mapToResponseDto(affaire);
  }

  /**
   * Récupérer une affaire par référence
   */
  async findByReference(reference: string): Promise<AffaireResponseDto> {
    const affaire = await this.prisma.affaires.findFirst({
      where: { reference },
      include: {
        parties_affaires: true,
        audiences: {
          orderBy: { date: 'desc' },
        },
        honorairesContentieuxes: true,
        depensesAffaireses: true,
      },
    });

    if (!affaire) {
      throw new NotFoundException(`Affaire avec la référence ${reference} non trouvée`);
    }

    return this.mapToResponseDto(affaire);
  }

  /**
   * Mettre à jour une affaire
   */
  async update(id: string, updateAffaireDto: UpdateAffaireDto): Promise<AffaireResponseDto> {
    // Vérifier que l'affaire existe
    await this.findOne(id);

    const result = await this.prisma.$transaction(async (tx) => {
      // Mettre à jour l'affaire
      const affaire = await tx.affaires.update({
        where: { id },
        data: {
          intitule: updateAffaireDto.intitule,
          nature: updateAffaireDto.nature,
          statut: updateAffaireDto.statut,
          observations: updateAffaireDto.observations,
        },
      });

      // Mettre à jour les parties si fournies
      if (updateAffaireDto.demandeurs || updateAffaireDto.defendeurs) {
        // Supprimer les anciennes parties
        await tx.parties_affaires.deleteMany({
          where: { affaire_id: id },
        });

        // Créer les nouvelles parties
        const parties = [
          ...(updateAffaireDto.demandeurs || []).map(partie => ({
            nom: partie.nom,
            role: partie.role || 'DEMANDEUR' as const,
            telephone: partie.telephone,
            adresse: partie.adresse,
            affaire_id: id,
          })),
          ...(updateAffaireDto.defendeurs || []).map(partie => ({
            nom: partie.nom,
            role: partie.role || 'DEFENDEUR' as const,
            telephone: partie.telephone,
            adresse: partie.adresse,
            affaire_id: id,
          })),
        ];

        if (parties.length > 0) {
          await tx.parties_affaires.createMany({
            data: parties,
          });
        }
      }

      return affaire;
    });

    return this.findOne(result.id);
  }

  /**
   * Supprimer une affaire
   */
  async remove(id: string): Promise<void> {
    // Vérifier que l'affaire existe
    await this.findOne(id);

    await this.prisma.affaires.delete({
      where: { id },
    });
  }

  /**
   * Mapper une affaire vers le DTO de réponse
   */
  private mapToResponseDto(affaire: any): AffaireResponseDto {
    return {
      id: affaire.id,
      reference: affaire.reference,
      intitule: affaire.intitule,
      nature: affaire.nature,
      statut: affaire.statut,
      observations: affaire.observations,
      demandeurs: affaire.parties_affaires?.filter(p => p.role === 'DEMANDEUR').map(partie => ({
        nom: partie.nom,
        role: partie.role,
        telephone: partie.telephone,
        adresse: partie.adresse,
      })) || [],
      defendeurs: affaire.parties_affaires?.filter(p => p.role === 'DEFENDEUR').map(partie => ({
        nom: partie.nom,
        role: partie.role,
        telephone: partie.telephone,
        adresse: partie.adresse,
      })) || [],
      derniereAudience: affaire.audiences?.[0] ? {
        id: affaire.audiences[0].id,
        date: affaire.audiences[0].date,
        type: affaire.audiences[0].type,
        juridiction: affaire.audiences[0].juridiction || '',
        chambre: affaire.audiences[0].chambre || '',
        ville: affaire.audiences[0].ville,
        statut: affaire.audiences[0].statut,
      } : null,
      totalHonoraires: affaire.honorairesContentieuxes?.reduce(
        (sum, h) => sum + Number(h.montantFacture), 0
      ) || 0,
      totalDepenses: affaire.depensesAffaireses?.reduce(
        (sum, d) => sum + Number(d.montant), 0
      ) || 0,
      createdAt: affaire.createdAt,
      updatedAt: affaire.updatedAt,
    };
  }

  /**
   * Obtenir les statistiques des affaires
   */
  async getStatistics() {
    const [total, actives, cloturees, radiees] = await Promise.all([
      this.prisma.affaires.count(),
      this.prisma.affaires.count({ where: { statut: 'ACTIVE' } }),
      this.prisma.affaires.count({ where: { statut: 'CLOTUREE' } }),
      this.prisma.affaires.count({ where: { statut: 'RADIEE' } }),
    ]);

    return {
      total,
      actives,
      cloturees,
      radiees,
    };
  }
}