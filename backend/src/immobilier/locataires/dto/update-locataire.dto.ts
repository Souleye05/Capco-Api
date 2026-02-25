import { PartialType } from '@nestjs/swagger';
import { CreateLocataireDto } from './create-locataire.dto';

export class UpdateLocataireDto extends PartialType(CreateLocataireDto) { }
