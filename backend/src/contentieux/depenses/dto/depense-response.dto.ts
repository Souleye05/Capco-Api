import { ApiProperty } from '@nestjs/swagger';

class AffaireSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  intitule: string;

  @ApiProperty()
  parties: Array<{
    id: string;
    nom: string;
    role: string;
  }>;
}

export class DepenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  affaireId: string;

  @ApiProperty()
  affaire: AffaireSummaryDto;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  typeDepense: string;

  @ApiProperty()
  nature: string;

  @ApiProperty()
  montant: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  justificatif?: string;

  @ApiProperty()
  createdAt: Date;
}