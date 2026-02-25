import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ProprietairesQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Rechercher par nom' })
    @IsOptional()
    @IsString()
    nom?: string;
}
