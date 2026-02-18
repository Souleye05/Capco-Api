import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ApiModule } from './api/api.module';
import { AuditModule } from './audit/audit.module';
import { AffairesModule } from './affaires/affaires.module';
import { RecouvrementModule } from './recouvrement/recouvrement.module';
import { ImmobilierModule } from './immobilier/immobilier.module';
import { ConseilModule } from './conseil/conseil.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ApiModule,
    AuditModule,
    AffairesModule,
    RecouvrementModule,
    ImmobilierModule,
    ConseilModule,
  ],
})
export class AppModule {}