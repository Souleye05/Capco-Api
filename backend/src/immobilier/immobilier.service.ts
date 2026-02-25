import { Injectable } from '@nestjs/common';
import { ImmeublesService } from './immeubles/immeubles.service';
import { EncaissementsService } from './encaissements/encaissements.service';
import { DepensesImmeublesService } from './depenses/depenses-immeubles.service';
import { ProprietairesService } from './proprietaires/proprietaires.service';

@Injectable()
export class ImmobilierService {
    constructor(
        private readonly immeublesService: ImmeublesService,
        private readonly encaissementsService: EncaissementsService,
        private readonly depensesService: DepensesImmeublesService,
        private readonly proprietairesService: ProprietairesService,
    ) { }

    /**
     * Tableau de bord de l'immobilier
     */
    async getDashboard() {
        const [immeubleStats, encaissementStats, depenseStats, proprietaireStats] = await Promise.all([
            this.immeublesService.getStatistics(),
            this.encaissementsService.getStatistics(),
            this.depensesService.getStatistics(),
            this.proprietairesService.getStatistics(),
        ]);

        return {
            proprietaires: proprietaireStats,
            immeubles: immeubleStats,
            encaissements: encaissementStats,
            depenses: depenseStats,
            synthese: {
                totalProprietaires: proprietaireStats.totalProprietaires,
                totalImmeubles: immeubleStats.totalImmeubles,
                totalLots: immeubleStats.totalLots,
                tauxOccupation: immeubleStats.tauxOccupation,
                totalLoyersEncaisses: encaissementStats.totalEncaisse,
                totalCommissions: encaissementStats.totalCommissions,
                totalDepenses: depenseStats.totalMontant,
                resultatNet: encaissementStats.totalEncaisse - encaissementStats.totalCommissions - depenseStats.totalMontant,
            },
        };
    }
}
