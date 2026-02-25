import {
  Controller,
  Get,
  Post,
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
 * Contrôleur API principal pour tester les données migrées
 */

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ApiController {
  constructor(private prisma: PrismaService) { }

  /**
   * Endpoint de test pour vérifier que l'API fonctionne
   */
  @Get('health')
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API NestJS avec données migrées fonctionne correctement'
    };
  }

  /**
   * Récupérer les statistiques générales
   */
  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    try {
      const [
        totalAffaires,
        totalDossiers,
        totalUsers,
        totalUserRoles,
        totalProprietaires,
        totalLocataires,
        totalImmeubles,
        totalLots,
        totalEncaissements,
        totalClientsConseil
      ] = await Promise.all([
        this.prisma.affaires.count(),
        this.prisma.dossiersRecouvrement.count(),
        this.prisma.user.count(),
        this.prisma.userRoles.count(),
        this.prisma.proprietaires.count(),
        this.prisma.locataires.count(),
        this.prisma.immeubles.count(),
        this.prisma.lots.count(),
        this.prisma.encaissementsLoyers.count(),
        this.prisma.clientsConseil.count()
      ]);

      return {
        data: {
          affaires: totalAffaires,
          dossiers_recouvrement: totalDossiers,
          users: totalUsers,
          user_roles: totalUserRoles,
          proprietaires: totalProprietaires,
          locataires: totalLocataires,
          immeubles: totalImmeubles,
          lots: totalLots,
          encaissements_loyers: totalEncaissements,
          clients_conseil: totalClientsConseil
        },
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupérer les affaires avec pagination simple
   */
  @Get('affaires')
  async getAffaires(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    try {
      const [affaires, total] = await Promise.all([
        this.prisma.affaires.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          select: {
            id: true,
            reference: true,
            intitule: true,
            statut: true,
            createdAt: true,
            createdBy: true,
            audiences: {
              orderBy: { date: 'desc' },
              take: 1,
              select: {
                juridiction: true,
                chambre: true,
                ville: true
              }
            }
          }
        }),
        this.prisma.affaires.count()
      ]);

      return {
        data: affaires.map(affaire => ({
          id: affaire.id,
          reference: affaire.reference,
          intitule: affaire.intitule,
          juridiction: affaire.audiences[0]?.juridiction || '',
          chambre: affaire.audiences[0]?.chambre || '',
          statut: affaire.statut,
          created_at: affaire.createdAt,
          created_by: affaire.createdBy
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
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
  @Get('affaires/:id')
  async getAffaire(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    try {
      const affaire = await this.prisma.affaires.findUnique({
        where: { id },
        include: {
          parties_affaires: true,
          audiences: {
            orderBy: { date: 'desc' },
            take: 5
          }
        }
      });

      if (!affaire) {
        throw new HttpException(
          `Affaire avec l'ID ${id} non trouvée`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        data: {
          id: affaire.id,
          reference: affaire.reference,
          intitule: affaire.intitule,
          demandeurs: affaire.parties_affaires
            .filter(p => p.role === 'DEMANDEUR')
            .map(p => ({ nom: p.nom, role: p.role })),
          defendeurs: affaire.parties_affaires
            .filter(p => p.role === 'DEFENDEUR')
            .map(p => ({ nom: p.nom, role: p.role })),
          conseil_adverse: affaire.parties_affaires
            .filter(p => p.role === 'CONSEIL_ADVERSE')
            .map(p => ({ nom: p.nom, role: p.role })),
          juridiction: affaire.audiences[0]?.juridiction || '',
          chambre: affaire.audiences[0]?.chambre || '',
          statut: affaire.statut,
          notes: affaire.notes,
          created_at: affaire.createdAt,
          updated_at: affaire.updatedAt,
          created_by: affaire.createdBy,
          audiences: affaire.audiences.map(audience => ({
            id: audience.id,
            date: audience.date,
            heure: audience.heure,
            type: audience.type,
            statut: audience.statut,
            notes_preparation: audience.notesPreparation,
            created_at: audience.createdAt
          }))
        }
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        `Erreur lors de la récupération de l'affaire: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Créer une nouvelle affaire (test)
   */
  @Post('affaires')
  async createAffaire(
    @Body() createDto: {
      reference: string;
      intitule: string;
      juridiction: string;
      chambre: string;
      demandeurs?: Array<{ nom: string }>;
      defendeurs?: Array<{ nom: string }>;
      notes?: string;
    },
    @CurrentUser() user: any
  ) {
    if (!createDto.reference || !createDto.intitule) {
      throw new HttpException(
        'Les champs reference et intitule sont obligatoires',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const affaire = await this.prisma.affaires.create({
        data: {
          reference: createDto.reference.trim(),
          intitule: createDto.intitule.trim(),
          statut: 'ACTIVE',
          notes: createDto.notes?.trim() || null,
          createdBy: user.id,
        }
      });

      // Créer les parties dans parties_affaires
      const parties = [
        ...(createDto.demandeurs || []).map(p => ({ nom: p.nom, role: 'DEMANDEUR' as const, affaire_id: affaire.id })),
        ...(createDto.defendeurs || []).map(p => ({ nom: p.nom, role: 'DEFENDEUR' as const, affaire_id: affaire.id })),
      ];
      if (parties.length > 0) {
        await this.prisma.parties_affaires.createMany({ data: parties });
      }

      const created = await this.prisma.affaires.findUnique({
        where: { id: affaire.id },
        include: { parties_affaires: true }
      });

      return {
        data: {
          id: created.id,
          reference: created.reference,
          intitule: created.intitule,
          demandeurs: created.parties_affaires
            .filter(p => p.role === 'DEMANDEUR')
            .map(p => ({ nom: p.nom, role: p.role })),
          defendeurs: created.parties_affaires
            .filter(p => p.role === 'DEFENDEUR')
            .map(p => ({ nom: p.nom, role: p.role })),
          statut: created.statut,
          notes: created.notes,
          created_at: created.createdAt,
          updated_at: created.updatedAt,
          created_by: created.createdBy
        },
        message: 'Affaire créée avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la création de l'affaire: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Récupérer les propriétaires avec pagination
   */
  @Get('proprietaires')
  async getProprietaires(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    try {
      const [proprietaires, total] = await Promise.all([
        this.prisma.proprietaires.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          select: {
            id: true,
            nom: true,
            telephone: true,
            email: true,
            adresse: true,
            createdAt: true,
            immeubles: {
              select: {
                id: true
              }
            }
          }
        }),
        this.prisma.proprietaires.count()
      ]);

      return {
        data: proprietaires.map(prop => ({
          id: prop.id,
          nom: prop.nom,
          telephone: prop.telephone,
          email: prop.email,
          adresse: prop.adresse,
          created_at: prop.createdAt,
          nombre_immeubles: prop.immeubles.length
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des propriétaires: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupérer les locataires avec pagination
   */
  @Get('locataires')
  async getLocataires(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    try {
      const [locataires, total] = await Promise.all([
        this.prisma.locataires.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          select: {
            id: true,
            nom: true,
            telephone: true,
            email: true,
            createdAt: true,
            lots: {
              select: {
                id: true
              }
            },
            baux: {
              select: {
                id: true
              }
            }
          }
        }),
        this.prisma.locataires.count()
      ]);

      return {
        data: locataires.map(loc => ({
          id: loc.id,
          nom: loc.nom,
          telephone: loc.telephone,
          email: loc.email,
          created_at: loc.createdAt,
          nombre_lots: loc.lots.length,
          nombre_baux: loc.baux.length
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des locataires: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupérer les immeubles avec pagination
   */
  @Get('immeubles')
  async getImmeubles(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    try {
      const [immeubles, total] = await Promise.all([
        this.prisma.immeubles.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          include: {
            proprietaire: {
              select: {
                nom: true
              }
            },
            lots: {
              select: {
                id: true
              }
            }
          }
        }),
        this.prisma.immeubles.count()
      ]);

      return {
        data: immeubles.map(imm => ({
          id: imm.id,
          nom: imm.nom,
          reference: imm.reference,
          adresse: imm.adresse,
          taux_commission_capco: imm.tauxCommissionCapco,
          proprietaire_nom: imm.proprietaire.nom,
          nombre_lots: imm.lots.length,
          created_at: imm.createdAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des immeubles: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupérer les encaissements de loyers avec pagination
   */
  @Get('encaissements')
  async getEncaissements(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    try {
      const [encaissements, total] = await Promise.all([
        this.prisma.encaissementsLoyers.findMany({
          orderBy: { dateEncaissement: 'desc' },
          skip,
          take: limitNum,
          include: {
            lot: {
              include: {
                immeuble: {
                  select: {
                    nom: true,
                    reference: true
                  }
                }
              }
            }
          }
        }),
        this.prisma.encaissementsLoyers.count()
      ]);

      return {
        data: encaissements.map(enc => ({
          id: enc.id,
          mois_concerne: enc.moisConcerne,
          date_encaissement: enc.dateEncaissement,
          montant_encaisse: enc.montantEncaisse,
          mode_paiement: enc.modePaiement,
          commission_capco: enc.commissionCapco,
          net_proprietaire: enc.netProprietaire,
          lot_numero: enc.lot.numero,
          immeuble_nom: enc.lot.immeuble.nom,
          immeuble_reference: enc.lot.immeuble.reference,
          created_at: enc.createdAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des encaissements: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupérer les dossiers de recouvrement avec pagination
   */
  @Get('dossiers-recouvrement')
  async getDossiersRecouvrement(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    try {
      const [dossiers, total] = await Promise.all([
        this.prisma.dossiersRecouvrement.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          select: {
            id: true,
            reference: true,
            creancierNom: true,
            debiteurNom: true,
            montantPrincipal: true,
            totalARecouvrer: true,
            statut: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        this.prisma.dossiersRecouvrement.count()
      ]);

      return {
        data: dossiers.map(dossier => ({
          id: dossier.id,
          reference: dossier.reference,
          creancier_nom: dossier.creancierNom,
          debiteur_nom: dossier.debiteurNom,
          montant_principal: dossier.montantPrincipal,
          total_a_recouvrer: dossier.totalARecouvrer,
          statut: dossier.statut,
          created_at: dossier.createdAt,
          updated_at: dossier.updatedAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des dossiers de recouvrement: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}