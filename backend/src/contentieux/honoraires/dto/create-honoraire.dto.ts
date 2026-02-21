import { IsUUID, IsOptional, IsString, IsDateString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateHonoraireDto {
  @ApiProperty({ description: 'ID de l\'affaire' })
  @IsUUID()
  @IsNotEmpty()
  affaireId: string;

  @ApiPropertyOptional({ description: 'Montant facturé', type: 'number', example: 1500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le montant facturé doit être un nombre' })
  montantFacture?: number;

  @ApiPropertyOptional({ description: 'Montant encaissé', type: 'number', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le montant encaissé doit être un nombre' })
  montantEncaisse?: number;

  @ApiPropertyOptional({ description: 'Date de facturation (YYYY-MM-DD)', example: '2026-02-20' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de facturation doit être au format YYYY-MM-DD' })
  dateFacturation?: string;

  @ApiPropertyOptional({ description: 'Notes sur les honoraires', example: 'Honoraires de plaidoirie' })
  @IsOptional()
  @IsString()
  notes?: string;
}