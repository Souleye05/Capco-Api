import { IsString, IsOptional, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProprietaireDto {
    @ApiProperty({ description: 'Nom du propriétaire' })
    @IsString()
    @IsNotEmpty()
    nom: string;

    @ApiPropertyOptional({ description: 'Téléphone du propriétaire' })
    @IsOptional()
    @IsString()
    telephone?: string;

    @ApiPropertyOptional({ description: 'Email du propriétaire' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Adresse du propriétaire' })
    @IsOptional()
    @IsString()
    adresse?: string;
}
