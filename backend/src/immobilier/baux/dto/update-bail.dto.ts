import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBailDto } from './create-bail.dto';

export class UpdateBailDto extends PartialType(OmitType(CreateBailDto, ['lotId', 'locataireId'] as const)) { }
