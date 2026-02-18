import { PartialType } from '@nestjs/swagger';
import { CreateHonoraireDto } from './create-honoraire.dto';

export class UpdateHonoraireDto extends PartialType(CreateHonoraireDto) {}