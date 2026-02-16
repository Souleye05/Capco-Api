import { Module } from '@nestjs/common';
import { ConseilController } from './conseil.controller';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ConseilController],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class ConseilModule {}