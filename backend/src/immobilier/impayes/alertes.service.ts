import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { TypeAlerte, PrioriteAlerte } from '@prisma/client';

@Injectable()
export class AlertesService {
    private readonly logger = new Logger(AlertesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Générer une alerte automatique pour un loyer impayé
     */
    async genererAlerteImpaye(
        lotId: string,
        mois: string,
        montantManquant: number,
        nombreJoursRetard: number,
        userId?: string
    ): Promise<void> {
        this.logger.log('Génération d\'une alerte LOYER_IMPAYE', {
            lotId,
            mois,
            montantManquant,
            nombreJoursRetard
        });

        try {
            // Récupérer les informations du lot
            const lot = await this.prisma.lots.findUnique({
                where: { id: lotId },
                include: {
                    immeuble: true,
                    locataire: true
                }
            });

            if (!lot) {
                this.logger.warn(`Lot ${lotId} non trouvé pour la génération d'alerte`);
                return;
            }

            // Vérifier si une alerte similaire existe déjà pour ce mois
            const alerteExistante = await this.prisma.alertes.findFirst({
                where: {
                    type: TypeAlerte.LOYER_IMPAYE,
                    lien: `/immobilier/lots/${lotId}`,
                    description: {
                        contains: mois
                    }
                }
            });

            if (alerteExistante) {
                this.logger.debug(`Alerte LOYER_IMPAYE déjà existante pour le lot ${lotId} et le mois ${mois}`);
                return;
            }

            // Déterminer la priorité selon le nombre de jours de retard
            let priorite: PrioriteAlerte;
            if (nombreJoursRetard >= 60) {
                priorite = PrioriteAlerte.HAUTE;
            } else if (nombreJoursRetard >= 30) {
                priorite = PrioriteAlerte.MOYENNE;
            } else {
                priorite = PrioriteAlerte.BASSE;
            }

            // Construire le titre et la description
            const locataireNom = lot.locataire?.nom || 'Locataire non renseigné';
            const titre = `Loyer impayé - ${lot.immeuble.nom} - Lot ${lot.numero}`;
            const description = `Le locataire ${locataireNom} a un impayé de ${montantManquant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })} pour le mois ${mois}. Retard: ${nombreJoursRetard} jours.`;

            // Créer l'alerte
            await this.prisma.alertes.create({
                data: {
                    type: TypeAlerte.LOYER_IMPAYE,
                    titre,
                    description,
                    lien: `/immobilier/lots/${lotId}`,
                    priorite,
                    lu: false,
                    userId: userId || null
                }
            });

            this.logger.log(`Alerte LOYER_IMPAYE créée avec succès`, {
                lotId,
                mois,
                priorite,
                titre
            });

        } catch (error) {
            this.logger.error(`Erreur lors de la génération de l'alerte LOYER_IMPAYE: ${error.message}`, error.stack);
            // Ne pas faire échouer le processus principal si la génération d'alerte échoue
        }
    }

    /**
     * Générer des alertes pour tous les impayés détectés
     */
    async genererAlertesImpayesPourMois(mois: string, userId?: string): Promise<number> {
        this.logger.log(`Génération d'alertes pour tous les impayés du mois ${mois}`);

        try {
            // Récupérer tous les lots occupés avec leurs encaissements pour le mois
            const lots = await this.prisma.lots.findMany({
                where: { statut: 'OCCUPE' },
                include: {
                    immeuble: true,
                    locataire: true,
                    encaissementsLoyers: {
                        where: { moisConcerne: mois }
                    }
                }
            });

            let alertesGenerees = 0;

            for (const lot of lots) {
                // Vérifier si le lot a un loyer défini
                if (!lot.loyerMensuelAttendu || Number(lot.loyerMensuelAttendu) <= 0) {
                    continue;
                }

                const montantAttendu = Number(lot.loyerMensuelAttendu);
                const montantEncaisse = lot.encaissementsLoyers.reduce(
                    (sum, enc) => sum + Number(enc.montantEncaisse),
                    0
                );
                const montantManquant = montantAttendu - montantEncaisse;

                // Si il y a un impayé, générer une alerte
                if (montantManquant > 0) {
                    const nombreJoursRetard = this.calculerJoursRetard(mois);
                    await this.genererAlerteImpaye(lot.id, mois, montantManquant, nombreJoursRetard, userId);
                    alertesGenerees++;
                }
            }

            this.logger.log(`${alertesGenerees} alertes LOYER_IMPAYE générées pour le mois ${mois}`);
            return alertesGenerees;

        } catch (error) {
            this.logger.error(`Erreur lors de la génération des alertes pour le mois ${mois}: ${error.message}`, error.stack);
            return 0;
        }
    }

    /**
     * Supprimer les alertes d'impayés résolues
     */
    async supprimerAlertesImpayesResolues(lotId: string, mois: string): Promise<void> {
        this.logger.log(`Suppression des alertes LOYER_IMPAYE résolues`, { lotId, mois });

        try {
            await this.prisma.alertes.deleteMany({
                where: {
                    type: TypeAlerte.LOYER_IMPAYE,
                    lien: `/immobilier/lots/${lotId}`,
                    description: {
                        contains: mois
                    }
                }
            });

            this.logger.log(`Alertes LOYER_IMPAYE supprimées pour le lot ${lotId} et le mois ${mois}`);

        } catch (error) {
            this.logger.error(`Erreur lors de la suppression des alertes: ${error.message}`, error.stack);
        }
    }

    /**
     * Calculer le nombre de jours de retard depuis le 5 du mois
     */
    private calculerJoursRetard(mois: string): number {
        const [year, month] = mois.split('-').map(Number);
        const dateEcheance = new Date(year, month - 1, 5); // Le 5 du mois
        const maintenant = new Date();

        // Si nous sommes avant le 5 du mois suivant, utiliser le mois suivant comme référence
        if (maintenant.getDate() < 5) {
            maintenant.setMonth(maintenant.getMonth() - 1);
        }

        const diffTime = maintenant.getTime() - dateEcheance.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return Math.max(0, diffDays);
    }
}