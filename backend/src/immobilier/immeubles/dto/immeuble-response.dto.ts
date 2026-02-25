import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImmeubleResponseDto {
    @ApiProperty({ description: 'ID de l\'immeuble' })
    id: string;

    @ApiProperty({ description: 'ID du propriétaire' })
    proprietaireId: string;

    @ApiProperty({ description: 'Nom de l\'immeuble' })
    nom: string;

    @ApiProperty({ description: 'Référence unique' })
    reference: string;

    @ApiProperty({ description: 'Adresse' })
    adresse: string;

    @ApiProperty({ description: 'Taux de commission CAPCO' })
    tauxCommissionCapco: number;

    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;

    @ApiProperty({ description: 'Nom du propriétaire' })
    proprietaireNom: string;

    @ApiProperty({ description: 'Nombre de lots' })
    nombreLots: number;

    @ApiProperty({ description: 'Nombre de lots occupés' })
    lotsOccupes: number;

    @ApiProperty({ description: 'Nombre de lots libres' })
    lotsLibres: number;

    @ApiPropertyOptional({ type: [Object], description: 'Liste des lots' })
    lots?: any[];

    @ApiProperty()
    createdAt: Date;
}
