import { Module } from '@nestjs/common';
import { ImmobilierController } from './immobilier.controller';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ImmobilierController],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class ImmobilierModule {}