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

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    adresse?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    profession?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lieuTravail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    personneContactUrgence?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    telephoneUrgence?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    numeroPieceIdentite?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    typePieceIdentite?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nationalite?: string;

    @ApiPropertyOptional()
    @IsOptional()
    dateNaissance?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    situationFamiliale?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    pieceIdentiteUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    contratUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    documents?: any;
}
