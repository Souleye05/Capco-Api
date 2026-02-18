import { PartialType } from '@nestjs/swagger';
import { CreateJuridictionDto } from './create-juridiction.dto';

export class UpdateJuridictionDto extends PartialType(CreateJuridictionDto) {}