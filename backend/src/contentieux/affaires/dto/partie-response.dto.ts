import { ApiProperty } from '@nestjs/swagger';
import { RolePartie } from '../../../types/prisma-enums';

export class PartieResponseDto {
  @ApiProperty({ description: 'ID unique de la partie' })
  id: string;

  @ApiProperty({ description: 'Nom de la partie' })
  nom: string;

  @ApiProperty({ enum: RolePartie, description: 'Rôle de la partie' })
  role: RolePartie;

  @ApiProperty({ description: 'ID de l\'affaire' })
  affaireId: string;
}