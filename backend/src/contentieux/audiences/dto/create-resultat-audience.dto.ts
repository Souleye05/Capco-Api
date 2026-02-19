import { IsUUID, IsEnum, IsOptional, IsDateString, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeResultat } from '../../../types/prisma-enums';

export class CreateResultatAudienceDto {
  @ApiProperty({ description: 'ID de l\'audience' })
  @IsUUID()
  @IsNotEmpty()
  audienceId: string;

  @ApiProperty({ enum: TypeResultat, description: 'Type de résultat' })
  @IsEnum(TypeResultat)
  @IsNotEmpty()
  type: TypeResultat;

  @ApiPropertyOptional({ description: 'Nouvelle date en cas de renvoi' })
  @IsOptional()
  @IsDateString()
  nouvelleDate?: string;

  @ApiPropertyOptional({ description: 'Motif du renvoi' })
  @IsOptional()
  @IsString()
  motifRenvoi?: string;

  @ApiPropertyOptional({ description: 'Motif de la radiation' })
  @IsOptional()
  @IsString()
  motifRadiation?: string;

  @ApiPropertyOptional({ description: 'Texte du délibéré' })
  @IsOptional()
  @IsString()
  texteDelibere?: string;
}