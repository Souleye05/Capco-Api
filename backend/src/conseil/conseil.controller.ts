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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/services/prisma.service';

/**
 * Contrôleur spécialisé pour la gestion des clients conseil
 */
@Controller('conseil')
@UseGuards(JwtAuthGuard)
export class ConseilController {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer tous les clients conseil avec leurs données
   */
  @Get('clients')
  async getClientsConseil(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('statut') statut?: string,
    @Query('search') search?: string
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
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const [clients, total] = await Promise.all([
        this.prisma.clientsConseil.findMany({
          where,
          orderBy: { nom: 'asc' },
          skip,
          take: limitNum,
          include: {
            tachesConseils: {
              where: {
                date: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
                }
              }
            },
            facturesConseils: {
              include: {
                paiementsConseils: true
              }
            },
            _count: {
              select: {
                tachesConseils: true,
                facturesConseils: true
              }
            }
          }
        }),
        this.prisma.clientsConseil.count({ where })
      ]);

      return {
        data: clients.map(client => {
          const facturesImpayees = client.facturesConseils.filter(f => 
            f.statut !== 'PAYEE' && f.statut !== 'ANNULEE'
          );
          const totalFacture = client.facturesConseils.reduce((sum, f) => 
            sum + Number(f.montantTtc), 0
          );
          const totalPaiements = client.facturesConseils.reduce((sum, f) => 
            sum + f.paiementsConseils.reduce((pSum, p) => pSum + Number(p.montant), 0), 0
          );
          const heuresTravaillees = client.tachesConseils.reduce((sum, t) => 
            sum + (t.dureeMinutes || 0), 0
          ) / 60;

          return {
            id: client.id,
            reference: client.reference,
            nom: client.nom,
            type: client.type,
            telephone: client.telephone,
            email: client.email,
            adresse: client.adresse,
            honoraire_mensuel: Number(client.honoraireMensuel),
            jour_facturation: client.jourFacturation,
            statut: client.statut,
            notes: client.notes,
            created_at: client.createdAt,
            updated_at: client.updatedAt,
            // Statistiques dérivées
            nombre_taches_12_mois: client.tachesConseils.length,
            heures_travaillees_12_mois: heuresTravaillees,
            nombre_factures_total: client._count.facturesConseils,
            nombre_factures_impayees: facturesImpayees.length,
            montant_factures_total: totalFacture,
            montant_paiements_total: totalPaiements,
            solde_client: totalFacture - totalPaiements,
            derniere_facture: client.facturesConseils.length > 0 
              ? client.facturesConseils.sort((a, b) => 
                  new Date(b.dateEmission).getTime() - new Date(a.dateEmission).getTime()
                )[0]
              : null
          };
        }),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        filters: {
          statut,
          search
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des clients conseil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupérer un client conseil par ID avec historique complet
   */
  @Get('clients/:id')
  async getClientConseil(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    try {
      const client = await this.prisma.clientsConseil.findUnique({
        where: { id },
        include: {
          tachesConseils: {
            orderBy: { date: 'desc' }
          },
          facturesConseils: {
            orderBy: { dateEmission: 'desc' },
            include: {
              paiementsConseils: {
                orderBy: { date: 'desc' }
              }
            }
          }
        }
      });

      if (!client) {
        throw new HttpException(
          `Client conseil avec l'ID ${id} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      // Calculs dérivés
      const totalFacture = client.facturesConseils.reduce((sum, f) => 
        sum + Number(f.montantTtc), 0
      );
      const totalPaiements = client.facturesConseils.reduce((sum, f) => 
        sum + f.paiementsConseils.reduce((pSum, p) => pSum + Number(p.montant), 0), 0
      );
      const heuresTravaillees = client.tachesConseils.reduce((sum, t) => 
        sum + (t.dureeMinutes || 0), 0
      ) / 60;

      return {
        data: {
          ...client,
          // Statistiques calculées
          total_heures_travaillees: heuresTravaillees,
          montant_factures_total: totalFacture,
          montant_paiements_total: totalPaiements,
          solde_client: totalFacture - totalPaiements,
          taux_paiement: totalFacture > 0 ? (totalPaiements / totalFacture) * 100 : 0,
          // Analyse des tâches par type
          repartition_taches: this.analyserTachesParType(client.tachesConseils),
          // Prochaine facturation
          prochaine_facturation: this.calculerProchaineFacturation(client),
          // Factures en retard
          factures_en_retard: client.facturesConseils.filter(f => 
            f.statut !== 'PAYEE' && f.statut !== 'ANNULEE' && 
            new Date(f.dateEcheance) < new Date()
          )
        }
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la récupération du client conseil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Créer un nouveau client conseil
   */
  @Post('clients')
  async createClientConseil(
    @CurrentUser() user: any,
    @Body() createDto: {
      reference: string;
      nom: string;
      type?: string;
      telephone?: string;
      email?: string;
      adresse?: string;
      honoraireMensuel: number;
      jourFacturation?: number;
      notes?: string;
    }
  ) {
    // Validation
    if (!createDto.reference || !createDto.nom || createDto.honoraireMensuel < 0) {
      throw new HttpException(
        'Les champs reference, nom sont obligatoires et honoraireMensuel doit être >= 0',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      // Vérifier l'unicité de la référence
      const existingClient = await this.prisma.clientsConseil.findFirst({
        where: { reference: createDto.reference.trim() }
      });

      if (existingClient) {
        throw new HttpException(
          `Un client avec la référence ${createDto.reference} existe déjà`,
          HttpStatus.CONFLICT
        );
      }

      const client = await this.prisma.clientsConseil.create({
        data: {
          reference: createDto.reference.trim(),
          nom: createDto.nom.trim(),
          type: (createDto.type as any) || 'morale',
          telephone: createDto.telephone?.trim() || null,
          email: createDto.email?.trim() || null,
          adresse: createDto.adresse?.trim() || null,
          honoraireMensuel: createDto.honoraireMensuel,
          jourFacturation: createDto.jourFacturation || 1,
          statut: 'ACTIF',
          notes: createDto.notes?.trim() || null,
          createdBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        data: client,
        message: 'Client conseil créé avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la création du client conseil: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Ajouter une tâche conseil à un client
   */
  @Post('clients/:id/taches')
  async addTacheConseil(
    @CurrentUser() user: any,
    @Param('id') clientId: string,
    @Body() tacheDto: {
      date: string;
      type: string;
      description: string;
      dureeMinutes?: number;
      moisConcerne: string;
    }
  ) {
    try {
      // Vérifier que le client existe
      const client = await this.prisma.clientsConseil.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new HttpException(
          `Client avec l'ID ${clientId} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      const tache = await this.prisma.tachesConseil.create({
        data: {
          clientId,
          date: new Date(tacheDto.date),
          type: tacheDto.type as any,
          description: tacheDto.description.trim(),
          dureeMinutes: tacheDto.dureeMinutes || null,
          moisConcerne: tacheDto.moisConcerne,
          createdBy: user.id,
          createdAt: new Date()
        }
      });

      // Mettre à jour la date de modification du client
      await this.prisma.clientsConseil.update({
        where: { id: clientId },
        data: { updatedAt: new Date() }
      });

      return {
        data: tache,
        message: 'Tâche ajoutée avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de l'ajout de la tâche: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Créer une facture pour un client
   */
  @Post('clients/:id/factures')
  async createFactureConseil(
    @CurrentUser() user: any,
    @Param('id') clientId: string,
    @Body() factureDto: {
      reference: string;
      moisConcerne: string;
      montantHt: number;
      tva?: number;
      dateEmission: string;
      dateEcheance: string;
      notes?: string;
    }
  ) {
    if (factureDto.montantHt <= 0) {
      throw new HttpException(
        'Le montant HT doit être supérieur à 0',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      // Vérifier que le client existe
      const client = await this.prisma.clientsConseil.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new HttpException(
          `Client avec l'ID ${clientId} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      // Vérifier l'unicité de la référence
      const existingFacture = await this.prisma.facturesConseil.findFirst({
        where: { reference: factureDto.reference.trim() }
      });

      if (existingFacture) {
        throw new HttpException(
          `Une facture avec la référence ${factureDto.reference} existe déjà`,
          HttpStatus.CONFLICT
        );
      }

      const tva = factureDto.tva || 0;
      const montantTtc = factureDto.montantHt + (factureDto.montantHt * tva / 100);

      const facture = await this.prisma.facturesConseil.create({
        data: {
          clientId,
          reference: factureDto.reference.trim(),
          moisConcerne: factureDto.moisConcerne,
          montantHt: factureDto.montantHt,
          tva: tva,
          montantTtc: montantTtc,
          dateEmission: new Date(factureDto.dateEmission),
          dateEcheance: new Date(factureDto.dateEcheance),
          statut: 'ENVOYEE',
          notes: factureDto.notes?.trim() || null,
          createdBy: user.id,
          createdAt: new Date()
        }
      });

      return {
        data: facture,
        message: 'Facture créée avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la création de la facture: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Ajouter un paiement à une facture
   */
  @Post('factures/:id/paiements')
  async addPaiementFacture(
    @CurrentUser() user: any,
    @Param('id') factureId: string,
    @Body() paiementDto: {
      date: string;
      montant: number;
      mode: string;
      reference?: string;
      commentaire?: string;
    }
  ) {
    if (paiementDto.montant <= 0) {
      throw new HttpException(
        'Le montant du paiement doit être supérieur à 0',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      // Vérifier que la facture existe
      const facture = await this.prisma.facturesConseil.findUnique({
        where: { id: factureId },
        include: {
          paiementsConseils: true
        }
      });

      if (!facture) {
        throw new HttpException(
          `Facture avec l'ID ${factureId} non trouvée`,
          HttpStatus.NOT_FOUND
        );
      }

      // Vérifier que le paiement ne dépasse pas le solde restant
      const totalPaiements = facture.paiementsConseils.reduce(
        (sum, p) => sum + Number(p.montant), 0
      );
      const soldeRestant = Number(facture.montantTtc) - totalPaiements;

      if (paiementDto.montant > soldeRestant) {
        throw new HttpException(
          `Le montant du paiement (${paiementDto.montant}) dépasse le solde restant (${soldeRestant})`,
          HttpStatus.BAD_REQUEST
        );
      }

      const paiement = await this.prisma.paiementsConseil.create({
        data: {
          factureId,
          date: new Date(paiementDto.date),
          montant: paiementDto.montant,
          mode: paiementDto.mode as any,
          reference: paiementDto.reference?.trim() || null,
          commentaire: paiementDto.commentaire?.trim() || null,
          createdBy: user.id,
          createdAt: new Date()
        }
      });

      // Vérifier si la facture est entièrement payée
      const nouveauTotalPaiements = totalPaiements + paiementDto.montant;
      const nouveauStatut = nouveauTotalPaiements >= Number(facture.montantTtc) 
        ? 'PAYEE' 
        : 'ENVOYEE';

      // Mettre à jour le statut de la facture
      await this.prisma.facturesConseil.update({
        where: { id: factureId },
        data: { statut: nouveauStatut }
      });

      return {
        data: paiement,
        message: nouveauStatut === 'PAYEE' 
          ? 'Paiement ajouté avec succès. Facture soldée.' 
          : 'Paiement ajouté avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de l'ajout du paiement: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Récupérer les statistiques des clients conseil
   */
  @Get('stats/overview')
  async getConseilStats(@CurrentUser() user: any) {
    try {
      const [
        totalClients,
        clientsActifs,
        totalTaches,
        totalFactures,
        facturesImpayees,
        chiffreAffaires,
        paiementsRecus
      ] = await Promise.all([
        this.prisma.clientsConseil.count(),
        this.prisma.clientsConseil.count({ where: { statut: 'ACTIF' } }),
        this.prisma.tachesConseil.count({
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
            }
          }
        }),
        this.prisma.facturesConseil.count(),
        this.prisma.facturesConseil.count({
          where: {
            statut: { in: ['ENVOYEE', 'EN_RETARD'] }
          }
        }),
        this.prisma.facturesConseil.aggregate({
          _sum: { montantTtc: true }
        }),
        this.prisma.paiementsConseil.aggregate({
          _sum: { montant: true }
        })
      ]);

      const chiffreAffairesTotal = Number(chiffreAffaires._sum.montantTtc || 0);
      const paiementsTotal = Number(paiementsRecus._sum.montant || 0);

      return {
        data: {
          total_clients: totalClients,
          clients_actifs: clientsActifs,
          clients_suspendus: totalClients - clientsActifs,
          total_taches_12_mois: totalTaches,
          total_factures: totalFactures,
          factures_impayees: facturesImpayees,
          chiffre_affaires_total: chiffreAffairesTotal,
          paiements_recus_total: paiementsTotal,
          creances_clients: chiffreAffairesTotal - paiementsTotal,
          taux_recouvrement: chiffreAffairesTotal > 0 
            ? (paiementsTotal / chiffreAffairesTotal) * 100 
            : 0
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Analyser les tâches par type
   */
  private analyserTachesParType(taches: any[]) {
    const repartition = taches.reduce((acc, tache) => {
      const type = tache.type;
      if (!acc[type]) {
        acc[type] = {
          nombre: 0,
          duree_totale_minutes: 0
        };
      }
      acc[type].nombre++;
      acc[type].duree_totale_minutes += tache.dureeMinutes || 0;
      return acc;
    }, {});

    return Object.entries(repartition).map(([type, data]: [string, any]) => ({
      type,
      nombre: data.nombre,
      duree_totale_heures: Math.round(data.duree_totale_minutes / 60 * 100) / 100
    }));
  }

  /**
   * Calculer la prochaine date de facturation
   */
  private calculerProchaineFacturation(client: any) {
    const maintenant = new Date();
    const jourFacturation = client.jourFacturation;
    
    let prochaineDate = new Date(maintenant.getFullYear(), maintenant.getMonth(), jourFacturation);
    
    // Si le jour de facturation est déjà passé ce mois-ci, passer au mois suivant
    if (prochaineDate <= maintenant) {
      prochaineDate = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, jourFacturation);
    }
    
    return prochaineDate;
  }
}