import { IsString, IsOptional, IsNotEmpty, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRapportGestionDto {
    @ApiProperty({ description: 'ID de l\'immeuble' })
    @IsUUID()
    @IsNotEmpty()
    immeubleId: string;

    @ApiProperty({ description: 'Date de début de la période' })
    @IsDateString()
    periodeDebut: string;

    @ApiProperty({ description: 'Date de fin de la période' })
    @IsDateString()
    periodeFin: string;
}

export class UpdateRapportStatutDto {
    @ApiProperty({ description: 'Nouveau statut', enum: ['BROUILLON', 'VALIDE', 'ENVOYE'] })
    @IsString()
    @IsNotEmpty()
    statut: string;
}
