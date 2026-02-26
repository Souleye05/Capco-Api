import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { ImpayeDto, StatistiquesImpayesDto, ImpayesQueryDto } from './dto/impaye.dto';
import { getCurrentImpayesMonth, getCurrentMonthYM, addMonthsToYM } from '../../common/utils/date.utils';
import { RentCalculator } from './rent-calculator';

@Injectable()
export class ImpayesService {
    private readonly logger = new Logger(ImpayesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService
    ) { }

    /**
     * Détecte les impayés pour un mois donné avec pagination
     * 
     * @param query - Paramètres de requête incluant mois, filtres et pagination
     * @returns Promise<PaginatedResponse<ImpayeDto>> - Résultats paginés des impayés
     */
    async detecterImpayesPourMois(query: ImpayesQueryDto & PaginationQueryDto): Promise<PaginatedResponse<ImpayeDto>> {
        const { mois, immeubleId, locataireId, ...paginationQuery } = query;
        
        // Validation des paramètres
        this.validateParameters(mois, immeubleId, locataireId);
        
        this.logger.log(`Détection des impayés pour ${mois}`, { 
            immeubleId, 
            locataireId, 
            page: paginationQuery.page, 
            limit: paginationQuery.limit 
        });

        try {
            // Construction des conditions de filtrage
            const whereLots: Prisma.LotsWhereInput = { 
                statut: 'OCCUPE',
                ...(immeubleId && { immeubleId }),
                ...(locataireId && { locataireId })
            };

            // Utilisation du service de pagination
            const result = await this.paginationService.paginate(
                this.prisma.lots,
                paginationQuery,
                {
                    where: whereLots,
                    include: {
                        immeuble: true,
                        locataire: true,
                        encaissementsLoyers: {
                            where: { moisConcerne: mois }
                        }
                    },
                    searchFields: ['numero', 'immeuble.nom', 'locataire.nom'],
                    defaultSortBy: 'numero'
                }
            );

            // Transformation des données en ImpayeDto
            const impayes: ImpayeDto[] = [];
            
            for (const lotData of result.data) {
                // Assertion de type pour accéder aux propriétés
                const lot = lotData as any; // ou créer un type spécifique
                
                const montantAttendu = this.validateAndGetMontantAttendu(lot);
                if (montantAttendu === null) continue;

                const montantEncaisse = lot.encaissementsLoyers.reduce(
                    (sum: number, enc: any) => sum + Number(enc.montantEncaisse), 
                    0
                );
                const montantManquant = montantAttendu - montantEncaisse;

                if (montantManquant > 0) {
                    const nombreJoursRetard = RentCalculator.calculerJoursRetard(mois);

                    impayes.push({
                        lotId: lot.id,
                        lotNumero: lot.numero,
                        immeubleId: lot.immeuble.id,
                        immeubleNom: lot.immeuble.nom,
                        immeubleReference: lot.immeuble.reference,
                        locataireId: lot.locataire?.id,
                        locataireNom: lot.locataire?.nom || 'Non Renseigné',
                        moisConcerne: mois,
                        montantAttendu,
                        montantEncaisse,
                        montantManquant,
                        nombreJoursRetard,
                        statut: montantEncaisse === 0 ? 'IMPAYE' : 'PARTIEL',
                        dateEcheance: RentCalculator.calculerDateEcheance(mois)
                    });
                }
            }

            // Tri des impayés : les plus anciens et les plus gros montants en premier
            const impayesTries = impayes.sort((a, b) => {
                if (b.nombreJoursRetard !== a.nombreJoursRetard) {
                    return b.nombreJoursRetard - a.nombreJoursRetard;
                }
                return b.montantManquant - a.montantManquant;
            });

            this.logger.log(`${impayesTries.length} impayés détectés pour ${mois}`);

            return {
                data: impayesTries,
                pagination: result.pagination
            };

        } catch (error) {
            this.logger.error(`Erreur lors de la détection des impayés: ${error.message}`, error.stack);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la détection des impayés');
        }
    }

    /**
     * Récupère les statistiques des impayés avec optimisations de performance
     * 
     * @param immeubleId - ID optionnel pour filtrer par immeuble
     * @returns Promise<StatistiquesImpayesDto> - Statistiques complètes des impayés
     */
    async getStatistiquesImpayes(immeubleId?: string): Promise<StatistiquesImpayesDto> {
        this.logger.log('Calcul des statistiques des impayés', { immeubleId });

        try {
            // Validation de l'immeubleId si fourni
            if (immeubleId && !isUUID(immeubleId)) {
                throw new BadRequestException('immeubleId doit être un UUID valide');
            }

            const currentMois = getCurrentImpayesMonth();
            
            // Récupération des impayés du mois courant
            const impayesResult = await this.detecterImpayesPourMois({ 
                mois: currentMois, 
                immeubleId,
                page: 1,
                limit: 1000 // Limite élevée pour les statistiques
            });
            
            const impayes = impayesResult.data;
            const totalMontantImpaye = impayes.reduce((sum, imp) => sum + imp.montantManquant, 0);
            const nombreLotsImpayes = impayes.length;

            // Calcul du taux d'impayés
            const totalLotsOccupes = await this.countLotsOccupes(immeubleId);
            const tauxImpayes = totalLotsOccupes > 0 
                ? Number(((nombreLotsImpayes / totalLotsOccupes) * 100).toFixed(2)) 
                : 0;

            // Répartition par immeuble
            const repartitionMap = this.calculateRepartitionParImmeuble(impayes);

            // Évolution mensuelle optimisée
            const evolutionMensuelle = await this.calculateEvolutionMensuelle(immeubleId);

            this.logger.log(`Statistiques calculées: ${nombreLotsImpayes} impayés, ${totalMontantImpaye.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })} total`);

            return {
                totalMontantImpaye,
                nombreLotsImpayes,
                tauxImpayes,
                repartitionParImmeuble: Array.from(repartitionMap.values()).sort((a, b) => b.montant - a.montant),
                evolutionMensuelle
            };

        } catch (error) {
            this.logger.error(`Erreur lors du calcul des statistiques: ${error.message}`, error.stack);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors du calcul des statistiques des impayés');
        }
    }

