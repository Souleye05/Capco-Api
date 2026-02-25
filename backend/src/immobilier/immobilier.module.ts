import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';

// Controllers
import { ImmobilierController } from './immobilier.controller';
import { ProprietairesController } from './proprietaires/proprietaires.controller';
import { ImmeublesController } from './immeubles/immeubles.controller';
import { LotsController } from './lots/lots.controller';
import { LocatairesController } from './locataires/locataires.controller';
import { BauxController } from './baux/baux.controller';
import { EncaissementsController } from './encaissements/encaissements.controller';
import { DepensesImmeublesController } from './depenses/depenses-immeubles.controller';
import { RapportsGestionController } from './rapports/rapports-gestion.controller';

// Services
import { ImmobilierService } from './immobilier.service';
import { ProprietairesService } from './proprietaires/proprietaires.service';
import { ImmeublesService } from './immeubles/immeubles.service';
import { LotsService } from './lots/lots.service';
import { LocatairesService } from './locataires/locataires.service';
import { BauxService } from './baux/baux.service';
import { EncaissementsService } from './encaissements/encaissements.service';
import { DepensesImmeublesService } from './depenses/depenses-immeubles.service';
import { RapportsGestionService } from './rapports/rapports-gestion.service';

@Module({
    imports: [CommonModule],
    controllers: [
        ImmobilierController,
        ProprietairesController,
        ImmeublesController,
        LotsController,
        LocatairesController,
        BauxController,
        EncaissementsController,
        DepensesImmeublesController,
        RapportsGestionController,
    ],
    providers: [
        ImmobilierService,
        ProprietairesService,
        ImmeublesService,
        LotsService,
        LocatairesService,
        BauxService,
        EncaissementsService,
        DepensesImmeublesService,
        RapportsGestionService,
    ],
    exports: [
        ImmobilierService,
        ProprietairesService,
        ImmeublesService,
        LotsService,
        LocatairesService,
        BauxService,
        EncaissementsService,
        DepensesImmeublesService,
        RapportsGestionService,
    ],
})
export class ImmobilierModule { }
