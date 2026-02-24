import { IsString, IsOptional, IsEnum, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeAction } from '@prisma/client';

export class CreateActionDto {
    @ApiProperty({ description: 'ID du dossier' })
    @IsString()
    @IsNotEmpty()
    dossierId: string;

    @ApiProperty({ description: 'Date de l\'action' })
    @IsDateString()
    date: string;

    @ApiProperty({ enum: TypeAction, description: 'Type d\'action' })
    @IsEnum(TypeAction)
    typeAction: TypeAction;

    @ApiProperty({ description: 'Résumé de l\'action' })
    @IsString()
    @IsNotEmpty()
    resume: string;

    @ApiPropertyOptional({ description: 'Prochaine étape prévue' })
    @IsOptional()
    @IsString()
    prochaineEtape?: string;

    @ApiPropertyOptional({ description: 'Échéance de la prochaine étape' })
    @IsOptional()
    @IsDateString()
    echeanceProchaineEtape?: string;

    @ApiPropertyOptional({ description: 'Pièce jointe' })
    @IsOptional()
    @IsString()
    pieceJointe?: string;
}
