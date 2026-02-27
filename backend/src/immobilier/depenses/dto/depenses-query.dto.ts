import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TypeDepenseImmeuble } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class DepensesQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    immeubleId?: string;

    @IsOptional()
    @IsEnum(TypeDepenseImmeuble)
    typeDepense?: TypeDepenseImmeuble;
}
