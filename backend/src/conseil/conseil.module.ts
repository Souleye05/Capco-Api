import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ConseilModule {}