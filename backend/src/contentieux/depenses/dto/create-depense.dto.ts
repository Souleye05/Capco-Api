import { IsUUID, IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDepenseDto {
  @ApiProperty({ description: 'ID de l\'affaire' })
  @IsUUID()
  affaireId: string;

  @ApiPropertyOptional({ description: 'Date de la dépense (YYYY-MM-DD)', example: '2026-02-20' })
  @IsOptional()
  @IsDateString({}, { message: 'La date doit être au format YYYY-MM-DD' })
  date?: string;

  @ApiProperty({ description: 'Type de dépense', example: 'FRAIS_JUSTICE' })
  @IsString()
  typeDepense: string;

  @ApiProperty({ description: 'Nature de la dépense', example: 'Huissier' })
  @IsString()
  nature: string;

  @ApiPropertyOptional({ description: 'Montant de la dépense', type: 'number', example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le montant doit être un nombre' })
  montant?: number;

  @ApiPropertyOptional({ description: 'Description de la dépense', example: 'Signification assignation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Justificatif de la dépense', example: 'Facture huissier n°123' })
  @IsOptional()
  @IsString()
  justificatif?: string;
}