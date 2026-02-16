import { Module } from '@nestjs/common';
import { AffairesController } from './affaires.controller';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [AffairesController],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AffairesModule {}