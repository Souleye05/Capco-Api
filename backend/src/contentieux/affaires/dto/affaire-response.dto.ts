import { ApiProperty } from '@nestjs/swagger';
import { StatutAffaire } from '@prisma/client';
import { PartieDto } from './create-affaire.dto';

class DerniereAudienceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  type: string;

  @ApiProperty()
  juridiction: string;

  @ApiProperty()
  chambre: string;

  @ApiProperty({ required: false })
  ville?: string;

  @ApiProperty()
  statut: string;
}

export class AffaireResponseDto {
  @ApiProperty({ description: 'ID unique de l\'affaire' })
  id: string;

  @ApiProperty({ description: 'Référence de l\'affaire (ex: AFF-2026-0001)' })
  reference: string;

  @ApiProperty({ description: 'Titre/Intitulé de l\'affaire' })
  intitule: string;

  @ApiProperty({ description: 'Demandeurs', type: [PartieDto] })
  demandeurs: PartieDto[];

  @ApiProperty({ description: 'Défendeurs', type: [PartieDto] })
  defendeurs: PartieDto[];

  @ApiProperty({ enum: StatutAffaire, description: 'Statut de l\'affaire' })
  statut: StatutAffaire;

  @ApiProperty({ description: 'Observations/Notes', required: false })
  observations?: string;

  @ApiProperty({ description: 'Dernière audience', required: false })
  derniereAudience?: DerniereAudienceDto;

  @ApiProperty({ description: 'Total des honoraires' })
  totalHonoraires: number;

  @ApiProperty({ description: 'Total des dépenses' })
  totalDepenses: number;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;
}