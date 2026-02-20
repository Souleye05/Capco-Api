import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutAffaire } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AffairesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StatutAffaire, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(StatutAffaire)
  statut?: StatutAffaire;

  @ApiPropertyOptional({ description: 'Filtrer par référence' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Recherche dans le titre/intitulé' })
  @IsOptional()
  @IsString()
  intitule?: string;
}