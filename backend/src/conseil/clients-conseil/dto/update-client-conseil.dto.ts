import { PartialType } from '@nestjs/swagger';
import { CreateClientConseilDto } from './create-client-conseil.dto';

export class UpdateClientConseilDto extends PartialType(CreateClientConseilDto) {}