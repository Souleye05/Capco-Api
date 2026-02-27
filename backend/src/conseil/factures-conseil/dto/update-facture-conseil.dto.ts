import { PartialType } from '@nestjs/swagger';
import { CreateFactureConseilDto } from './create-facture-conseil.dto';

export class UpdateFactureConseilDto extends PartialType(CreateFactureConseilDto) {}