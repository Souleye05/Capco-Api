import { IsString, IsOptional, IsNotEmpty, IsNumber, IsUUID, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModePaiement } from '@prisma/client';

export class CreateEncaissementDto {
    @ApiProperty({ description: 'ID du lot' })
    @IsUUID()
    @IsNotEmpty()
    lotId: string;

    @ApiProperty({ description: 'Mois concerné (format YYYY-MM)' })
    @IsString()
    @IsNotEmpty()
    moisConcerne: string;

    @ApiProperty({ description: 'Date de l\'encaissement' })
    @IsDateString()
    dateEncaissement: string;

    @ApiProperty({ description: 'Montant encaissé' })
    @IsNumber()
    @Min(0)
    montantEncaisse: number;

    @ApiProperty({ enum: ModePaiement, description: 'Mode de paiement' })
    @IsEnum(ModePaiement)
    modePaiement: ModePaiement;

    @ApiPropertyOptional({ description: 'Observation' })
    @IsOptional()
    @IsString()
    observation?: string;
}
