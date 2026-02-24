import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeDepenseDossier } from '@prisma/client';

export class CreateDepenseDossierDto {
    @ApiProperty({ description: 'ID du dossier' })
    @IsString()
    @IsNotEmpty()
    dossierId: string;

    @ApiProperty({ description: 'Date de la dépense' })
    @IsDateString()
    date: string;

    @ApiProperty({ description: 'Nature de la dépense' })
    @IsString()
    @IsNotEmpty()
    nature: string;

    @ApiPropertyOptional({ enum: TypeDepenseDossier, description: 'Type de dépense', default: 'AUTRES' })
    @IsOptional()
    @IsEnum(TypeDepenseDossier)
    typeDepense?: TypeDepenseDossier;

    @ApiProperty({ description: 'Montant de la dépense' })
    @IsNumber()
    @Min(0)
    montant: number;

    @ApiPropertyOptional({ description: 'Justificatif' })
    @IsOptional()
    @IsString()
    justificatif?: string;
}
