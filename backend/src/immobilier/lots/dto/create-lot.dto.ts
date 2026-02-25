import { IsString, IsOptional, IsNotEmpty, IsNumber, IsUUID, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeLot, StatutLot } from '@prisma/client';

export class CreateLotDto {
    @ApiProperty({ description: 'ID de l\'immeuble' })
    @IsUUID()
    @IsNotEmpty()
    immeubleId: string;

    @ApiProperty({ description: 'Numéro du lot' })
    @IsString()
    @IsNotEmpty()
    numero: string;

    @ApiPropertyOptional({ description: 'Étage' })
    @IsOptional()
    @IsString()
    etage?: string;

    @ApiPropertyOptional({ enum: TypeLot, description: 'Type de lot', default: 'AUTRE' })
    @IsOptional()
    @IsEnum(TypeLot)
    type?: TypeLot;

    @ApiPropertyOptional({ description: 'Loyer mensuel attendu' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    loyerMensuelAttendu?: number;

    @ApiPropertyOptional({ enum: StatutLot, description: 'Statut du lot', default: 'LIBRE' })
    @IsOptional()
    @IsEnum(StatutLot)
    statut?: StatutLot;

    @ApiPropertyOptional({ description: 'ID du locataire actuel' })
    @IsOptional()
    @IsUUID()
    locataireId?: string;
}
