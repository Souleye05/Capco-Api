import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { StatutClientConseil, TypePartie } from '@prisma/client';

export class ClientsConseilQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ 
    enum: StatutClientConseil, 
    description: 'Filtrer par statut du client' 
  })
  @IsOptional()
  @IsEnum(StatutClientConseil)
  statut?: StatutClientConseil;

  @ApiPropertyOptional({ 
    enum: TypePartie, 
    description: 'Filtrer par type de partie' 
  })
  @IsOptional()
  @IsEnum(TypePartie)
  type?: TypePartie;
}