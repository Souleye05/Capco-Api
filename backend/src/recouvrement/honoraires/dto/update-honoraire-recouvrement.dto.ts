import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateHonoraireRecouvrementDto } from './create-honoraire-recouvrement.dto';

export class UpdateHonoraireRecouvrementDto extends PartialType(OmitType(CreateHonoraireRecouvrementDto, ['dossierId'] as const)) { }
