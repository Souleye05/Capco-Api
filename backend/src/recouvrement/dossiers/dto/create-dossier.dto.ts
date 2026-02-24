import { IsString, IsOptional, IsEnum, IsNotEmpty, IsNumber, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatutRecouvrement } from '@prisma/client';

export class HonoraireRecouvrementInitialDto {
    @ApiPropertyOptional({ description: 'Type d\'honoraire', enum: ['FORFAIT', 'POURCENTAGE', 'MIXTE'], default: 'FORFAIT' })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional({ description: 'Montant prévu' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    montantPrevu?: number;

    @ApiPropertyOptional({ description: 'Pourcentage (si type POURCENTAGE ou MIXTE)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    pourcentage?: number;
}

export class CreateDossierDto {
    @ApiProperty({ description: 'Nom du créancier' })
    @IsString()
    @IsNotEmpty()
    creancierNom: string;

    @ApiPropertyOptional({ description: 'Téléphone du créancier' })
    @IsOptional()
    @IsString()
    creancierTelephone?: string;

    @ApiPropertyOptional({ description: 'Email du créancier' })
    @IsOptional()
    @IsString()
    creancierEmail?: string;

    @ApiProperty({ description: 'Nom du débiteur' })
    @IsString()
    @IsNotEmpty()
    debiteurNom: string;

    @ApiPropertyOptional({ description: 'Téléphone du débiteur' })
    @IsOptional()
    @IsString()
    debiteurTelephone?: string;

    @ApiPropertyOptional({ description: 'Email du débiteur' })
    @IsOptional()
    @IsString()
    debiteurEmail?: string;

    @ApiPropertyOptional({ description: 'Adresse du débiteur' })
    @IsOptional()
    @IsString()
    debiteurAdresse?: string;

    @ApiProperty({ description: 'Montant principal de la créance' })
    @IsNumber()
    @Min(0)
    montantPrincipal: number;

    @ApiPropertyOptional({ description: 'Pénalités et intérêts' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    penalitesInterets?: number;

    @ApiPropertyOptional({ enum: StatutRecouvrement, description: 'Statut du dossier', default: 'EN_COURS' })
    @IsOptional()
    @IsEnum(StatutRecouvrement)
    statut?: StatutRecouvrement;

    @ApiPropertyOptional({ description: 'Notes sur le dossier' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Honoraire initial à créer avec le dossier', type: HonoraireRecouvrementInitialDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => HonoraireRecouvrementInitialDto)
    honoraire?: HonoraireRecouvrementInitialDto;
}
