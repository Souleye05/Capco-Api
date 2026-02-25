import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProprietaireResponseDto {
    @ApiProperty({ description: 'ID du propriétaire' })
    id: string;

    @ApiProperty({ description: 'Nom du propriétaire' })
    nom: string;

    @ApiPropertyOptional({ description: 'Téléphone' })
    telephone?: string;

    @ApiPropertyOptional({ description: 'Email' })
    email?: string;

    @ApiPropertyOptional({ description: 'Adresse' })
    adresse?: string;

    @ApiProperty({ description: 'Nombre d\'immeubles' })
    nombreImmeubles: number;

    @ApiPropertyOptional({ type: [Object], description: 'Liste des immeubles' })
    immeubles?: any[];

    @ApiProperty()
    createdAt: Date;
}
