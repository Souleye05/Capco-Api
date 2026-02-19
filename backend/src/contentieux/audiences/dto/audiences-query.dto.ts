import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeAudience, StatutAudience } from '../../../types/prisma-enums';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AudiencesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par ID d\'affaire' })
  @IsOptional()
  @IsUUID()
  affaireId?: string;

  @ApiPropertyOptional({ enum: StatutAudience, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(StatutAudience)
  statut?: StatutAudience;

  @ApiPropertyOptional({ enum: TypeAudience, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(TypeAudience)
  type?: TypeAudience;

  @ApiPropertyOptional({ description: 'Filtrer par date de début (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Filtrer par date de fin (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateFin?: string;
}