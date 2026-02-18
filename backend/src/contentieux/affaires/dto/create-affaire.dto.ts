import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatutAffaire } from '@prisma/client';

export enum RolePartie {
  DEMANDEUR = 'DEMANDEUR',
  DEFENDEUR = 'DEFENDEUR',
  CONSEIL_ADVERSE = 'CONSEIL_ADVERSE'
}

class PartieDto {
  @ApiProperty({ description: 'Nom de la partie' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ enum: RolePartie, description: 'Rôle de la partie', default: RolePartie.DEMANDEUR })
  @IsOptional()
  @IsEnum(RolePartie)
  role?: RolePartie;

  @ApiPropertyOptional({ description: 'Adresse de la partie' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ description: 'Téléphone de la partie' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ description: 'Email de la partie' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateAffaireDto {
  @ApiProperty({ description: 'Titre/Intitulé de l\'affaire (ex: X c/ Y - expulsion)' })
  @IsString()
  @IsNotEmpty()
  intitule: string;

  @ApiProperty({ description: 'Demandeurs', type: [PartieDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartieDto)
  demandeurs: PartieDto[];

  @ApiProperty({ description: 'Défendeurs', type: [PartieDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartieDto)
  defendeurs: PartieDto[];

  @ApiPropertyOptional({ enum: StatutAffaire, description: 'Statut de l\'affaire', default: StatutAffaire.ACTIVE })
  @IsOptional()
  @IsEnum(StatutAffaire)
  statut?: StatutAffaire;

  @ApiPropertyOptional({ description: 'Observations/Notes sur l\'affaire' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export { PartieDto };