import { IsOptional, IsString } from 'class-validator';

export class LotsStatisticsQueryDto {
    @IsOptional()
    @IsString()
    immeubleId?: string;
}
