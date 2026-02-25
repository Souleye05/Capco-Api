import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDepenseImmeubleDto } from './create-depense-immeuble.dto';

export class UpdateDepenseImmeubleDto extends PartialType(OmitType(CreateDepenseImmeubleDto, ['immeubleId'] as const)) { }
