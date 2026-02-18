import { IsUUID, IsOptional, IsString, IsDateString, IsDecimal, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateHonoraireDto {
  @ApiProperty({ description: 'ID de l\'affaire' })
  @IsUUID()
  @IsNotEmpty()
  affaireId: string;

  @ApiPropertyOptional({ description: 'Montant facturé', type: 'number' })
  @IsOptional()
  @Transform(({ value }) => new Decimal(value))
  @IsDecimal()
  montantFacture?: Decimal;

  @ApiPropertyOptional({ description: 'Montant encaissé', type: 'number' })
  @IsOptional()
  @Transform(({ value }) => new Decimal(value))
  @IsDecimal()
  montantEncaisse?: Decimal;

  @ApiPropertyOptional({ description: 'Date de facturation' })
  @IsOptional()
  @IsDateString()
  dateFacturation?: string;

  @ApiPropertyOptional({ description: 'Notes sur les honoraires' })
  @IsOptional()
  @IsString()
  notes?: string;
}