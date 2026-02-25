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

    @ApiProperty({ description: 'Nombre de lots occupés' })
    nombreLots: number;

    @ApiProperty({ description: 'Nombre de baux actifs' })
    nombreBauxActifs: number;

    @ApiPropertyOptional({ type: [Object], description: 'Lots occupés' })
    lots?: any[];

    @ApiPropertyOptional({ type: [Object], description: 'Baux actifs' })
    baux?: any[];

    @ApiProperty()
    createdAt: Date;
}
