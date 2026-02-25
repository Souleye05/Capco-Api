import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocataireResponseDto {
    @ApiProperty({ description: 'ID du locataire' })
    id: string;

    @ApiProperty({ description: 'Nom du locataire' })
    nom: string;

    @ApiPropertyOptional({ description: 'Téléphone' })
    telephone?: string;

    @ApiPropertyOptional({ description: 'Email' })
    email?: string;

    @ApiProperty()
    nombreLots: number;

    @ApiProperty()
    nombreBauxActifs: number;

    @ApiPropertyOptional()
    adresse?: string;

    @ApiPropertyOptional()
    profession?: string;

    @ApiPropertyOptional()
    lieuTravail?: string;

    @ApiPropertyOptional()
    personneContactUrgence?: string;

    @ApiPropertyOptional()
    telephoneUrgence?: string;

    @ApiPropertyOptional()
    numeroPieceIdentite?: string;

    @ApiPropertyOptional()
    typePieceIdentite?: string;

    @ApiPropertyOptional()
    nationalite?: string;

    @ApiPropertyOptional()
    dateNaissance?: Date;

    @ApiPropertyOptional()
    situationFamiliale?: string;

    @ApiPropertyOptional()
    notes?: string;

    @ApiPropertyOptional()
    pieceIdentiteUrl?: string;

    @ApiPropertyOptional()
    contratUrl?: string;

    @ApiPropertyOptional()
    documents?: any;

    @ApiPropertyOptional({ type: [Object] })
    lots?: any[];

    @ApiPropertyOptional({ type: [Object] })
    baux?: any[];

    @ApiProperty()
    createdAt: Date;
}
