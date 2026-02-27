import { IsString, IsOptional, IsEnum, IsNotEmpty, IsNumber, Min, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ModePaiement {
  CASH = 'CASH',
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
  WAVE = 'WAVE',
  OM = 'OM',
}

export class CreatePaiementConseilDto {
  @ApiProperty({ description: 'ID de la facture conseil associée' })
  @IsUUID()
  @IsNotEmpty()
  factureId: string;

  @ApiProperty({ 
    description: 'Date du paiement (format YYYY-MM-DD)',
    example: '2024-01-15'
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ 
    description: 'Montant du paiement en FCFA', 
    minimum: 0 
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montant: number;

  @ApiProperty({ 
    enum: ModePaiement, 
    description: 'Mode de paiement utilisé' 
  })
  @IsEnum(ModePaiement)
  @IsNotEmpty()
  mode: ModePaiement;

  @ApiPropertyOptional({ description: 'Référence du paiement (numéro de chèque, référence virement, etc.)' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Commentaire sur le paiement' })
  @IsOptional()
  @IsString()
  commentaire?: string;
}