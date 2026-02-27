import { PartialType } from '@nestjs/swagger';
import { CreateTacheConseilDto } from './create-tache-conseil.dto';

export class UpdateTacheConseilDto extends PartialType(CreateTacheConseilDto) {}