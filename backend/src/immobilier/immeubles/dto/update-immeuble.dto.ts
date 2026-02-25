import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateImmeubleDto } from './create-immeuble.dto';

export class UpdateImmeubleDto extends PartialType(OmitType(CreateImmeubleDto, ['proprietaireId'] as const)) { }
