import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeHonoraires } from '@prisma/client';

export class CreateHonoraireRecouvrementDto {
    @ApiProperty({ description: 'ID du dossier' })
    @IsString()
    @IsNotEmpty()
    dossierId: string;

    @ApiPropertyOptional({ enum: TypeHonoraires, description: 'Type d\'honoraire', default: 'FORFAIT' })
    @IsOptional()
    @IsEnum(TypeHonoraires)
    type?: TypeHonoraires;

    @ApiPropertyOptional({ description: 'Montant prévu' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    montantPrevu?: number;

    @ApiPropertyOptional({ description: 'Pourcentage' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    pourcentage?: number;

    @ApiPropertyOptional({ description: 'Montant payé' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    montantPaye?: number;
}
