import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { StatutRecouvrement } from '@prisma/client';

export class DossiersQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ enum: StatutRecouvrement, description: 'Filtrer par statut' })
    @IsOptional()
    @IsEnum(StatutRecouvrement)
    statut?: StatutRecouvrement;
}
