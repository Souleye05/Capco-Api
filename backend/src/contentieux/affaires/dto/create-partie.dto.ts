import { IsString, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolePartie } from './create-affaire.dto';

export class CreatePartieDto {
  @ApiProperty({ description: 'Nom de la partie' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ enum: RolePartie, description: 'Rôle de la partie' })
  @IsEnum(RolePartie)
  @IsNotEmpty()
  role: RolePartie;

  @ApiProperty({ description: 'ID de l\'affaire' })
  @IsUUID()
  @IsNotEmpty()
  affaireId: string;
}