import { Module } from '@nestjs/common';
import { JuridictionsController } from './juridictions.controller';
import { JuridictionsService } from './juridictions.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [JuridictionsController],
  providers: [JuridictionsService],
  exports: [JuridictionsService],
})
export class JuridictionsModule {}