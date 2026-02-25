import { ApiProperty } from '@nestjs/swagger';
import { StatutRecouvrement } from '@prisma/client';

export class DossierResponseDto {
    @ApiProperty({ description: 'ID du dossier' })
    id: string;

    @ApiProperty({ description: 'Référence du dossier' })
    reference: string;

    @ApiProperty({ description: 'Nom du créancier' })
    creancierNom: string;

    @ApiProperty({ required: false })
    creancierTelephone?: string;

    @ApiProperty({ required: false })
    creancierEmail?: string;

    @ApiProperty({ description: 'Nom du débiteur' })
    debiteurNom: string;

    @ApiProperty({ required: false })
    debiteurTelephone?: string;

    @ApiProperty({ required: false })
    debiteurEmail?: string;

    @ApiProperty({ required: false })
    debiteurAdresse?: string;

    @ApiProperty({ description: 'Montant principal de la créance' })
    montantPrincipal: number;

    @ApiProperty({ description: 'Pénalités et intérêts' })
    penalitesInterets: number;

    @ApiProperty({ description: 'Total à recouvrer' })
    totalARecouvrer: number;

    @ApiProperty({ description: 'Total des paiements reçus' })
    totalPaiements: number;

    @ApiProperty({ description: 'Solde restant à recouvrer' })
    soldeRestant: number;

    @ApiProperty({ enum: StatutRecouvrement })
    statut: StatutRecouvrement;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty({ description: 'Nombre d\'actions' })
    nombreActions: number;

    @ApiProperty({ description: 'Dernière action effectuée', required: false })
    derniereAction?: {
        id: string;
        date: Date;
        typeAction: string;
        resume: string;
    };

    @ApiProperty({ type: [Object], required: false })
    actions?: any[];

    @ApiProperty({ type: [Object], required: false })
    paiements?: any[];

    @ApiProperty({ type: [Object], required: false })
    depenses?: any[];

    @ApiProperty({ type: [Object], required: false })
    honoraires?: any[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
