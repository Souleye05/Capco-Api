import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class ImpayeDto {
    @ApiProperty({ description: 'ID du lot' })
    lotId: string;

    @ApiProperty({ description: 'Numéro du lot' })
    lotNumero: string;

    @ApiProperty({ description: 'ID de l\'immeuble' })
    immeubleId: string;

    @ApiProperty({ description: 'Nom de l\'immeuble' })
    immeubleNom: string;

    @ApiProperty({ description: 'Référence de l\'immeuble' })
    immeubleReference: string;

    @ApiPropertyOptional({ description: 'ID du locataire' })
    locataireId?: string;

    @ApiProperty({ description: 'Nom complet du locataire' })
    locataireNom: string;

    @ApiProperty({ description: 'Mois concerné au format YYYY-MM' })
    moisConcerne: string;

    @ApiProperty({ description: 'Loyer mensuel complet attendu' })
    montantAttendu: number;

    @ApiProperty({ description: 'Somme des encaissements perçus pour ce mois' })
    montantEncaisse: number;

    @ApiProperty({ description: 'Montant qu\'il reste à payer' })
    montantManquant: number;

    @ApiProperty({ description: 'Jours de retard depuis le 5 du mois' })
    nombreJoursRetard: number;

    @ApiProperty({ description: 'Statut du paiement', enum: ['IMPAYE', 'PARTIEL', 'REGLE'] })
    statut: 'IMPAYE' | 'PARTIEL' | 'REGLE';

    @ApiProperty({ description: 'Date d\'échéance (généralement le 5 du mois)' })
    dateEcheance: Date;
}

export class ImmeubleStatistiqueDto {
    @ApiProperty()
    immeubleId: string;

    @ApiProperty()
    immeubleNom: string;

    @ApiProperty()
    montant: number;

    @ApiProperty()
    nombreLots: number;
}

export class EvolutionMensuelleDto {
    @ApiProperty()
    mois: string;

    @ApiProperty()
    montant: number;
}

export class StatistiquesImpayesDto {
    @ApiProperty({ description: 'Total des impayés et paiements partiels pour le mois cible' })
    totalMontantImpaye: number;

    @ApiProperty({ description: 'Nombre de lots en situation d\'impayé' })
    nombreLotsImpayes: number;

    @ApiProperty({ description: 'Pourcentage de lots impayés parmi les lots occupés' })
    tauxImpayes: number;

    @ApiProperty({ type: [ImmeubleStatistiqueDto] })
    repartitionParImmeuble: ImmeubleStatistiqueDto[];

    @ApiProperty({ type: [EvolutionMensuelleDto] })
    evolutionMensuelle: EvolutionMensuelleDto[];
}

export class ImpayesQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Mois ciblé (YYYY-MM). Si vide, utilise le mois en cours (ou le mois dernier si < 5 du mois).' })
    @IsOptional()
    @IsString()
    mois?: string;

    @ApiPropertyOptional({ description: 'Filtre par Immeuble' })
    @IsOptional()
    @IsUUID()
    immeubleId?: string;

    @ApiPropertyOptional({ description: 'Filtre par Locataire' })
    @IsOptional()
    @IsUUID()
    locataireId?: string;
}
