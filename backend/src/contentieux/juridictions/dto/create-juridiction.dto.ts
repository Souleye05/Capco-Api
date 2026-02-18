import { IsString, IsOptional, IsBoolean, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateJuridictionDto {
  @ApiProperty({ description: 'Nom de la juridiction' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ description: 'Code court de la juridiction (ex: TGI, TC, CA)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Description de la juridiction' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ordre d\'affichage', type: 'number', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ description: 'Juridiction active', default: true })
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;
}