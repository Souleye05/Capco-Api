import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEncaissementDto } from './create-encaissement.dto';

export class UpdateEncaissementDto extends PartialType(OmitType(CreateEncaissementDto, ['lotId'] as const)) { }
