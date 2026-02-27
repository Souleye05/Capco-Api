import { PartialType } from '@nestjs/swagger';
import { CreatePaiementConseilDto } from './create-paiement-conseil.dto';

export class UpdatePaiementConseilDto extends PartialType(CreatePaiementConseilDto) {}