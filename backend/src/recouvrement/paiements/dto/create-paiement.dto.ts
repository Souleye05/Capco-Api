import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModePaiement } from '@prisma/client';

export class CreatePaiementDto {
    @ApiProperty({ description: 'ID du dossier' })
    @IsString()
    @IsNotEmpty()
    dossierId: string;

    @ApiProperty({ description: 'Date du paiement' })
    @IsDateString()
    date: string;

    @ApiProperty({ description: 'Montant du paiement' })
    @IsNumber()
    @Min(0)
    montant: number;

    @ApiProperty({ enum: ModePaiement, description: 'Mode de paiement' })
    @IsEnum(ModePaiement)
    mode: ModePaiement;

    @ApiPropertyOptional({ description: 'Référence du paiement' })
    @IsOptional()
    @IsString()
    reference?: string;

    @ApiPropertyOptional({ description: 'Commentaire' })
    @IsOptional()
    @IsString()
    commentaire?: string;
}
