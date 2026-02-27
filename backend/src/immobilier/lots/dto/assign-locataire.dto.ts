import { IsUUID, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignLocataireDto {
    @ApiProperty({ description: 'ID du locataire à assigner' })
    @IsUUID()
    @IsNotEmpty()
    locataireId: string;

    @ApiPropertyOptional({ description: 'Montant du loyer mensuel' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    montantLoyer?: number;

    @ApiPropertyOptional({ description: 'Date de début du bail' })
    @IsOptional()
    @IsDateString()
    dateDebutBail?: string;

    @ApiPropertyOptional({ description: 'Date de fin du bail' })
    @IsOptional()
    @IsDateString()
    dateFinBail?: string;

    @ApiPropertyOptional({ description: 'Jour de paiement prévu (1-31)', default: 5 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    jourPaiementPrevu?: number;
}