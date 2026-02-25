import { IsString, IsOptional, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocataireDto {
    @ApiProperty({ description: 'Nom du locataire' })
    @IsString()
    @IsNotEmpty()
    nom: string;

    @ApiPropertyOptional({ description: 'Téléphone du locataire' })
    @IsOptional()
    @IsString()
    telephone?: string;

    @ApiPropertyOptional({ description: 'Email du locataire' })
    @IsOptional()
    @IsEmail()
    email?: string;
}
