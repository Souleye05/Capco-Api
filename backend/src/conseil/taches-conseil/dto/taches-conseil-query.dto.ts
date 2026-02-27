import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { TypeTache } from './create-tache-conseil.dto';

export class TachesConseilQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par client conseil' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ 
    enum: TypeTache, 
    description: 'Filtrer par type de tâche' 
  })
  @IsOptional()
  @IsEnum(TypeTache)
  type?: TypeTache;

  @ApiPropertyOptional({ 
    description: 'Filtrer par mois concerné (format YYYY-MM)',
    example: '2024-01'
  })
  @IsOptional()
  @IsString()
  moisConcerne?: string;
}