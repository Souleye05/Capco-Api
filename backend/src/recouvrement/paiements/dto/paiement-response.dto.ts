import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaiementResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    dossierId: string;

    @ApiProperty()
    date: Date;

    @ApiProperty()
    montant: number;

    @ApiProperty()
    mode: string;

    @ApiPropertyOptional()
    reference?: string;

    @ApiPropertyOptional()
    commentaire?: string;

    @ApiProperty({ description: 'Référence du dossier parent' })
    dossierReference?: string;

    @ApiPropertyOptional({ description: 'Nom du créancier' })
    creancierNom?: string;

    @ApiPropertyOptional({ description: 'Nom du débiteur' })
    debiteurNom?: string;

    @ApiProperty()
    createdAt: Date;
}
