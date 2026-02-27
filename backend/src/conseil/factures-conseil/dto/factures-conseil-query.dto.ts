import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { StatutFacture } from './create-facture-conseil.dto';

export class FacturesConseilQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par client conseil' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ 
    enum: StatutFacture, 
    description: 'Filtrer par statut de facture' 
  })
  @IsOptional()
  @IsEnum(StatutFacture)
  statut?: StatutFacture;

  @ApiPropertyOptional({ 
    description: 'Filtrer par mois concerné (format YYYY-MM)',
    example: '2024-01'
  })
  @IsOptional()
  @IsString()
  moisConcerne?: string;
}