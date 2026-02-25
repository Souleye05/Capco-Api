import { IsString, IsOptional, IsNotEmpty, IsNumber, IsUUID, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutBail } from '@prisma/client';

export class CreateBailDto {
    @ApiProperty({ description: 'ID du lot' })
    @IsUUID()
    @IsNotEmpty()
    lotId: string;

    @ApiProperty({ description: 'ID du locataire' })
    @IsUUID()
    @IsNotEmpty()
    locataireId: string;

    @ApiProperty({ description: 'Date de début du bail' })
    @IsDateString()
    dateDebut: string;

    @ApiPropertyOptional({ description: 'Date de fin du bail' })
    @IsOptional()
    @IsDateString()
    dateFin?: string;

    @ApiProperty({ description: 'Montant du loyer mensuel' })
    @IsNumber()
    @Min(0)
    montantLoyer: number;

    @ApiPropertyOptional({ description: 'Jour de paiement prévu (1-31)', default: 5 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(31)
    jourPaiementPrevu?: number;

    @ApiPropertyOptional({ enum: StatutBail, description: 'Statut du bail', default: 'ACTIF' })
    @IsOptional()
    @IsEnum(StatutBail)
    statut?: StatutBail;
}
