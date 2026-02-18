import { PartialType } from '@nestjs/swagger';
import { CreateResultatAudienceDto } from './create-resultat-audience.dto';

export class UpdateResultatAudienceDto extends PartialType(CreateResultatAudienceDto) {}