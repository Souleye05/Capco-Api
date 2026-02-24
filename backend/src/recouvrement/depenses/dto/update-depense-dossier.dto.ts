import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDepenseDossierDto } from './create-depense-dossier.dto';

export class UpdateDepenseDossierDto extends PartialType(OmitType(CreateDepenseDossierDto, ['dossierId'] as const)) { }
