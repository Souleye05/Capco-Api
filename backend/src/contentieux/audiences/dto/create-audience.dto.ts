import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeAudience, StatutAudience } from '../../../types/prisma-enums';

export class CreateAudienceDto {
  @ApiProperty({ description: 'ID de l\'affaire' })
  @IsUUID()
  @IsNotEmpty()
  affaireId: string;

  @ApiProperty({ description: 'Date de l\'audience' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Heure de l\'audience (ex: 14:30)' })
  @IsOptional()
  @IsString()
  heure?: string;

  @ApiPropertyOptional({ enum: TypeAudience, description: 'Type/Objet de l\'audience', default: TypeAudience.MISE_EN_ETAT })
  @IsOptional()
  @IsEnum(TypeAudience)
  type?: TypeAudience;

  @ApiProperty({ description: 'Juridiction de l\'audience (obligatoire)' })
  @IsString()
  @IsNotEmpty()
  juridiction: string;

  @ApiPropertyOptional({ description: 'Chambre de l\'audience (optionnel)' })
  @IsOptional()
  @IsString()
  chambre?: string;

  @ApiPropertyOptional({ description: 'Ville de l\'audience (optionnel)' })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ enum: StatutAudience, description: 'Statut de l\'audience', default: StatutAudience.A_VENIR })
  @IsOptional()
  @IsEnum(StatutAudience)
  statut?: StatutAudience;

  @ApiPropertyOptional({ description: 'Notes de préparation' })
  @IsOptional()
  @IsString()
  notesPreparation?: string;

  @ApiPropertyOptional({ description: 'Audience préparée', default: false })
  @IsOptional()
  @IsBoolean()
  estPreparee?: boolean;

  @ApiPropertyOptional({ description: 'Rappel d\'enrôlement activé', default: false })
  @IsOptional()
  @IsBoolean()
  rappelEnrolement?: boolean;
}