import { ApiProperty } from '@nestjs/swagger';

export class JuridictionResponseDto {
  @ApiProperty({ description: 'ID unique de la juridiction' })
  id: string;

  @ApiProperty({ description: 'Nom de la juridiction' })
  nom: string;

  @ApiProperty({ description: 'Code court de la juridiction', required: false })
  code?: string;

  @ApiProperty({ description: 'Description de la juridiction', required: false })
  description?: string;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  ordre: number;

  @ApiProperty({ description: 'Juridiction active' })
  estActif: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;
}