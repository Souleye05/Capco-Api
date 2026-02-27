import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsNumber, Min, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { StatutArrierage, ModePaiement } from '@prisma/client';

export class CreateArrierageDto {
    @ApiProperty({ description: 'ID du lot concerné' })
    @IsUUID()
    lotId: string;

    @ApiProperty({ description: 'Date de début de la période d\'arriéré' })
    @IsDateString()
    periodeDebut: string;

    @ApiProperty({ description: 'Date de fin de la période d\'arriéré' })
    @IsDateString()
    periodeFin: string;

    @ApiProperty({ description: 'Montant total dû pour cette période' })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    montantDu: number;

    @ApiPropertyOptional({ description: 'Description de l\'arriéré' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateArrierageDto {
    @ApiPropertyOptional({ description: 'Date de début de la période d\'arriéré' })
    @IsOptional()
    @IsDateString()
    periodeDebut?: string;

    @ApiPropertyOptional({ description: 'Date de fin de la période d\'arriéré' })
    @IsOptional()
    @IsDateString()
    periodeFin?: string;

    @ApiPropertyOptional({ description: 'Montant total dû pour cette période' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    montantDu?: number;

    @ApiPropertyOptional({ description: 'Description de l\'arriéré' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Statut de l\'arriéré', enum: StatutArrierage })
    @IsOptional()
    @IsEnum(StatutArrierage)
    statut?: StatutArrierage;
}

export class CreatePaiementPartielDto {
    @ApiProperty({ description: 'Date du paiement partiel' })
    @IsDateString()
    date: string;

    @ApiProperty({ description: 'Montant du paiement partiel' })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    montant: number;

    @ApiProperty({ description: 'Mode de paiement', enum: ModePaiement })
    @IsEnum(ModePaiement)
    mode: ModePaiement;

    @ApiPropertyOptional({ description: 'Référence du paiement' })
    @IsOptional()
    @IsString()
    reference?: string;

    @ApiPropertyOptional({ description: 'Commentaire sur le paiement' })
    @IsOptional()
    @IsString()
    commentaire?: string;
}

export class PaiementPartielDto {
    @ApiProperty({ description: 'ID du paiement partiel' })
    id: string;

    @ApiProperty({ description: 'Date du paiement partiel' })
    date: Date;

    @ApiProperty({ description: 'Montant du paiement partiel' })
    montant: number;

    @ApiProperty({ description: 'Mode de paiement', enum: ModePaiement })
    mode: ModePaiement;

    @ApiPropertyOptional({ description: 'Référence du paiement' })
    reference?: string;

    @ApiPropertyOptional({ description: 'Commentaire sur le paiement' })
    commentaire?: string;

    @ApiProperty({ description: 'Date de création' })
    createdAt: Date;

    @ApiProperty({ description: 'Créé par (ID utilisateur)' })
    createdBy: string;
}

export class ArrierageDto {
    @ApiProperty({ description: 'ID de l\'arriéré' })
    id: string;

    @ApiProperty({ description: 'ID de l\'immeuble' })
    immeubleId: string;

    @ApiProperty({ description: 'ID du lot concerné' })
    lotId: string;

    @ApiProperty({ description: 'Numéro du lot' })
    lotNumero: string;

    @ApiProperty({ description: 'Nom de l\'immeuble' })
    immeubleNom: string;

    @ApiProperty({ description: 'Référence de l\'immeuble' })
    immeubleReference: string;

    @ApiPropertyOptional({ description: 'Taux de commission de l\'immeuble (%)' })
    immeubleTauxCommission?: number;

    @ApiPropertyOptional({ description: 'Nom du locataire' })
    locataireNom?: string;

    @ApiProperty({ description: 'Date de début de la période d\'arriéré' })
    periodeDebut: Date;

    @ApiProperty({ description: 'Date de fin de la période d\'arriéré' })
    periodeFin: Date;

    @ApiProperty({ description: 'Montant total dû pour cette période' })
    montantDu: number;

    @ApiProperty({ description: 'Montant déjà payé' })
    montantPaye: number;

    @ApiProperty({ description: 'Montant restant à payer' })
    montantRestant: number;

    @ApiProperty({ description: 'Statut de l\'arriéré', enum: StatutArrierage })
    statut: StatutArrierage;

    @ApiPropertyOptional({ description: 'Description de l\'arriéré' })
    description?: string;

    @ApiProperty({ type: [PaiementPartielDto], description: 'Liste des paiements partiels' })
    paiementsPartiels: PaiementPartielDto[];

    @ApiProperty({ description: 'Date de création' })
    createdAt: Date;

    @ApiProperty({ description: 'Créé par (ID utilisateur)' })
    createdBy: string;
}

export class ArrieragesQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Filtre par immeuble' })
    @IsOptional()
    @IsUUID()
    immeubleId?: string;

    @ApiPropertyOptional({ description: 'Filtre par lot' })
    @IsOptional()
    @IsUUID()
    lotId?: string;

    @ApiPropertyOptional({ description: 'Filtre par locataire' })
    @IsOptional()
    @IsUUID()
    locataireId?: string;

    @ApiPropertyOptional({ description: 'Filtre par statut', enum: StatutArrierage })
    @IsOptional()
    @IsEnum(StatutArrierage)
    statut?: StatutArrierage;
}

export class StatistiquesArrieragesDto {
    @ApiProperty({ description: 'Montant total des arriérés en cours' })
    totalMontantArrierage: number;

    @ApiProperty({ description: 'Nombre d\'arriérés en cours' })
    nombreArrieragesEnCours: number;

    @ApiProperty({ description: 'Montant total payé sur les arriérés' })
    totalMontantPaye: number;

    @ApiProperty({ description: 'Nombre d\'arriérés soldés' })
    nombreArrieragesSoldes: number;

    @ApiProperty({ description: 'Répartition par immeuble' })
    repartitionParImmeuble: {
        immeubleId: string;
        immeubleNom: string;
        montantTotal: number;
        nombreArrierages: number;
    }[];

    @ApiProperty({ description: 'Ancienneté moyenne des arriérés (en jours)' })
    ancienneteMoyenne: number;
}