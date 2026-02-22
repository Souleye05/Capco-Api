import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './config';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ApiModule } from './api/api.module';
import { AuditModule } from './audit/audit.module';
import { ConseilModule } from './conseil/conseil.module';
import { ContentieuxModule } from './contentieux/contentieux.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ApiModule,
    AuditModule,
    ConseilModule,
    ContentieuxModule,
  ],
})
export class AppModule {}