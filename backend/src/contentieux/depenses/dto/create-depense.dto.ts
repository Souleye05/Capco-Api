import { IsUUID, IsString, IsOptional, IsDateString, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateDepenseDto {
  @ApiProperty({ description: 'ID de l\'affaire' })
  @IsUUID()
  affaireId: string;

  @ApiPropertyOptional({ description: 'Date de la dépense' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Type de dépense' })
  @IsString()
  typeDepense: string;

  @ApiProperty({ description: 'Nature de la dépense' })
  @IsString()
  nature: string;

  @ApiPropertyOptional({ description: 'Montant de la dépense', type: 'number' })
  @IsOptional()
  @Transform(({ value }) => new Decimal(value))
  @IsDecimal()
  montant?: Decimal;

  @ApiPropertyOptional({ description: 'Description de la dépense' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Justificatif de la dépense' })
  @IsOptional()
  @IsString()
  justificatif?: string;
}