import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class JuridictionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par statut actif' })
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;

  @ApiPropertyOptional({ description: 'Filtrer par code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Recherche dans le nom' })
  @IsOptional()
  @IsString()
  nom?: string;
}