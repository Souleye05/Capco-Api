import { IsString, IsOptional, IsEnum, IsNotEmpty, IsNumber, Min, Max, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatutClientConseil, TypePartie } from '@prisma/client';

export class CreateClientConseilDto {
  @ApiProperty({ description: 'Nom du client conseil' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ 
    enum: TypePartie, 
    description: 'Type de partie (physique ou morale)', 
    default: TypePartie.morale 
  })
  @IsOptional()
  @IsEnum(TypePartie)
  type?: TypePartie;

  @ApiPropertyOptional({ description: 'Numéro de téléphone' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ description: 'Adresse email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Adresse postale' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ 
    description: 'Honoraire mensuel en FCFA', 
    default: 0,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  honoraireMensuel?: number;

  @ApiPropertyOptional({ 
    description: 'Jour de facturation (1-31)', 
    default: 1,
    minimum: 1,
    maximum: 31
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(31)
  jourFacturation?: number;

  @ApiPropertyOptional({ 
    enum: StatutClientConseil, 
    description: 'Statut du client', 
    default: StatutClientConseil.ACTIF 
  })
  @IsOptional()
  @IsEnum(StatutClientConseil)
  statut?: StatutClientConseil;

  @ApiPropertyOptional({ description: 'Notes ou observations' })
  @IsOptional()
  @IsString()
  notes?: string;
}