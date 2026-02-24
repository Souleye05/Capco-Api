import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePaiementDto } from './create-paiement.dto';

export class UpdatePaiementDto extends PartialType(OmitType(CreatePaiementDto, ['dossierId'] as const)) { }
