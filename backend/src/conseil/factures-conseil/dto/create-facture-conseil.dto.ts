import { IsString, IsOptional, IsEnum, IsNotEmpty, IsNumber, Min, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum StatutFacture {
  BROUILLON = 'BROUILLON',
  ENVOYEE = 'ENVOYEE',
  PAYEE = 'PAYEE',
  EN_RETARD = 'EN_RETARD',
  ANNULEE = 'ANNULEE',
}

export class CreateFactureConseilDto {
  @ApiProperty({ description: 'ID du client conseil associé' })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ 
    description: 'Mois concerné par la facture (format YYYY-MM)',
    example: '2024-01'
  })
  @IsString()
  @IsNotEmpty()
  moisConcerne: string;

  @ApiProperty({ 
    description: 'Montant hors taxes en FCFA', 
    minimum: 0 
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montantHt: number;

  @ApiPropertyOptional({ 
    description: 'Montant de la TVA en FCFA', 
    default: 0,
    minimum: 0 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tva?: number;

  @ApiProperty({ 
    description: 'Montant toutes taxes comprises en FCFA', 
    minimum: 0 
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montantTtc: number;

  @ApiProperty({ 
    description: 'Date d\'émission de la facture (format YYYY-MM-DD)',
    example: '2024-01-15'
  })
  @IsDateString()
  @IsNotEmpty()
  dateEmission: string;

  @ApiProperty({ 
    description: 'Date d\'échéance de la facture (format YYYY-MM-DD)',
    example: '2024-02-15'
  })
  @IsDateString()
  @IsNotEmpty()
  dateEcheance: string;

  @ApiPropertyOptional({ 
    enum: StatutFacture, 
    description: 'Statut de la facture', 
    default: StatutFacture.BROUILLON 
  })
  @IsOptional()
  @IsEnum(StatutFacture)
  statut?: StatutFacture;

  @ApiPropertyOptional({ description: 'Notes ou observations sur la facture' })
  @IsOptional()
  @IsString()
  notes?: string;
}