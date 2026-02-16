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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../common/services/prisma.service';

/**
 * Contrôleur spécialisé pour la gestion des dossiers de recouvrement
 */
@Controller('dossiers-recouvrement')
@UseGuards(JwtAuthGuard)
export class DossiersRecouvrementController {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer tous les dossiers de recouvrement avec pagination et filtres
   */
  @Get()
  async getDossiers(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('statut') statut?: string,
    @Query('creancier') creancier?: string,
    @Query('debiteur') debiteur?: string,
    @Query('search') search?: string
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Construire les filtres
    const where: any = {};
    
    if (statut) {
      where.statut = statut;
    }
    
    if (creancier) {
      where.creancierNom = { contains: creancier, mode: 'insensitive' };
    }
    
    if (debiteur) {
      where.debiteurNom = { contains: debiteur, mode: 'insensitive' };
    }
    
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { creancierNom: { contains: search, mode: 'insensitive' } },
        { debiteurNom: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const [dossiers, total] = await Promise.all([
        this.prisma.dossiersRecouvrement.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          include: {
            actionsRecouvrements: {
              orderBy: { date: 'desc' },
              take: 1, // Dernière action
              select: {
                id: true,
                date: true,
                typeAction: true,
                resume: true,
                prochaineEtape: true,
                echeanceProchaineEtape: true
              }
            },
            paiementsRecouvrements: {
              select: {
                montant: true
              }
            },
            honorairesRecouvrements: {
              select: {
                montantPrevu: true,
                montantPaye: true
              }
            },
            _count: {
              select: {
                actionsRecouvrements: true,
                paiementsRecouvrements: true,
                depensesDossiers: true
              }
            }
          }
        }),
        this.prisma.dossiersRecouvrement.count({ where })
      ]);

