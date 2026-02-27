import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeTache } from './create-tache-conseil.dto';

export class TacheConseilResponseDto {
  @ApiProperty({ description: 'Identifiant unique de la tâche' })
  id: string;

  @ApiProperty({ description: 'ID du client conseil associé' })
  clientId: string;

  @ApiProperty({ description: 'Date de la tâche' })
  date: Date;

  @ApiProperty({ enum: TypeTache, description: 'Type de tâche effectuée' })
  type: TypeTache;

  @ApiProperty({ description: 'Description détaillée de la tâche' })
  description: string;

  @ApiPropertyOptional({ description: 'Durée en minutes' })
  dureeMinutes?: number;

  @ApiProperty({ description: 'Mois concerné par la tâche' })
  moisConcerne: string;

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
}