import { BadRequestException } from '@nestjs/common';

/**
 * Classe utilitaire extraite du service pour isoler la logique métier liée aux dates de loyer.
 */
export class RentCalculator {

    /**
     * Calcule la date d'échéance du loyer pour un mois donné (format "YYYY-MM").
     * L'échéance est fixée au 5ème jour du mois concerné.
     */
    static calculerDateEcheance(mois: string): Date {
        const [year, monthStr] = mois.split('-');

        // Remplacement du catch silencieux : on lève une exception explicite si le format est invalide
        if (!year || !monthStr || isNaN(parseInt(year)) || isNaN(parseInt(monthStr))) {
            throw new BadRequestException(`Format de mois invalide : "${mois}". Format attendu : YYYY-MM`);
        }

        const month = parseInt(monthStr, 10);
        
        if (month < 1 || month > 12) {
            throw new BadRequestException(
                `Mois invalide : "${month}". Doit être compris entre 1 et 12.`);
        }

        return new Date(Date.UTC(parseInt(year, 10), parseInt(monthStr, 10) - 1, 5, 23, 59, 59, 999));
    }

    /**
     * Calcule le nombre de jours de retard depuis l'échéance du mois donné.
     * Retourne 0 si l'échéance n'est pas encore dépassée.
     */
    static calculerJoursRetard(mois: string): number {
        const dateEcheance = this.calculerDateEcheance(mois);
        const today = new Date();

        // Math.abs supprimé : la condition garantit déjà que la différence est positive
        if (today <= dateEcheance) return 0;

        const diffTime = today.getTime() - dateEcheance.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
