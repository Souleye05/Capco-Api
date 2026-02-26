import { Injectable } from '@nestjs/common';
import { ImmeublesService } from './immeubles/immeubles.service';
import { EncaissementsService } from './encaissements/encaissements.service';
import { DepensesImmeublesService } from './depenses/depenses-immeubles.service';
import { ProprietairesService } from './proprietaires/proprietaires.service';
import { ImpayesService } from './impayes/impayes.service';
import { ArrieragesService } from './impayes/arrierages.service';

@Injectable()
export class ImmobilierService {
    constructor(
        private readonly immeublesService: ImmeublesService,
        private readonly encaissementsService: EncaissementsService,
        private readonly depensesService: DepensesImmeublesService,
        private readonly proprietairesService: ProprietairesService,
        private readonly impayesService: ImpayesService,
        private readonly arrieragesService: ArrieragesService,
    ) { }

    /**
     * Tableau de bord de l'immobilier
     */
    async getDashboard() {
        const [
            immeubleStats, 
            encaissementStats, 
            depenseStats, 
            proprietaireStats,
            impayesStats,
            arrieragesStats
        ] = await Promise.all([
            this.immeublesService.getStatistics(),
            this.encaissementsService.getStatistics(),
            this.depensesService.getStatistics(),
            this.proprietairesService.getStatistics(),
            this.impayesService.getStatistiquesImpayes(),
            this.arrieragesService.getStatistiquesArrierages(),
        ]);

        return {
            proprietaires: proprietaireStats,
            immeubles: immeubleStats,
            encaissements: encaissementStats,
            depenses: depenseStats,
            impayes: impayesStats,
            arrierages: arrieragesStats,
            synthese: {
                totalProprietaires: proprietaireStats.totalProprietaires,
                totalImmeubles: immeubleStats.totalImmeubles,
                totalLots: immeubleStats.totalLots,
                tauxOccupation: immeubleStats.tauxOccupation,
                totalLoyersEncaisses: encaissementStats.totalEncaisse,
                totalCommissions: encaissementStats.totalCommissions,
                totalDepenses: depenseStats.totalMontant,
                totalImpayes: impayesStats.totalMontantImpaye,
                totalArrierages: arrieragesStats.totalMontantArrierage,
                resultatNet: encaissementStats.totalEncaisse - encaissementStats.totalCommissions - depenseStats.totalMontant,
                creancesTotales: impayesStats.totalMontantImpaye + arrieragesStats.totalMontantArrierage,
            },
        };
    }
}
