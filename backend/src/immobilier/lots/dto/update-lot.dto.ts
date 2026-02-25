import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLotDto } from './create-lot.dto';

export class UpdateLotDto extends PartialType(OmitType(CreateLotDto, ['immeubleId'] as const)) { }