    /**
     * Valide les paramètres d'entrée de la méthode detecterImpayesPourMois
     */
    private validateParameters(mois: string, immeubleId?: string, locataireId?: string): void {
        // Validation du format du mois
        if (!mois || !/^\d{4}-\d{2}$/.test(mois)) {
            throw new BadRequestException('Le mois doit être au format YYYY-MM');
        }

        // Validation de l'année et du mois
        const [yearStr, monthStr] = mois.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        if (year < 2000 || year > 2100) {
            throw new BadRequestException('L\'année doit être comprise entre 2000 et 2100');
        }

        if (month < 1 || month > 12) {
            throw new BadRequestException('Le mois doit être compris entre 01 et 12');
        }

        // Validation des UUIDs si fournis
        if (immeubleId && !isUUID(immeubleId)) {
            throw new BadRequestException('immeubleId doit être un UUID valide');
        }

        if (locataireId && !isUUID(locataireId)) {
            throw new BadRequestException('locataireId doit être un UUID valide');
        }
    }

    /**
     * Valide et récupère le montant attendu d'un lot
     * 
     * @param lot - Lot à valider
     * @returns number | null - Montant attendu ou null si invalide
     */
    private validateAndGetMontantAttendu(lot: any): number | null {
        if (!lot.loyerMensuelAttendu || lot.loyerMensuelAttendu <= 0) {
            this.logger.warn(`Lot ${lot.numero} (${lot.id}) n'a pas de loyer mensuel défini ou valide`);
            return null;
        }

        const montant = Number(lot.loyerMensuelAttendu);
        if (isNaN(montant) || montant <= 0) {
            this.logger.warn(`Lot ${lot.numero} (${lot.id}) a un loyer mensuel invalide: ${lot.loyerMensuelAttendu}`);
            return null;
        }

        return montant;
    }

    /**
     * Compte le nombre de lots occupés avec filtrage optionnel
     */
    private async countLotsOccupes(immeubleId?: string): Promise<number> {
        const whereLots: Prisma.LotsWhereInput = { statut: 'OCCUPE' };
        if (immeubleId) {
            whereLots.immeubleId = immeubleId;
        }

        return this.prisma.lots.count({ where: whereLots });
    }

    /**
     * Calcule la répartition des impayés par immeuble
     */
    private calculateRepartitionParImmeuble(impayes: ImpayeDto[]): Map<string, { immeubleId: string; immeubleNom: string; montant: number; nombreLots: number }> {
        const repartitionMap = new Map<string, { immeubleId: string; immeubleNom: string; montant: number; nombreLots: number }>();
        
        for (const imp of impayes) {
            const stats = repartitionMap.get(imp.immeubleId) || {
                immeubleId: imp.immeubleId,
                immeubleNom: imp.immeubleNom,
                montant: 0,
                nombreLots: 0
            };

            stats.montant += imp.montantManquant;
            stats.nombreLots += 1;
            repartitionMap.set(imp.immeubleId, stats);
        }

        return repartitionMap;
    }

    /**
     * Calcule l'évolution mensuelle des impayés sur 6 mois (optimisé)
     */
    private async calculateEvolutionMensuelle(immeubleId?: string): Promise<{ mois: string; montant: number }[]> {
        const currentMonthYM = getCurrentMonthYM();
        const lesSixMois = Array.from({ length: 6 }, (_, i) => addMonthsToYM(currentMonthYM, -(5 - i)));

        // Une seule requête pour récupérer tous les lots avec leurs encaissements des 6 derniers mois
        const lotsAvecEncaissements = await this.prisma.lots.findMany({
            where: { 
                statut: 'OCCUPE', 
                ...(immeubleId && { immeubleId }) 
            },
            include: {
                encaissementsLoyers: {
                    where: { moisConcerne: { in: lesSixMois } }
                },
                immeuble: true,
            }
        });

        // Calcul en mémoire pour chaque mois
        return lesSixMois.map(mois => {
            let montant = 0;

            for (const lot of lotsAvecEncaissements) {
                const loyerAttendu = this.validateAndGetMontantAttendu(lot);
                if (loyerAttendu === null) continue;

                const encaisse = lot.encaissementsLoyers
                    .filter(enc => enc.moisConcerne === mois)
                    .reduce((sum, enc) => sum + Number(enc.montantEncaisse), 0);

                const manquant = loyerAttendu - encaisse;
                if (manquant > 0) {
                    montant += manquant;
                }
            }

            return { mois, montant };
        });
    }
}
