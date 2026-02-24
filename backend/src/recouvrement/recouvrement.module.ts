import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';

// Controllers
import { RecouvrementController } from './recouvrement.controller';
import { DossiersController } from './dossiers/dossiers.controller';
import { ActionsController } from './actions/actions.controller';
import { PaiementsController } from './paiements/paiements.controller';
import { HonorairesRecouvrementController } from './honoraires/honoraires-recouvrement.controller';
import { DepensesDossierController } from './depenses/depenses-dossier.controller';

// Services
import { RecouvrementService } from './recouvrement.service';
import { DossiersService } from './dossiers/dossiers.service';
import { ActionsService } from './actions/actions.service';
import { PaiementsService } from './paiements/paiements.service';
import { HonorairesRecouvrementService } from './honoraires/honoraires-recouvrement.service';
import { DepensesDossierService } from './depenses/depenses-dossier.service';

@Module({
    imports: [CommonModule],
    controllers: [
        RecouvrementController,
        DossiersController,
        ActionsController,
        PaiementsController,
        HonorairesRecouvrementController,
        DepensesDossierController,
    ],
    providers: [
        RecouvrementService,
        DossiersService,
        ActionsService,
        PaiementsService,
        HonorairesRecouvrementService,
        DepensesDossierService,
    ],
    exports: [
        RecouvrementService,
        DossiersService,
        ActionsService,
        PaiementsService,
        HonorairesRecouvrementService,
        DepensesDossierService,
    ],
})
export class RecouvrementModule { }
