import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActionResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    dossierId: string;

    @ApiProperty()
    date: Date;

    @ApiProperty()
    typeAction: string;

    @ApiProperty()
    resume: string;

    @ApiPropertyOptional()
    prochaineEtape?: string;

    @ApiPropertyOptional()
    echeanceProchaineEtape?: Date;

    @ApiPropertyOptional()
    pieceJointe?: string;

    @ApiProperty({ description: 'Référence du dossier parent' })
    dossierReference?: string;

    @ApiProperty()
    createdAt: Date;
}
