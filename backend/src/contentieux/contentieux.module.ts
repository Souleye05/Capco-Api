import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';

// Controllers
import { ContentieuxController } from './contentieux.controller';
import { AffairesController } from './affaires/affaires.controller';
import { AudiencesController } from './audiences/audiences.controller';
import { HonorairesController } from './honoraires/honoraires.controller';
import { DepensesController } from './depenses/depenses.controller';
import { JuridictionsController } from './juridictions/juridictions.controller';

// Services
import { ContentieuxService } from './contentieux.service';
import { AffairesService } from './affaires/affaires.service';
import { AudiencesService } from './audiences/audiences.service';
import { AudienceCronService } from './audiences/audience-cron.service';
import { HonorairesService } from './honoraires/honoraires.service';
import { DepensesService } from './depenses/depenses.service';
import { JuridictionsService } from './juridictions/juridictions.service';

@Module({
  imports: [CommonModule],
  controllers: [
    ContentieuxController,
    AffairesController,
    AudiencesController,
    HonorairesController,
    DepensesController,
    JuridictionsController,
  ],
  providers: [
    ContentieuxService,
    AffairesService,
    AudiencesService,
    AudienceCronService,
    HonorairesService,
    DepensesService,
    JuridictionsService,
  ],
  exports: [
    ContentieuxService,
    AffairesService,
    AudiencesService,
    HonorairesService,
    DepensesService,
    JuridictionsService,
  ],
})
export class ContentieuxModule {}