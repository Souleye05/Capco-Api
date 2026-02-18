import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class HonorairesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par ID d\'affaire' })
  @IsOptional()
  @IsUUID()
  affaireId?: string;

  @ApiPropertyOptional({ description: 'Date de début de facturation (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateDebutFacturation?: Date;

  @ApiPropertyOptional({ description: 'Date de fin de facturation (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFinFacturation?: Date;
}