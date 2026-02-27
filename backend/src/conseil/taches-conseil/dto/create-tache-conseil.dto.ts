import { IsString, IsOptional, IsEnum, IsNotEmpty, IsNumber, Min, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TypeTache {
  CONSULTATION = 'CONSULTATION',
  REDACTION = 'REDACTION',
  NEGOCIATION = 'NEGOCIATION',
  RECHERCHE = 'RECHERCHE',
  REUNION = 'REUNION',
  APPEL = 'APPEL',
  EMAIL = 'EMAIL',
  AUTRE = 'AUTRE',
}

export class CreateTacheConseilDto {
  @ApiProperty({ description: 'ID du client conseil associé' })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ 
    description: 'Date de la tâche (format YYYY-MM-DD ou ISO string)',
    example: '2024-01-15'
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ 
    enum: TypeTache, 
    description: 'Type de tâche effectuée', 
    default: TypeTache.AUTRE 
  })
  @IsOptional()
  @IsEnum(TypeTache)
  type?: TypeTache;

  @ApiProperty({ description: 'Description détaillée de la tâche' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ 
    description: 'Durée en minutes', 
    minimum: 0 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dureeMinutes?: number;

  @ApiProperty({ 
    description: 'Mois concerné par la tâche (format YYYY-MM)',
    example: '2024-01'
  })
  @IsString()
  @IsNotEmpty()
  moisConcerne: string;
}