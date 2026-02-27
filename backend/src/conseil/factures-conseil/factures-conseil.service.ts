import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { PaginationService } from '../../common/services/pagination.service';
import { 
  CreateFactureConseilDto, 
  UpdateFactureConseilDto, 
  FactureConseilResponseDto,
  FacturesConseilQueryDto,
  StatutFacture
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class FacturesConseilService {
  private readonly logger = new Logger(FacturesConseilService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceGenerator: ReferenceGeneratorService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Créer une nouvelle facture conseil avec génération automatique de référence
   */
  async create(createFactureConseilDto: CreateFactureConseilDto, userId: string): Promise<FactureConseilResponseDto> {
    try {
      // Vérifier que le client conseil existe et est actif
      const client = await this.prisma.clientsConseil.findUnique({
        where: { id: createFactureConseilDto.clientId },
        select: { id: true, statut: true, nom: true },
      });

      if (!client) {
        throw new NotFoundException(`Client conseil avec l'ID ${createFactureConseilDto.clientId} non trouvé`);
      }

      if (client.statut !== 'ACTIF') {
        throw new BadRequestException('Impossible de créer une facture pour un client non actif');
      }

      // Valider le format du mois concerné
      if (!this.isValidMonthFormat(createFactureConseilDto.moisConcerne)) {
        throw new BadRequestException('Le mois concerné doit être au format YYYY-MM');
      }

      // Vérifier qu'il n'existe pas déjà une facture pour ce client et ce mois
      const existingFacture = await this.prisma.facturesConseil.findFirst({
        where: {
          clientId: createFactureConseilDto.clientId,
          moisConcerne: createFactureConseilDto.moisConcerne,
        },
      });

      if (existingFacture) {
        throw new BadRequestException(`Une facture existe déjà pour ce client pour le mois ${createFactureConseilDto.moisConcerne}`);
      }

      // Générer une référence unique
      const reference = await this.referenceGenerator.generateFactureReference(createFactureConseilDto.clientId);

      // Calculer automatiquement la TVA si non fournie (18% au Sénégal)
      const tva = createFactureConseilDto.tva ?? (createFactureConseilDto.montantHt * 0.18);
      const montantTtcCalcule = createFactureConseilDto.montantHt + tva;

      // Vérifier la cohérence des montants
      if (Math.abs(montantTtcCalcule - createFactureConseilDto.montantTtc) > 0.01) {
        throw new BadRequestException('Les montants HT, TVA et TTC ne sont pas cohérents');
      }

      const factureConseil = await this.prisma.facturesConseil.create({
        data: {
          ...createFactureConseilDto,
          reference,
          tva,
          dateEmission: new Date(createFactureConseilDto.dateEmission),
          dateEcheance: new Date(createFactureConseilDto.dateEcheance),
          createdBy: userId,
        },
        include: {
          clientsConseil: {
            select: {
              id: true,
              reference: true,
              nom: true,
            },
          },
          _count: {
            select: {
              paiementsConseils: true,
            },
          },
        },
      });

      this.logger.log(`Facture conseil créée avec succès: ${reference} pour le client ${client.nom}`);
      return this.mapToResponseDto(factureConseil);
    } catch (error) {
      this.logger.error('Erreur lors de la création de la facture conseil:', error);
      throw error;
    }
  }

  /**
   * Générer automatiquement une facture mensuelle pour un client
   */
  async generateMonthlyBill(clientId: string, moisConcerne: string, userId: string): Promise<FactureConseilResponseDto> {
    try {
      // Récupérer les informations du client
      const client = await this.prisma.clientsConseil.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client conseil avec l'ID ${clientId} non trouvé`);
      }

      if (client.statut !== 'ACTIF') {
        throw new BadRequestException('Impossible de générer une facture pour un client non actif');
      }

      // Calculer les montants basés sur l'honoraire mensuel
      const montantHt = Number(client.honoraireMensuel);
      const tva = montantHt * 0.18; // 18% de TVA
      const montantTtc = montantHt + tva;

      // Calculer les dates d'émission et d'échéance
      const [year, month] = moisConcerne.split('-').map(Number);
      const dateEmission = new Date(year, month - 1, client.jourFacturation);
      const dateEcheance = new Date(dateEmission);
      dateEcheance.setMonth(dateEcheance.getMonth() + 1); // Échéance à 30 jours

      const createDto: CreateFactureConseilDto = {
        clientId,
        moisConcerne,
        montantHt,
        tva,
        montantTtc,
        dateEmission: dateEmission.toISOString().split('T')[0],
        dateEcheance: dateEcheance.toISOString().split('T')[0],
        statut: StatutFacture.BROUILLON,
        notes: `Facture générée automatiquement pour l'honoraire mensuel de ${client.nom}`,
      };

      return this.create(createDto, userId);
    } catch (error) {
      this.logger.error(`Erreur lors de la génération automatique de facture pour le client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les factures conseil avec pagination et filtres
   */
  async findAll(query: FacturesConseilQueryDto): Promise<PaginatedResponse<FactureConseilResponseDto>> {
    try {
      // Construire les conditions de filtrage
      const where: any = {};
      
      if (query.clientId) {
        where.clientId = query.clientId;
      }
      
      if (query.statut) {
        where.statut = query.statut;
      }

      if (query.moisConcerne) {
        where.moisConcerne = query.moisConcerne;
      }

      const result = await this.paginationService.paginate(
        this.prisma.facturesConseil,
        query,
        {
          where,
          include: {
            clientsConseil: {
              select: {
                id: true,
                reference: true,
                nom: true,
              },
            },
            _count: {
              select: {
                paiementsConseils: true,
              },
            },
          },
          searchFields: ['reference', 'clientsConseil.nom', 'clientsConseil.reference'],
          defaultSortBy: 'dateEmission',
        }
      );

      return {
        data: result.data.map(facture => this.mapToResponseDto(facture)),
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des factures conseil:', error);
      throw error;
    }
  }

  /**
   * Récupérer une facture conseil par ID
   */
  async findOne(id: string): Promise<FactureConseilResponseDto> {
    try {
      const factureConseil = await this.prisma.facturesConseil.findUnique({
        where: { id },
        include: {
          clientsConseil: {
            select: {
              id: true,
              reference: true,
              nom: true,
            },
          },
          _count: {
            select: {
              paiementsConseils: true,
            },
          },
        },
      });

      if (!factureConseil) {
        throw new NotFoundException(`Facture conseil avec l'ID ${id} non trouvée`);
      }

      return this.mapToResponseDto(factureConseil);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération de la facture conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour une facture conseil
   */
  async update(id: string, updateFactureConseilDto: UpdateFactureConseilDto): Promise<FactureConseilResponseDto> {
    try {
      // Vérifier que la facture existe
      const existingFacture = await this.findOne(id);

      // Empêcher la modification d'une facture payée
      if (existingFacture.statut === 'PAYEE') {
        throw new BadRequestException('Impossible de modifier une facture déjà payée');
      }

      // Valider le client si fourni
      if (updateFactureConseilDto.clientId) {
        const clientExists = await this.prisma.clientsConseil.findUnique({
          where: { id: updateFactureConseilDto.clientId },
          select: { id: true, statut: true },
        });

        if (!clientExists) {
          throw new NotFoundException(`Client conseil avec l'ID ${updateFactureConseilDto.clientId} non trouvé`);
        }
      }

      // Valider le format du mois concerné si fourni
      if (updateFactureConseilDto.moisConcerne && !this.isValidMonthFormat(updateFactureConseilDto.moisConcerne)) {
        throw new BadRequestException('Le mois concerné doit être au format YYYY-MM');
      }

      const updatedFacture = await this.prisma.facturesConseil.update({
        where: { id },
        data: {
          ...updateFactureConseilDto,
          ...(updateFactureConseilDto.dateEmission && { dateEmission: new Date(updateFactureConseilDto.dateEmission) }),
          ...(updateFactureConseilDto.dateEcheance && { dateEcheance: new Date(updateFactureConseilDto.dateEcheance) }),
        },
        include: {
          clientsConseil: {
            select: {
              id: true,
              reference: true,
              nom: true,
            },
          },
          _count: {
            select: {
              paiementsConseils: true,
            },
          },
        },
      });

      this.logger.log(`Facture conseil ${id} mise à jour avec succès`);
      return this.mapToResponseDto(updatedFacture);
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour de la facture conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer une facture conseil
   */
  async remove(id: string): Promise<void> {
    try {
      // Vérifier que la facture existe et n'est pas payée
      const facture = await this.findOne(id);

      if (facture.statut === 'PAYEE') {
        throw new BadRequestException('Impossible de supprimer une facture déjà payée');
      }

      await this.prisma.facturesConseil.delete({
        where: { id },
      });

      this.logger.log(`Facture conseil ${id} supprimée avec succès`);
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression de la facture conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Marquer une facture comme envoyée
   */
  async markAsSent(id: string): Promise<FactureConseilResponseDto> {
    try {
      const updatedFacture = await this.update(id, { statut: StatutFacture.ENVOYEE });
      this.logger.log(`Facture conseil ${id} marquée comme envoyée`);
      return updatedFacture;
    } catch (error) {
      this.logger.error(`Erreur lors du marquage de la facture ${id} comme envoyée:`, error);
      throw error;
    }
  }

  /**
   * Calculer le montant total payé pour une facture
   */
  async getTotalPaid(factureId: string): Promise<number> {
    try {
      const result = await this.prisma.paiementsConseil.aggregate({
        where: { factureId },
        _sum: { montant: true },
      });

      return Number(result._sum.montant) || 0;
    } catch (error) {
      this.logger.error(`Erreur lors du calcul du montant payé pour la facture ${factureId}:`, error);
      throw error;
    }
  }

  /**
   * Valider le format du mois (YYYY-MM)
   */
  private isValidMonthFormat(mois: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(mois)) return false;

    const [year, month] = mois.split('-').map(Number);
    return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
  }

  /**
   * Mapper les données Prisma vers le DTO de réponse
   */
  private mapToResponseDto(factureConseil: any): FactureConseilResponseDto {
    return {
      id: factureConseil.id,
      clientId: factureConseil.clientId,
      reference: factureConseil.reference,
      moisConcerne: factureConseil.moisConcerne,
      montantHt: Number(factureConseil.montantHt),
      tva: Number(factureConseil.tva),
      montantTtc: Number(factureConseil.montantTtc),
      dateEmission: factureConseil.dateEmission,
      dateEcheance: factureConseil.dateEcheance,
      statut: factureConseil.statut,
      notes: factureConseil.notes,
      createdAt: factureConseil.createdAt,
      createdBy: factureConseil.createdBy,
      clientsConseil: factureConseil.clientsConseil,
      _count: factureConseil._count,
    };
  }
}