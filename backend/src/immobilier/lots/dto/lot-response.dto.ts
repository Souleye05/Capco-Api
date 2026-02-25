import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeLot, StatutLot } from '@prisma/client';

export class LotResponseDto {
    @ApiProperty({ description: 'ID du lot' })
    id: string;

    @ApiProperty({ description: 'ID de l\'immeuble' })
    immeubleId: string;

    @ApiProperty({ description: 'Numéro du lot' })
    numero: string;

    @ApiPropertyOptional({ description: 'Étage' })
    etage?: string;

    @ApiProperty({ enum: TypeLot, description: 'Type de lot' })
    type: TypeLot;

    @ApiProperty({ description: 'Loyer mensuel attendu' })
    loyerMensuelAttendu: number;

    @ApiProperty({ enum: StatutLot, description: 'Statut du lot' })
    statut: StatutLot;

    @ApiPropertyOptional({ description: 'ID du locataire' })
    locataireId?: string;

    @ApiPropertyOptional({ description: 'Nom du locataire' })
    locataireNom?: string;

    @ApiProperty({ description: 'Nom de l\'immeuble' })
    immeubleNom: string;

    @ApiProperty({ description: 'Référence de l\'immeuble' })
    immeubleReference: string;

    @ApiProperty()
    createdAt: Date;
}
