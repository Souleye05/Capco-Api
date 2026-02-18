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

class PaiementHonoraireDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  montant: number;

  @ApiProperty()
  modePaiement: string;

  @ApiProperty({ required: false })
  notes?: string;
}

export class HonoraireResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  affaireId: string;

  @ApiProperty()
  affaire: AffaireSummaryDto;

  @ApiProperty()
  montantFacture: number;

  @ApiProperty()
  montantEncaisse: number;

  @ApiProperty()
  montantRestant: number;

  @ApiProperty({ required: false })
  dateFacturation?: Date;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ type: [PaiementHonoraireDto] })
  paiements: PaiementHonoraireDto[];

  @ApiProperty()
  createdAt: Date;
}