import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ModePaiement } from './create-paiement-conseil.dto';

export class PaiementsConseilQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par facture conseil' })
  @IsOptional()
  @IsUUID()
  factureId?: string;

  @ApiPropertyOptional({ 
    enum: ModePaiement, 
    description: 'Filtrer par mode de paiement' 
  })
  @IsOptional()
  @IsEnum(ModePaiement)
  mode?: ModePaiement;
}