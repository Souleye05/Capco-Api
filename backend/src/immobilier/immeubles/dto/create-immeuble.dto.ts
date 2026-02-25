import { IsString, IsOptional, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateImmeubleDto {
    @ApiProperty({ description: 'ID du propriétaire' })
    @IsUUID()
    @IsNotEmpty()
    proprietaireId: string;

    @ApiProperty({ description: 'Nom de l\'immeuble' })
    @IsString()
    @IsNotEmpty()
    nom: string;

    @ApiProperty({ description: 'Adresse de l\'immeuble' })
    @IsString()
    @IsNotEmpty()
    adresse: string;

    @ApiProperty({ description: 'Taux de commission CAPCO (en %)' })
    @IsNumber()
    @Min(0)
    tauxCommissionCapco: number;

    @ApiPropertyOptional({ description: 'Notes sur l\'immeuble' })
    @IsOptional()
    @IsString()
    notes?: string;
}
