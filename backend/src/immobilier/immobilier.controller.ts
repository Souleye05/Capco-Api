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
 * Contrôleur spécialisé pour la gestion immobilière
 */
@Controller('immobilier')
@UseGuards(JwtAuthGuard)
export class ImmobilierController {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer tous les propriétaires avec leurs immeubles
   */
  @Get('proprietaires')
  async getProprietaires(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { adresse: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const [proprietaires, total] = await Promise.all([
        this.prisma.proprietaires.findMany({
          where,
          orderBy: { nom: 'asc' },
          skip,
          take: limitNum,
          include: {
            immeubleses: {
              include: {
                lotses: {
                  include: {
                    encaissementsLoyerses: {
                      where: {
                        dateEncaissement: {
                          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        this.prisma.proprietaires.count({ where })
      ]);

      return {
        data: proprietaires.map(prop => {
          const totalLots = prop.immeubleses.reduce((sum, imm) => sum + imm.lotses.length, 0);
          const totalEncaissements = prop.immeubleses.reduce((sum, imm) => 
            sum + imm.lotses.reduce((lotSum, lot) => 
              lotSum + lot.encaissementsLoyerses.reduce((encSum, enc) => 
                encSum + Number(enc.montantEncaisse), 0
              ), 0
            ), 0
          );
          const totalCommissions = prop.immeubleses.reduce((sum, imm) => 
            sum + imm.lotses.reduce((lotSum, lot) => 
              lotSum + lot.encaissementsLoyerses.reduce((encSum, enc) => 
                encSum + Number(enc.commissionCapco), 0
              ), 0
            ), 0
          );

          return {
            id: prop.id,
            nom: prop.nom,
            telephone: prop.telephone,
            email: prop.email,
            adresse: prop.adresse,
            created_at: prop.createdAt,
            nombre_immeubles: prop.immeubleses.length,
            nombre_lots_total: totalLots,
            encaissements_12_mois: totalEncaissements,
            commissions_12_mois: totalCommissions,
            net_proprietaire_12_mois: totalEncaissements - totalCommissions,
            immeubles: prop.immeubleses.map(imm => ({
              id: imm.id,
              nom: imm.nom,
              reference: imm.reference,
              adresse: imm.adresse,
              nombre_lots: imm.lotses.length
            }))
          };
        }),
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
   * Récupérer tous les immeubles avec détails
   */
  @Get('immeubles')
  async getImmeubles(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('proprietaire') proprietaireId?: string,
    @Query('search') search?: string,
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (proprietaireId) {
      where.proprietaireId = proprietaireId;
    }
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { adresse: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const [immeubles, total] = await Promise.all([
        this.prisma.immeubles.findMany({
          where,
          orderBy: { nom: 'asc' },
          skip,
          take: limitNum,
          include: {
            proprietaires: true,
            lotses: {
              include: {
                locataires: true,
                bauxes: {
                  where: { statut: 'ACTIF' },
                  take: 1
                },
                encaissementsLoyerses: {
                  where: {
                    dateEncaissement: {
                      gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
                    }
                  }
                }
              }
            },
            depensesImmeubleses: {
              where: {
                date: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
                }
              }
            }
          }
        }),
        this.prisma.immeubles.count({ where })
      ]);

      return {
        data: immeubles.map(imm => {
          const lotsOccupes = imm.lotses.filter(lot => lot.statut === 'OCCUPE').length;
          const totalEncaissements = imm.lotses.reduce((sum, lot) => 
            sum + lot.encaissementsLoyerses.reduce((encSum, enc) => 
              encSum + Number(enc.montantEncaisse), 0
            ), 0
          );
          const totalDepenses = imm.depensesImmeubleses.reduce((sum, dep) => 
            sum + Number(dep.montant), 0
          );

          return {
            id: imm.id,
            nom: imm.nom,
            reference: imm.reference,
            adresse: imm.adresse,
            taux_commission_capco: Number(imm.tauxCommissionCapco),
            notes: imm.notes,
            created_at: imm.createdAt,
            proprietaire: {
              id: imm.proprietaires.id,
              nom: imm.proprietaires.nom,
              telephone: imm.proprietaires.telephone,
              email: imm.proprietaires.email
            },
            nombre_lots_total: imm.lotses.length,
            nombre_lots_occupes: lotsOccupes,
            nombre_lots_libres: imm.lotses.length - lotsOccupes,
            taux_occupation: imm.lotses.length > 0 
              ? (lotsOccupes / imm.lotses.length) * 100 
              : 0,
            encaissements_12_mois: totalEncaissements,
            depenses_12_mois: totalDepenses,
            resultat_net_12_mois: totalEncaissements - totalDepenses,
            lots: imm.lotses.map(lot => ({
              id: lot.id,
              numero: lot.numero,
              etage: lot.etage,
              type: lot.type,
              loyer_mensuel_attendu: Number(lot.loyerMensuelAttendu),
              statut: lot.statut,
              locataire: lot.locataires ? {
                id: lot.locataires.id,
                nom: lot.locataires.nom,
                telephone: lot.locataires.telephone
              } : null,
              bail_actif: lot.bauxes[0] || null
            }))
          };
        }),
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
   * Récupérer tous les locataires avec leurs baux
   */
  @Get('locataires')
  async getLocataires(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const [locataires, total] = await Promise.all([
        this.prisma.locataires.findMany({
          where,
          orderBy: { nom: 'asc' },
          skip,
          take: limitNum,
          include: {
            bauxes: {
              include: {
                lots: {
                  include: {
                    immeubles: {
                      select: {
                        nom: true,
                        reference: true,
                        adresse: true
                      }
                    }
                  }
                }
              }
            },
            lotses: {
              include: {
                immeubles: {
                  select: {
                    nom: true,
                    reference: true
                  }
                },
                encaissementsLoyerses: {
                  where: {
                    dateEncaissement: {
                      gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
                    }
                  }
                }
              }
            }
          }
        }),
        this.prisma.locataires.count({ where })
      ]);

      return {
        data: locataires.map(loc => {
          const bauxActifs = loc.bauxes.filter(bail => bail.statut === 'ACTIF');
          const totalPaiements = loc.lotses.reduce((sum, lot) => 
            sum + lot.encaissementsLoyerses.reduce((encSum, enc) => 
              encSum + Number(enc.montantEncaisse), 0
            ), 0
          );

          return {
            id: loc.id,
            nom: loc.nom,
            telephone: loc.telephone,
            email: loc.email,
            created_at: loc.createdAt,
            nombre_baux_total: loc.bauxes.length,
            nombre_baux_actifs: bauxActifs.length,
            nombre_lots_occupes: loc.lotses.length,
            paiements_12_mois: totalPaiements,
            baux: loc.bauxes.map(bail => ({
              id: bail.id,
              date_debut: bail.dateDebut,
              date_fin: bail.dateFin,
              montant_loyer: Number(bail.montantLoyer),
              jour_paiement_prevu: bail.jourPaiementPrevu,
              statut: bail.statut,
              lot: {
                id: bail.lots.id,
                numero: bail.lots.numero,
                etage: bail.lots.etage,
                type: bail.lots.type,
                immeuble: bail.lots.immeubles
              }
            })),
            lots_actuels: loc.lotses.map(lot => ({
              id: lot.id,
              numero: lot.numero,
              etage: lot.etage,
              type: lot.type,
              immeuble: lot.immeubles
            }))
          };
        }),
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
   * Récupérer les encaissements de loyers avec filtres
   */
  @Get('encaissements')
  async getEncaissements(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('mois') mois?: string,
    @Query('immeuble') immeubleId?: string,
    @Query('proprietaire') proprietaireId?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @CurrentUser() user: any
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (mois) {
      where.moisConcerne = mois;
    }
    
    if (dateDebut && dateFin) {
      where.dateEncaissement = {
        gte: new Date(dateDebut),
        lte: new Date(dateFin)
      };
    }

    // Filtres par immeuble ou propriétaire
    if (immeubleId || proprietaireId) {
      where.lots = {};
      if (immeubleId) {
        where.lots.immeubleId = immeubleId;
      }
      if (proprietaireId) {
        where.lots.immeubles = {
          proprietaireId: proprietaireId
        };
      }
    }

    try {
      const [encaissements, total] = await Promise.all([
        this.prisma.encaissementsLoyers.findMany({
          where,
          orderBy: { dateEncaissement: 'desc' },
          skip,
          take: limitNum,
          include: {
            lots: {
              include: {
                immeubles: {
                  include: {
                    proprietaires: {
                      select: {
                        id: true,
                        nom: true,
                        telephone: true,
                        email: true
                      }
                    }
                  }
                },
                locataires: {
                  select: {
                    id: true,
                    nom: true,
                    telephone: true
                  }
                }
              }
            }
          }
        }),
        this.prisma.encaissementsLoyers.count({ where })
      ]);

      return {
        data: encaissements.map(enc => ({
          id: enc.id,
          mois_concerne: enc.moisConcerne,
          date_encaissement: enc.dateEncaissement,
          montant_encaisse: Number(enc.montantEncaisse),
          mode_paiement: enc.modePaiement,
          observation: enc.observation,
          commission_capco: Number(enc.commissionCapco),
          net_proprietaire: Number(enc.netProprietaire),
          created_at: enc.createdAt,
          created_by: enc.createdBy,
          lot: {
            id: enc.lots.id,
            numero: enc.lots.numero,
            etage: enc.lots.etage,
            type: enc.lots.type,
            loyer_mensuel_attendu: Number(enc.lots.loyerMensuelAttendu)
          },
          immeuble: {
            id: enc.lots.immeubles.id,
            nom: enc.lots.immeubles.nom,
            reference: enc.lots.immeubles.reference,
            adresse: enc.lots.immeubles.adresse,
            taux_commission: Number(enc.lots.immeubles.tauxCommissionCapco)
          },
          proprietaire: enc.lots.immeubles.proprietaires,
          locataire: enc.lots.locataires
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        filters: {
          mois,
          immeuble: immeubleId,
          proprietaire: proprietaireId,
          dateDebut,
          dateFin
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
   * Créer un nouvel encaissement de loyer
   */
  @Post('encaissements')
  async createEncaissement(
    @Body() createDto: {
      lotId: string;
      moisConcerne: string;
      dateEncaissement: string;
      montantEncaisse: number;
      modePaiement: string;
      observation?: string;
    },
    @CurrentUser() user: any
  ) {
    if (createDto.montantEncaisse <= 0) {
      throw new HttpException(
        'Le montant encaissé doit être supérieur à 0',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      // Vérifier que le lot existe et récupérer les infos de l'immeuble
      const lot = await this.prisma.lots.findUnique({
        where: { id: createDto.lotId },
        include: {
          immeubles: true
        }
      });

      if (!lot) {
        throw new HttpException(
          `Lot avec l'ID ${createDto.lotId} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      // Vérifier qu'il n'y a pas déjà un encaissement pour ce lot et ce mois
      const existingEncaissement = await this.prisma.encaissementsLoyers.findFirst({
        where: {
          lotId: createDto.lotId,
          moisConcerne: createDto.moisConcerne
        }
      });

      if (existingEncaissement) {
        throw new HttpException(
          `Un encaissement existe déjà pour ce lot pour le mois ${createDto.moisConcerne}`,
          HttpStatus.CONFLICT
        );
      }

      // Calculer la commission CAPCO
      const tauxCommission = Number(lot.immeubles.tauxCommissionCapco) / 100;
      const commissionCapco = createDto.montantEncaisse * tauxCommission;
      const netProprietaire = createDto.montantEncaisse - commissionCapco;

      const encaissement = await this.prisma.encaissementsLoyers.create({
        data: {
          lotId: createDto.lotId,
          moisConcerne: createDto.moisConcerne,
          dateEncaissement: new Date(createDto.dateEncaissement),
          montantEncaisse: createDto.montantEncaisse,
          modePaiement: createDto.modePaiement as any,
          observation: createDto.observation?.trim() || null,
          commissionCapco: commissionCapco,
          netProprietaire: netProprietaire,
          createdBy: user.id,
          createdAt: new Date()
        }
      });

      return {
        data: encaissement,
        message: 'Encaissement créé avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Erreur lors de la création de l'encaissement: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Récupérer les statistiques immobilières
   */
  @Get('stats/overview')
  async getImmobilierStats(@CurrentUser() user: any) {
    try {
      const [
        totalProprietaires,
        totalImmeubles,
        totalLots,
        lotsOccupes,
        totalLocataires,
        encaissementsMoisCourant,
        encaissements12Mois,
        depenses12Mois
      ] = await Promise.all([
        this.prisma.proprietaires.count(),
        this.prisma.immeubles.count(),
        this.prisma.lots.count(),
        this.prisma.lots.count({ where: { statut: 'OCCUPE' } }),
        this.prisma.locataires.count(),
        this.prisma.encaissementsLoyers.aggregate({
          where: {
            moisConcerne: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
          },
          _sum: { montantEncaisse: true, commissionCapco: true, netProprietaire: true }
        }),
        this.prisma.encaissementsLoyers.aggregate({
          where: {
            dateEncaissement: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
            }
          },
          _sum: { montantEncaisse: true, commissionCapco: true, netProprietaire: true }
        }),
        this.prisma.depensesImmeubles.aggregate({
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
            }
          },
          _sum: { montant: true }
        })
      ]);

      return {
        data: {
          total_proprietaires: totalProprietaires,
          total_immeubles: totalImmeubles,
          total_lots: totalLots,
          lots_occupes: lotsOccupes,
          lots_libres: totalLots - lotsOccupes,
          taux_occupation_global: totalLots > 0 ? (lotsOccupes / totalLots) * 100 : 0,
          total_locataires: totalLocataires,
          // Mois courant
          encaissements_mois_courant: Number(encaissementsMoisCourant._sum.montantEncaisse || 0),
          commissions_mois_courant: Number(encaissementsMoisCourant._sum.commissionCapco || 0),
          net_proprietaires_mois_courant: Number(encaissementsMoisCourant._sum.netProprietaire || 0),
          // 12 derniers mois
          encaissements_12_mois: Number(encaissements12Mois._sum.montantEncaisse || 0),
          commissions_12_mois: Number(encaissements12Mois._sum.commissionCapco || 0),
          net_proprietaires_12_mois: Number(encaissements12Mois._sum.netProprietaire || 0),
          depenses_12_mois: Number(depenses12Mois._sum.montant || 0),
          resultat_net_12_mois: Number(encaissements12Mois._sum.netProprietaire || 0) - Number(depenses12Mois._sum.montant || 0)
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