      return {
        data: dossiers.map(dossier => ({
          id: dossier.id,
          reference: dossier.reference,
          creancier_nom: dossier.creancierNom,
          creancier_telephone: dossier.creancierTelephone,
          creancier_email: dossier.creancierEmail,
          debiteur_nom: dossier.debiteurNom,
          debiteur_telephone: dossier.debiteurTelephone,
          debiteur_email: dossier.debiteurEmail,
          debiteur_adresse: dossier.debiteurAdresse,
          montant_principal: Number(dossier.montantPrincipal),
          penalites_interets: Number(dossier.penalitesInterets || 0),
          total_a_recouvrer: Number(dossier.totalARecouvrer),
          statut: dossier.statut,
          notes: dossier.notes,
          created_at: dossier.createdAt,
          updated_at: dossier.updatedAt,
          created_by: dossier.createdBy,
          // Informations dérivées
          derniere_action: dossier.actionsRecouvrements[0] || null,
          nombre_actions: dossier._count.actionsRecouvrements,
          nombre_paiements: dossier._count.paiementsRecouvrements,
          nombre_depenses: dossier._count.depensesDossiers,
          total_paiements: dossier.paiementsRecouvrements.reduce(
            (sum, p) => sum + Number(p.montant), 0
          ),
          total_honoraires_prevus: dossier.honorairesRecouvrements.reduce(
            (sum, h) => sum + Number(h.montantPrevu), 0
          ),
          total_honoraires_payes: dossier.honorairesRecouvrements.reduce(
            (sum, h) => sum + Number(h.montantPaye), 0
          ),
          // Calcul du solde restant
          solde_restant: Number(dossier.totalARecouvrer) - dossier.paiementsRecouvrements.reduce(
            (sum, p) => sum + Number(p.montant), 0
          )
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        filters: {
          statut,
          creancier,
          debiteur,
          search
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des dossiers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupérer un dossier par ID avec historique complet
   */
  @Get(':id')
  async getDossier(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    try {
      const dossier = await this.prisma.dossiersRecouvrement.findUnique({
        where: { id },
        include: {
          creancier: true,
          debiteur: true,
          actionsRecouvrements: {
            orderBy: { date: 'desc' }
          },
          paiementsRecouvrements: {
            orderBy: { date: 'desc' }
          },
          honorairesRecouvrements: {
            orderBy: { createdAt: 'desc' }
          },
          depensesDossiers: {
            orderBy: { date: 'desc' }
          },
          locatairesDossiersRecouvrements: {
            include: {
              locataires: true
            }
          }
        }
      });

      if (!dossier) {
        throw new HttpException(
          `Dossier avec l'ID ${id} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        data: {
          ...dossier,
          // Calculs dérivés
          total_paiements: dossier.paiementsRecouvrements.reduce(
            (sum, p) => sum + Number(p.montant), 0
          ),
          total_depenses: dossier.depensesDossiers.reduce(
            (sum, d) => sum + Number(d.montant), 0
          ),
          total_honoraires_prevus: dossier.honorairesRecouvrements.reduce(
            (sum, h) => sum + Number(h.montantPrevu), 0
          ),
          total_honoraires_payes: dossier.honorairesRecouvrements.reduce(
            (sum, h) => sum + Number(h.montantPaye), 0
          ),
          solde_restant: Number(dossier.totalARecouvrer) - dossier.paiementsRecouvrements.reduce(
            (sum, p) => sum + Number(p.montant), 0
          ),
          taux_recouvrement: Number(dossier.totalARecouvrer) > 0 
            ? (dossier.paiementsRecouvrements.reduce((sum, p) => sum + Number(p.montant), 0) / Number(dossier.totalARecouvrer)) * 100
            : 0,
          prochaine_echeance: dossier.actionsRecouvrements.find(a => 
            a.echeanceProchaineEtape && a.echeanceProchaineEtape > new Date()
          )?.echeanceProchaineEtape || null
        }
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la récupération du dossier: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Créer un nouveau dossier de recouvrement
   */
  @Post()
  async createDossier(
    @CurrentUser() user: any,
    @Body() createDto: {
      reference: string;
      creancierNom: string;
      creancierTelephone?: string;
      creancierEmail?: string;
      debiteurNom: string;
      debiteurTelephone?: string;
      debiteurEmail?: string;
      debiteurAdresse?: string;
      montantPrincipal: number;
      penalitesInterets?: number;
      notes?: string;
    }
  ) {
    // Validation
    if (!createDto.reference || !createDto.creancierNom || !createDto.debiteurNom || !createDto.montantPrincipal) {
      throw new HttpException(
        'Les champs reference, creancierNom, debiteurNom et montantPrincipal sont obligatoires',
        HttpStatus.BAD_REQUEST
      );
    }

    if (createDto.montantPrincipal <= 0) {
      throw new HttpException(
        'Le montant principal doit être supérieur à 0',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      // Vérifier l'unicité de la référence
      const existingDossier = await this.prisma.dossiersRecouvrement.findFirst({
        where: { reference: createDto.reference.trim() }
      });

      if (existingDossier) {
        throw new HttpException(
          `Un dossier avec la référence ${createDto.reference} existe déjà`,
          HttpStatus.CONFLICT
        );
      }

      const penalitesInterets = createDto.penalitesInterets || 0;
      const totalARecouvrer = createDto.montantPrincipal + penalitesInterets;

      const dossier = await this.prisma.dossiersRecouvrement.create({
        data: {
          reference: createDto.reference.trim(),
          creancierNom: createDto.creancierNom.trim(),
          creancierTelephone: createDto.creancierTelephone?.trim() || null,
          creancierEmail: createDto.creancierEmail?.trim() || null,
          debiteurNom: createDto.debiteurNom.trim(),
          debiteurTelephone: createDto.debiteurTelephone?.trim() || null,
          debiteurEmail: createDto.debiteurEmail?.trim() || null,
          debiteurAdresse: createDto.debiteurAdresse?.trim() || null,
          montantPrincipal: createDto.montantPrincipal,
          penalitesInterets: penalitesInterets,
          totalARecouvrer: totalARecouvrer,
          statut: 'EN_COURS',
          notes: createDto.notes?.trim() || null,
          createdBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        data: dossier,
        message: 'Dossier de recouvrement créé avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la création du dossier: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Ajouter une action de recouvrement à un dossier
   */
  @Post(':id/actions')
  async addAction(
    @CurrentUser() user: any,
    @Param('id') dossierId: string,
    @Body() actionDto: {
      date: string;
      typeAction: string;
      resume: string;
      prochaineEtape?: string;
      echeanceProchaineEtape?: string;
      pieceJointe?: string;
    }
  ) {
    try {
      // Vérifier que le dossier existe
      const dossier = await this.prisma.dossiersRecouvrement.findUnique({
        where: { id: dossierId }
      });

      if (!dossier) {
        throw new HttpException(
          `Dossier avec l'ID ${dossierId} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      const action = await this.prisma.actionsRecouvrement.create({
        data: {
          dossierId,
          date: new Date(actionDto.date),
          typeAction: actionDto.typeAction as any,
          resume: actionDto.resume.trim(),
          prochaineEtape: actionDto.prochaineEtape?.trim() || null,
          echeanceProchaineEtape: actionDto.echeanceProchaineEtape 
            ? new Date(actionDto.echeanceProchaineEtape) 
            : null,
          pieceJointe: actionDto.pieceJointe?.trim() || null,
          createdBy: user.id,
          createdAt: new Date()
        }
      });

      // Mettre à jour la date de modification du dossier
      await this.prisma.dossiersRecouvrement.update({
        where: { id: dossierId },
        data: { updatedAt: new Date() }
      });

      return {
        data: action,
        message: 'Action ajoutée avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de l'ajout de l'action: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Ajouter un paiement à un dossier
   */
  @Post(':id/paiements')
  async addPaiement(
    @CurrentUser() user: any,
    @Param('id') dossierId: string,
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
      // Vérifier que le dossier existe
      const dossier = await this.prisma.dossiersRecouvrement.findUnique({
        where: { id: dossierId },
        include: {
          paiementsRecouvrements: true
        }
      });

      if (!dossier) {
        throw new HttpException(
          `Dossier avec l'ID ${dossierId} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      // Vérifier que le paiement ne dépasse pas le solde restant
      const totalPaiements = dossier.paiementsRecouvrements.reduce(
        (sum, p) => sum + Number(p.montant), 0
      );
      const soldeRestant = Number(dossier.totalARecouvrer) - totalPaiements;

      if (paiementDto.montant > soldeRestant) {
        throw new HttpException(
          `Le montant du paiement (${paiementDto.montant}) dépasse le solde restant (${soldeRestant})`,
          HttpStatus.BAD_REQUEST
        );
      }

      const paiement = await this.prisma.paiementsRecouvrement.create({
        data: {
          dossierId,
          date: new Date(paiementDto.date),
          montant: paiementDto.montant,
          mode: paiementDto.mode as any,
          reference: paiementDto.reference?.trim() || null,
          commentaire: paiementDto.commentaire?.trim() || null,
          createdBy: user.id,
          createdAt: new Date()
        }
      });

      // Vérifier si le dossier est entièrement payé
      const nouveauTotalPaiements = totalPaiements + paiementDto.montant;
      const nouveauStatut = nouveauTotalPaiements >= Number(dossier.totalARecouvrer) 
        ? 'CLOTURE' 
        : 'EN_COURS';

      // Mettre à jour le dossier
      await this.prisma.dossiersRecouvrement.update({
        where: { id: dossierId },
        data: { 
          statut: nouveauStatut,
          updatedAt: new Date() 
        }
      });

      return {
        data: paiement,
        message: nouveauStatut === 'CLOTURE' 
          ? 'Paiement ajouté avec succès. Dossier clôturé.' 
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
   * Récupérer les statistiques des dossiers de recouvrement
   */
  @Get('stats/overview')
  async getRecouvrementStats(@CurrentUser() user: any) {
    try {
      const [
        totalDossiers,
        dossiersEnCours,
        dossiersCloturs,
        totalMontantPrincipal,
        totalPaiements,
        totalHonoraires
      ] = await Promise.all([
        this.prisma.dossiersRecouvrement.count(),
        this.prisma.dossiersRecouvrement.count({ where: { statut: 'EN_COURS' } }),
        this.prisma.dossiersRecouvrement.count({ where: { statut: 'CLOTURE' } }),
        this.prisma.dossiersRecouvrement.aggregate({
          _sum: { montantPrincipal: true, totalARecouvrer: true }
        }),
        this.prisma.paiementsRecouvrement.aggregate({
          _sum: { montant: true }
        }),
        this.prisma.honorairesRecouvrement.aggregate({
          _sum: { montantPrevu: true, montantPaye: true }
        })
      ]);

      const montantPrincipal = Number(totalMontantPrincipal._sum.montantPrincipal || 0);
      const montantARecouvrer = Number(totalMontantPrincipal._sum.totalARecouvrer || 0);
      const montantPaiements = Number(totalPaiements._sum.montant || 0);

      return {
        data: {
          total_dossiers: totalDossiers,
          dossiers_en_cours: dossiersEnCours,
          dossiers_clotures: dossiersCloturs,
          montant_principal_total: montantPrincipal,
          montant_a_recouvrer_total: montantARecouvrer,
          montant_paiements_total: montantPaiements,
          solde_restant_total: montantARecouvrer - montantPaiements,
          taux_recouvrement_global: montantARecouvrer > 0 
            ? (montantPaiements / montantARecouvrer) * 100 
            : 0,
          honoraires_prevus_total: Number(totalHonoraires._sum.montantPrevu || 0),
          honoraires_payes_total: Number(totalHonoraires._sum.montantPaye || 0)
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}