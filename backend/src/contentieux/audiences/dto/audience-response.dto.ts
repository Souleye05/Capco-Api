import { ApiProperty } from '@nestjs/swagger';
import { TypeAudience, StatutAudience } from '@prisma/client';

class AffaireSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  intitule: string;

  @ApiProperty()
  parties: Array<{
    id: string;
    nom: string;
    role: string;
  }>;
}

class ResultatAudienceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  nouvelleDate?: Date;

  @ApiProperty({ required: false })
  motifRenvoi?: string;

  @ApiProperty({ required: false })
  motifRadiation?: string;

  @ApiProperty({ required: false })
  texteDelibere?: string;
}

export class AudienceResponseDto {
  @ApiProperty({ description: 'ID unique de l\'audience' })
  id: string;

  @ApiProperty({ description: 'ID de l\'affaire' })
  affaireId: string;

  @ApiProperty({ description: 'Informations de l\'affaire' })
  affaire: AffaireSummaryDto;

  @ApiProperty({ description: 'Date de l\'audience' })
  date: Date;

  @ApiProperty({ description: 'Heure de l\'audience', required: false })
  heure?: string;

  @ApiProperty({ enum: TypeAudience, description: 'Type de l\'audience' })
  type: TypeAudience;

  @ApiProperty({ description: 'Juridiction', required: false })
  juridiction?: string;

  @ApiProperty({ description: 'Chambre', required: false })
  chambre?: string;

  @ApiProperty({ description: 'Ville', required: false })
  ville?: string;

  @ApiProperty({ enum: StatutAudience, description: 'Statut de l\'audience' })
  statut: StatutAudience;

  @ApiProperty({ description: 'Notes de préparation', required: false })
  notesPreparation?: string;

  @ApiProperty({ description: 'Audience préparée' })
  estPreparee: boolean;

  @ApiProperty({ description: 'Rappel d\'enrôlement activé' })
  rappelEnrolement: boolean;

  @ApiProperty({ description: 'Date de rappel d\'enrôlement', required: false })
  dateRappelEnrolement?: Date;

  @ApiProperty({ description: 'Enrôlement effectué' })
  enrolementEffectue: boolean;

  @ApiProperty({ description: 'Résultat de l\'audience', required: false })
  resultat?: ResultatAudienceDto;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour', required: false })
  updatedAt?: Date;
}