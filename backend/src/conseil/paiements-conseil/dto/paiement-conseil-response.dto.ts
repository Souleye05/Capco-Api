import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModePaiement } from './create-paiement-conseil.dto';

export class PaiementConseilResponseDto {
  @ApiProperty({ description: 'Identifiant unique du paiement' })
  id: string;

  @ApiProperty({ description: 'ID de la facture conseil associée' })
  factureId: string;

  @ApiProperty({ description: 'Date du paiement' })
  date: Date;

  @ApiProperty({ description: 'Montant du paiement en FCFA' })
  montant: number;

  @ApiProperty({ enum: ModePaiement, description: 'Mode de paiement utilisé' })
  mode: ModePaiement;

  @ApiPropertyOptional({ description: 'Référence du paiement' })
  reference?: string;

  @ApiPropertyOptional({ description: 'Commentaire sur le paiement' })
  commentaire?: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Utilisateur créateur' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Informations de la facture associée' })
  facturesConseil?: {
    id: string;
    reference: string;
    moisConcerne: string;
    montantTtc: number;
    clientsConseil: {
      id: string;
      reference: string;
      nom: string;
    };
  };
}