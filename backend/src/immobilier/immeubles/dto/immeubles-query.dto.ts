import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ImmeublesQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Filtrer par propriétaire' })
    @IsOptional()
    @IsUUID()
    proprietaireId?: string;
}
