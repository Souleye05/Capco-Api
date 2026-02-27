import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TypeLot, StatutLot } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class LotsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    immeubleId?: string;

    @IsOptional()
    @IsEnum(TypeLot)
    type?: TypeLot;

    @IsOptional()
    @IsEnum(StatutLot)
    statut?: StatutLot;
}
