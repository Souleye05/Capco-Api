import { IsString, IsOptional, IsNotEmpty, IsNumber, IsUUID, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeDepenseImmeuble } from '@prisma/client';

export class CreateDepenseImmeubleDto {
    @ApiProperty({ description: 'ID de l\'immeuble' })
    @IsUUID()
    @IsNotEmpty()
    immeubleId: string;

    @ApiProperty({ description: 'Date de la dépense' })
    @IsDateString()
    date: string;

    @ApiProperty({ description: 'Nature de la dépense' })
    @IsString()
    @IsNotEmpty()
    nature: string;

    @ApiPropertyOptional({ description: 'Description détaillée' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Montant de la dépense' })
    @IsNumber()
    @Min(0)
    montant: number;

    @ApiPropertyOptional({ enum: TypeDepenseImmeuble, description: 'Type de dépense', default: 'AUTRES_DEPENSES' })
    @IsOptional()
    @IsEnum(TypeDepenseImmeuble)
    typeDepense?: TypeDepenseImmeuble;

    @ApiPropertyOptional({ description: 'Justificatif' })
    @IsOptional()
    @IsString()
    justificatif?: string;
}
