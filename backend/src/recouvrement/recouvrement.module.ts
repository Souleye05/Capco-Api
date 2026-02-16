import { Module } from '@nestjs/common';
import { DossiersRecouvrementController } from './dossiers-recouvrement.controller';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [DossiersRecouvrementController],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class RecouvrementModule {}