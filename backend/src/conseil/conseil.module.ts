import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';

// Controllers
import { ConseilController } from './conseil.controller';
import { ClientsConseilController } from './clients-conseil/clients-conseil.controller';
import { TachesConseilController } from './taches-conseil/taches-conseil.controller';
import { FacturesConseilController } from './factures-conseil/factures-conseil.controller';
import { PaiementsConseilController } from './paiements-conseil/paiements-conseil.controller';

// Services
import { ClientsConseilService } from './clients-conseil/clients-conseil.service';
import { TachesConseilService } from './taches-conseil/taches-conseil.service';
import { FacturesConseilService } from './factures-conseil/factures-conseil.service';
import { PaiementsConseilService } from './paiements-conseil/paiements-conseil.service';

@Module({
  imports: [CommonModule],
  controllers: [
    ConseilController,
    ClientsConseilController,
    TachesConseilController,
    FacturesConseilController,
    PaiementsConseilController,
  ],
  providers: [
    ClientsConseilService,
    TachesConseilService,
    FacturesConseilService,
    PaiementsConseilService,
  ],
  exports: [
    ClientsConseilService,
    TachesConseilService,
    FacturesConseilService,
    PaiementsConseilService,
  ],
})
export class ConseilModule {}