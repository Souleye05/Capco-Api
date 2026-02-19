import { ApiProperty } from '@nestjs/swagger';
import { TypeResultat } from '../../../types/prisma-enums';

export class ResultatAudienceResponseDto {
  @ApiProperty({ description: 'ID unique du résultat' })
  id: string;

  @ApiProperty({ description: 'ID de l\'audience' })
  audienceId: string;

  @ApiProperty({ enum: TypeResultat, description: 'Type de résultat' })
  type: TypeResultat;

  @ApiProperty({ description: 'Nouvelle date', required: false })
  nouvelleDate?: Date;

  @ApiProperty({ description: 'Motif du renvoi', required: false })
  motifRenvoi?: string;

  @ApiProperty({ description: 'Motif de la radiation', required: false })
  motifRadiation?: string;

  @ApiProperty({ description: 'Texte du délibéré', required: false })
  texteDelibere?: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Créé par' })
  createdBy: string;
}