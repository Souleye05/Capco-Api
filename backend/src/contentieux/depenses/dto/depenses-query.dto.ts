import { IsOptional, IsUUID, IsDateString, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class DepensesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par ID d\'affaire' })
  @IsOptional()
  @IsUUID()
  affaireId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type de dépense' })
  @IsOptional()
  @IsString()
  typeDepense?: string;

  @ApiPropertyOptional({ description: 'Date de début (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateDebut?: Date;

  @ApiPropertyOptional({ description: 'Date de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFin?: Date;

  @ApiPropertyOptional({ description: 'Montant minimum' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montantMin?: number;

  @ApiPropertyOptional({ description: 'Montant maximum' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montantMax?: number;
}