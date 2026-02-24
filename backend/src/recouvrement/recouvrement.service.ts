import { Injectable } from '@nestjs/common';
import { DossiersService } from './dossiers/dossiers.service';
import { PaiementsService } from './paiements/paiements.service';
import { DepensesDossierService } from './depenses/depenses-dossier.service';

@Injectable()
export class RecouvrementService {
    constructor(
        private readonly dossiersService: DossiersService,
        private readonly paiementsService: PaiementsService,
        private readonly depensesService: DepensesDossierService,
    ) { }

    /**
     * Tableau de bord du recouvrement
     */
    async getDashboard() {
        const [dossierStats, paiementStats, depenseStats] = await Promise.all([
            this.dossiersService.getStatistics(),
            this.paiementsService.getStatistics(),
            this.depensesService.getStatistics(),
        ]);

        return {
            dossiers: dossierStats,
            paiements: paiementStats,
            depenses: depenseStats,
            synthese: {
                totalARecouvrer: dossierStats.totalARecouvrer,
                totalRecouvre: dossierStats.totalRecouvre,
                totalDepenses: depenseStats.totalMontant,
                soldeNet: dossierStats.totalRecouvre - depenseStats.totalMontant,
                tauxRecouvrement: dossierStats.tauxRecouvrement,
            },
        };
    }
}
