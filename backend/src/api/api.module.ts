import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ApiController],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class ApiModule {}