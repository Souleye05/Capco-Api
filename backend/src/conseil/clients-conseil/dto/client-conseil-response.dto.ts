import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutClientConseil, TypePartie } from '@prisma/client';

export class ClientConseilResponseDto {
  @ApiProperty({ description: 'Identifiant unique du client' })
  id: string;

  @ApiProperty({ description: 'Référence générée automatiquement' })
  reference: string;

  @ApiProperty({ description: 'Nom du client conseil' })
  nom: string;

  @ApiProperty({ enum: TypePartie, description: 'Type de partie (physique ou morale)' })
  type: TypePartie;

  @ApiPropertyOptional({ description: 'Numéro de téléphone' })
  telephone?: string;

  @ApiPropertyOptional({ description: 'Adresse email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Adresse postale' })
  adresse?: string;

  @ApiProperty({ description: 'Honoraire mensuel en FCFA' })
  honoraireMensuel: number;

  @ApiProperty({ description: 'Jour de facturation (1-31)' })
  jourFacturation: number;

  @ApiProperty({ enum: StatutClientConseil, description: 'Statut du client' })
  statut: StatutClientConseil;

  @ApiPropertyOptional({ description: 'Notes ou observations' })
  notes?: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updatedAt: Date;

  @ApiProperty({ description: 'Utilisateur créateur' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Nombre de tâches associées' })
  _count?: {
    tachesConseils: number;
    facturesConseils: number;
  };
}