import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { 
  CreatePaiementConseilDto, 
  UpdatePaiementConseilDto, 
  PaiementConseilResponseDto,
  PaiementsConseilQueryDto 
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class PaiementsConseilService {
  private readonly logger = new Logger(PaiementsConseilService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Créer un nouveau paiement conseil avec mise à jour automatique du statut de facture
   */
  async create(createPaiementConseilDto: CreatePaiementConseilDto, userId: string): Promise<PaiementConseilResponseDto> {
    try {
      // Vérifier que la facture existe et récupérer ses informations
      const facture = await this.prisma.facturesConseil.findUnique({
        where: { id: createPaiementConseilDto.factureId },
        select: { 
          id: true, 
          montantTtc: true, 
          statut: true,
          clientsConseil: {
            select: { nom: true }
          }
        },
      });

      if (!facture) {
        throw new NotFoundException(`Facture conseil avec l'ID ${createPaiementConseilDto.factureId} non trouvée`);
      }

      if (facture.statut === 'ANNULEE') {
        throw new BadRequestException('Impossible d\'enregistrer un paiement pour une facture annulée');
      }

      // Calculer le montant déjà payé
      const totalPaye = await this.getTotalPaidForFacture(createPaiementConseilDto.factureId);
      const montantRestant = Number(facture.montantTtc) - totalPaye;

      // Vérifier que le montant du paiement ne dépasse pas le montant restant
      if (createPaiementConseilDto.montant > montantRestant) {
        throw new BadRequestException(
          `Le montant du paiement (${createPaiementConseilDto.montant}) dépasse le montant restant à payer (${montantRestant})`
        );
      }

      // Créer le paiement dans une transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Créer le paiement
        const paiement = await tx.paiementsConseil.create({
          data: {
            ...createPaiementConseilDto,
            date: new Date(createPaiementConseilDto.date),
            createdBy: userId,
          },
          include: {
            facturesConseil: {
              select: {
                id: true,
                reference: true,
                moisConcerne: true,
                montantTtc: true,
                clientsConseil: {
                  select: {
                    id: true,
                    reference: true,
                    nom: true,
                  },
                },
              },
            },
          },
        });

        // Calculer le nouveau total payé
        const nouveauTotalPaye = totalPaye + createPaiementConseilDto.montant;
        const nouveauMontantRestant = Number(facture.montantTtc) - nouveauTotalPaye;

        // Mettre à jour le statut de la facture si nécessaire
        let nouveauStatut = facture.statut;
        if (nouveauMontantRestant <= 0.01) { // Considérer comme payé si reste moins de 1 centime
          nouveauStatut = 'PAYEE';
        } else if (facture.statut === 'BROUILLON') {
          nouveauStatut = 'ENVOYEE'; // Premier paiement partiel
        }

        if (nouveauStatut !== facture.statut) {
          await tx.facturesConseil.update({
            where: { id: createPaiementConseilDto.factureId },
            data: { statut: nouveauStatut },
          });
        }

        return paiement;
      });

      this.logger.log(`Paiement conseil créé avec succès pour la facture ${createPaiementConseilDto.factureId} - Montant: ${createPaiementConseilDto.montant}`);
      return this.mapToResponseDto(result);
    } catch (error) {
      this.logger.error('Erreur lors de la création du paiement conseil:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les paiements conseil avec pagination et filtres
   */
  async findAll(query: PaiementsConseilQueryDto): Promise<PaginatedResponse<PaiementConseilResponseDto>> {
    try {
      // Construire les conditions de filtrage
      const where: any = {};
      
      if (query.factureId) {
        where.factureId = query.factureId;
      }
      
      if (query.mode) {
        where.mode = query.mode;
      }

      const result = await this.paginationService.paginate(
        this.prisma.paiementsConseil,
        query,
        {
          where,
          include: {
            facturesConseil: {
              select: {
                id: true,
                reference: true,
                moisConcerne: true,
                montantTtc: true,
                clientsConseil: {
                  select: {
                    id: true,
                    reference: true,
                    nom: true,
                  },
                },
              },
            },
          },
          searchFields: ['reference', 'facturesConseil.reference', 'facturesConseil.clientsConseil.nom'],
          defaultSortBy: 'date',
        }
      );

      return {
        data: result.data.map(paiement => this.mapToResponseDto(paiement)),
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des paiements conseil:', error);
      throw error;
    }
  }

  /**
   * Récupérer un paiement conseil par ID
   */
  async findOne(id: string): Promise<PaiementConseilResponseDto> {
    try {
      const paiementConseil = await this.prisma.paiementsConseil.findUnique({
        where: { id },
        include: {
          facturesConseil: {
            select: {
              id: true,
              reference: true,
              moisConcerne: true,
              montantTtc: true,
              clientsConseil: {
                select: {
                  id: true,
                  reference: true,
                  nom: true,
                },
              },
            },
          },
        },
      });

      if (!paiementConseil) {
        throw new NotFoundException(`Paiement conseil avec l'ID ${id} non trouvé`);
      }

      return this.mapToResponseDto(paiementConseil);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du paiement conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour un paiement conseil
   */
  async update(id: string, updatePaiementConseilDto: UpdatePaiementConseilDto): Promise<PaiementConseilResponseDto> {
    try {
      // Vérifier que le paiement existe
      const existingPaiement = await this.findOne(id);

      // Valider la facture si fournie
      if (updatePaiementConseilDto.factureId) {
        const factureExists = await this.prisma.facturesConseil.findUnique({
          where: { id: updatePaiementConseilDto.factureId },
          select: { id: true, statut: true },
        });

        if (!factureExists) {
          throw new NotFoundException(`Facture conseil avec l'ID ${updatePaiementConseilDto.factureId} non trouvée`);
        }

        if (factureExists.statut === 'ANNULEE') {
          throw new BadRequestException('Impossible d\'associer un paiement à une facture annulée');
        }
      }

      const updatedPaiement = await this.prisma.paiementsConseil.update({
        where: { id },
        data: {
          ...updatePaiementConseilDto,
          ...(updatePaiementConseilDto.date && { date: new Date(updatePaiementConseilDto.date) }),
        },
        include: {
          facturesConseil: {
            select: {
              id: true,
              reference: true,
              moisConcerne: true,
              montantTtc: true,
              clientsConseil: {
                select: {
                  id: true,
                  reference: true,
                  nom: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Paiement conseil ${id} mis à jour avec succès`);
      return this.mapToResponseDto(updatedPaiement);
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du paiement conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un paiement conseil
   */
  async remove(id: string): Promise<void> {
    try {
      // Vérifier que le paiement existe et récupérer les informations de la facture
      const paiement = await this.findOne(id);

      // Supprimer le paiement et recalculer le statut de la facture dans une transaction
      await this.prisma.$transaction(async (tx) => {
        // Supprimer le paiement
        await tx.paiementsConseil.delete({
          where: { id },
        });

        // Recalculer le total payé pour la facture
        const totalPaye = await this.getTotalPaidForFacture(paiement.factureId);
        
        // Mettre à jour le statut de la facture
        const facture = await tx.facturesConseil.findUnique({
          where: { id: paiement.factureId },
          select: { montantTtc: true, statut: true },
        });

        if (facture) {
          const montantRestant = Number(facture.montantTtc) - totalPaye;
          let nouveauStatut = facture.statut;

          if (totalPaye === 0) {
            nouveauStatut = 'BROUILLON';
          } else if (montantRestant > 0.01) {
            nouveauStatut = 'ENVOYEE';
          }

          if (nouveauStatut !== facture.statut) {
            await tx.facturesConseil.update({
              where: { id: paiement.factureId },
              data: { statut: nouveauStatut },
            });
          }
        }
      });

      this.logger.log(`Paiement conseil ${id} supprimé avec succès`);
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression du paiement conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer tous les paiements d'une facture
   */
  async findByFacture(factureId: string): Promise<PaiementConseilResponseDto[]> {
    try {
      const paiements = await this.prisma.paiementsConseil.findMany({
        where: { factureId },
        include: {
          facturesConseil: {
            select: {
              id: true,
              reference: true,
              moisConcerne: true,
              montantTtc: true,
              clientsConseil: {
                select: {
                  id: true,
                  reference: true,
                  nom: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      return paiements.map(paiement => this.mapToResponseDto(paiement));
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des paiements pour la facture ${factureId}:`, error);
      throw error;
    }
  }

  /**
   * Calculer le montant total payé pour une facture
   */
  async getTotalPaidForFacture(factureId: string): Promise<number> {
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
   * Récupérer les statistiques des paiements par mode
   */
  async getPaymentStatsByMode(): Promise<{
    mode: string;
    count: number;
    totalAmount: number;
  }[]> {
    try {
      const stats = await this.prisma.paiementsConseil.groupBy({
        by: ['mode'],
        _count: { id: true },
        _sum: { montant: true },
      });

      return stats.map(stat => ({
        mode: stat.mode,
        count: stat._count.id,
        totalAmount: Number(stat._sum.montant) || 0,
      }));
    } catch (error) {
      this.logger.error('Erreur lors du calcul des statistiques des paiements par mode:', error);
      throw error;
    }
  }

  /**
   * Mapper les données Prisma vers le DTO de réponse
   */
  private mapToResponseDto(paiementConseil: any): PaiementConseilResponseDto {
    return {
      id: paiementConseil.id,
      factureId: paiementConseil.factureId,
      date: paiementConseil.date,
      montant: Number(paiementConseil.montant),
      mode: paiementConseil.mode,
      reference: paiementConseil.reference,
      commentaire: paiementConseil.commentaire,
      createdAt: paiementConseil.createdAt,
      createdBy: paiementConseil.createdBy,
      facturesConseil: paiementConseil.facturesConseil,
    };
  }
}