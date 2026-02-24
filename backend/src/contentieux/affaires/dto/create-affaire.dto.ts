import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatutAffaire, RolePartie, NatureAffaire } from '@prisma/client';

export class PartieDto {
  @ApiProperty({ description: 'Nom de la partie' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ enum: RolePartie, description: 'Rôle de la partie', default: RolePartie.DEMANDEUR })
  @IsOptional()
  @IsEnum(RolePartie)
  role?: RolePartie;

  @ApiPropertyOptional({ description: 'Téléphone de la partie' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ description: 'Adresse de la partie' })
  @IsOptional()
  @IsString()
  adresse?: string;
}

export class HonoraireInitialDto {
  @ApiProperty({ description: 'Montant facturé' })
  @IsNumber()
  @Min(0)
  montantFacture: number;

  @ApiPropertyOptional({ description: 'Montant encaissé' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montantEncaisse?: number;

  @ApiPropertyOptional({ description: 'Date de facturation (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateFacturation?: string;

  @ApiPropertyOptional({ description: 'Notes sur l\'honoraire' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAffaireDto {
  @ApiProperty({ description: 'Titre/Intitulé de l\'affaire (ex: X c/ Y - expulsion)' })
  @IsString()
  @IsNotEmpty()
  intitule: string;

  @ApiPropertyOptional({ enum: NatureAffaire, description: 'Nature de l\'affaire', default: NatureAffaire.CIVILE })
  @IsOptional()
  @IsEnum(NatureAffaire)
  nature?: NatureAffaire;

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

  @ApiPropertyOptional({ description: 'Honoraire initial à créer avec l\'affaire', type: HonoraireInitialDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HonoraireInitialDto)
  honoraire?: HonoraireInitialDto;
}