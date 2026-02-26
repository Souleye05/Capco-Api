import { IsOptional, IsDateString, IsUUID, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { TypeAction } from '@prisma/client';

export class ActionsQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Filtrer par ID de dossier' })
    @IsOptional()
    @IsUUID()
    dossierId?: string;

    @ApiPropertyOptional({ description: 'Date de début (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateDebut?: string;

    @ApiPropertyOptional({ description: 'Date de fin (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateFin?: string;

    @ApiPropertyOptional({ enum: TypeAction, description: 'Filtrer par type d\'action' })
    @IsOptional()
    @IsEnum(TypeAction)
    typeAction?: TypeAction;

    @ApiPropertyOptional({ description: 'Terme de recherche' })
    @IsOptional()
    @IsString()
    search?: string;
}