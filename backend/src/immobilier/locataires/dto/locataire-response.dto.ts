import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocataireResponseDto {
    @ApiProperty({ description: 'ID du locataire' })
    id: string;

    @ApiProperty({ description: 'Nom du locataire' })
    nom: string;

    @ApiPropertyOptional({ description: 'Téléphone' })
    telephone?: string | null;

    @ApiPropertyOptional({ description: 'Email' })
    email?: string | null;

    @ApiProperty()
    nombreLots: number;

    @ApiProperty()
    nombreBauxActifs: number;

    @ApiPropertyOptional()
    adresse?: string | null;

    @ApiPropertyOptional()
    profession?: string | null;

    @ApiPropertyOptional()
    lieuTravail?: string | null;

    @ApiPropertyOptional()
    personneContactUrgence?: string | null;

    @ApiPropertyOptional()
    telephoneUrgence?: string | null;

    @ApiPropertyOptional()
    numeroPieceIdentite?: string | null;

    @ApiPropertyOptional()
    typePieceIdentite?: string | null;

    @ApiPropertyOptional()
    nationalite?: string | null;

    @ApiPropertyOptional()
    dateNaissance?: Date | null;

    @ApiPropertyOptional()
    situationFamiliale?: string | null;

    @ApiPropertyOptional()
    notes?: string | null;

    @ApiPropertyOptional()
    pieceIdentiteUrl?: string | null;

    @ApiPropertyOptional()
    contratUrl?: string | null;

    @ApiPropertyOptional()
    documents?: any;

    @ApiPropertyOptional({ type: [Object] })
    lots?: any[];

    @ApiPropertyOptional({ type: [Object] })
    baux?: any[];

    @ApiProperty()
    createdAt: Date;
}
