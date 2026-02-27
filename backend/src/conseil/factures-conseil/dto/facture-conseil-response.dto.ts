import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutFacture } from './create-facture-conseil.dto';

export class FactureConseilResponseDto {
  @ApiProperty({ description: 'Identifiant unique de la facture' })
  id: string;

  @ApiProperty({ description: 'ID du client conseil associé' })
  clientId: string;

  @ApiProperty({ description: 'Référence générée automatiquement' })
  reference: string;

  @ApiProperty({ description: 'Mois concerné par la facture' })
  moisConcerne: string;

  @ApiProperty({ description: 'Montant hors taxes en FCFA' })
  montantHt: number;

  @ApiProperty({ description: 'Montant de la TVA en FCFA' })
  tva: number;

  @ApiProperty({ description: 'Montant toutes taxes comprises en FCFA' })
  montantTtc: number;

  @ApiProperty({ description: 'Date d\'émission de la facture' })
  dateEmission: Date;

  @ApiProperty({ description: 'Date d\'échéance de la facture' })
  dateEcheance: Date;

  @ApiProperty({ enum: StatutFacture, description: 'Statut de la facture' })
  statut: StatutFacture;

  @ApiPropertyOptional({ description: 'Notes ou observations sur la facture' })
  notes?: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Utilisateur créateur' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Informations du client associé' })
  clientsConseil?: {
    id: string;
    reference: string;
    nom: string;
  };

  @ApiPropertyOptional({ description: 'Nombre de paiements associés' })
  _count?: {
    paiementsConseils: number;
  };
}