import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma, StatutArrierage } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
    CreateArrierageDto,
    UpdateArrierageDto,
    CreatePaiementPartielDto,
    ArrierageDto,
    ArrieragesQueryDto,
    StatistiquesArrieragesDto,
    PaiementPartielDto
} from './dto/arrierage.dto';

@Injectable()
export class ArrieragesService {
    private readonly logger = new Logger(ArrieragesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService
    ) { }

    /**
     * Créer un nouvel arriéré
     */
    async create(createArrierageDto: CreateArrierageDto, userId: string): Promise<ArrierageDto> {
        this.logger.log('Création d\'un nouvel arriéré', { lotId: createArrierageDto.lotId, userId });

        try {
            // Vérifier que le lot existe
            const lot = await this.prisma.lots.findUnique({
                where: { id: createArrierageDto.lotId },
                include: {
                    immeuble: true,
                    locataire: true
                }
            });

            if (!lot) {
                throw new NotFoundException(`Lot avec l'ID ${createArrierageDto.lotId} non trouvé`);
            }

            // Valider les dates
            const periodeDebut = new Date(createArrierageDto.periodeDebut);
            const periodeFin = new Date(createArrierageDto.periodeFin);

            if (periodeDebut >= periodeFin) {
                throw new BadRequestException('La date de début doit être antérieure à la date de fin');
            }

            // Vérifier qu'il n'y a pas de chevauchement avec un arriéré existant
            const arrierageExistant = await this.prisma.arrieragesLoyers.findFirst({
                where: {
                    lotId: createArrierageDto.lotId,
                    OR: [
                        {
                            AND: [
                                { periodeDebut: { lte: periodeDebut } },
                                { periodeFin: { gte: periodeDebut } }
                            ]
                        },
                        {
                            AND: [
                                { periodeDebut: { lte: periodeFin } },
                                { periodeFin: { gte: periodeFin } }
                            ]
                        },
                        {
                            AND: [
                                { periodeDebut: { gte: periodeDebut } },
                                { periodeFin: { lte: periodeFin } }
                            ]
                        }
                    ]
                }
            });

            if (arrierageExistant) {
                throw new BadRequestException('Un arriéré existe déjà pour cette période ou une période qui se chevauche');
            }

            // Créer l'arriéré
            const arrierage = await this.prisma.arrieragesLoyers.create({
                data: {
                    lotId: createArrierageDto.lotId,
                    periodeDebut,
                    periodeFin,
                    montantDu: createArrierageDto.montantDu,
                    montantPaye: 0,
                    montantRestant: createArrierageDto.montantDu,
                    statut: StatutArrierage.EN_COURS,
                    description: createArrierageDto.description,
                    createdBy: userId
                },
                include: {
                    lot: {
                        include: {
                            immeuble: true,
                            locataire: true
                        }
                    },
                    paiementsPartiels: true
                }
            });

            this.logger.log(`Arriéré créé avec succès`, { arrierageId: arrierage.id });

            return this.mapToArrierageDto(arrierage);

        } catch (error) {
            this.logger.error(`Erreur lors de la création de l'arriéré: ${error.message}`, error.stack);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la création de l\'arriéré');
        }
    }

    /**
     * Récupérer tous les arriérés avec pagination et filtres
     */
    async findAll(query: ArrieragesQueryDto): Promise<PaginatedResponse<ArrierageDto>> {
        this.logger.log('Récupération des arriérés', { query });

        try {
            // Construction des conditions de filtrage
            const where: Prisma.ArrieragesLoyersWhereInput = {};
            const lotWhere: Prisma.LotsWhereInput = {};

            if (query.immeubleId) {
                if (!isUUID(query.immeubleId)) {
                    throw new BadRequestException('immeubleId doit être un UUID valide');
                }
                lotWhere.immeubleId = query.immeubleId;
            }

            if (query.locataireId) {
                if (!isUUID(query.locataireId)) {
                    throw new BadRequestException('locataireId doit être un UUID valide');
                }
                lotWhere.locataireId = query.locataireId;
            }

            if (query.lotId) {
                if (!isUUID(query.lotId)) {
                    throw new BadRequestException('lotId doit être un UUID valide');
                }
                where.lotId = query.lotId;
            } else if (Object.keys(lotWhere).length > 0) {
                where.lot = lotWhere;
            }

            if (query.statut) {
                where.statut = query.statut;
            }

            // Utilisation du service de pagination
            const result = await this.paginationService.paginate(
                this.prisma.arrieragesLoyers,
                query,
                {
                    where,
                    include: {
                        lot: {
                            include: {
                                immeuble: true,
                                locataire: true
                            }
                        },
                        paiementsPartiels: {
                            orderBy: { createdAt: 'desc' }
                        }
                    },
                    searchFields: ['description', 'lot.numero', 'lot.immeuble.nom', 'lot.locataire.nom'],
                    defaultSortBy: 'createdAt'
                }
            );

            // Transformation des données
            const arrierages = result.data.map(arrierage => this.mapToArrierageDto(arrierage as any));

            return {
                data: arrierages,
                pagination: result.pagination
            };

        } catch (error) {
            this.logger.error(`Erreur lors de la récupération des arriérés: ${error.message}`, error.stack);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la récupération des arriérés');
        }
    }

    /**
     * Récupérer un arriéré par son ID
     */
    async findOne(id: string): Promise<ArrierageDto> {
        if (!isUUID(id)) {
            throw new BadRequestException('ID doit être un UUID valide');
        }

        try {
            const arrierage = await this.prisma.arrieragesLoyers.findUnique({
                where: { id },
                include: {
                    lot: {
                        include: {
                            immeuble: true,
                            locataire: true
                        }
                    },
                    paiementsPartiels: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            if (!arrierage) {
                throw new NotFoundException(`Arriéré avec l'ID ${id} non trouvé`);
            }

            return this.mapToArrierageDto(arrierage);

        } catch (error) {
            this.logger.error(`Erreur lors de la récupération de l'arriéré: ${error.message}`, error.stack);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la récupération de l\'arriéré');
        }
    }

    /**
     * Mettre à jour un arriéré
     */
    async update(id: string, updateArrierageDto: UpdateArrierageDto, userId: string): Promise<ArrierageDto> {
        if (!isUUID(id)) {
            throw new BadRequestException('ID doit être un UUID valide');
        }

        this.logger.log('Mise à jour d\'un arriéré', { arrierageId: id, userId });

        try {
            // Vérifier que l'arriéré existe
            const arrierageExistant = await this.prisma.arrieragesLoyers.findUnique({
                where: { id }
            });

            if (!arrierageExistant) {
                throw new NotFoundException(`Arriéré avec l'ID ${id} non trouvé`);
            }

            // Préparer les données de mise à jour
            const updateData: Prisma.ArrieragesLoyersUpdateInput = {};

            if (updateArrierageDto.periodeDebut) {
                updateData.periodeDebut = new Date(updateArrierageDto.periodeDebut);
            }

            if (updateArrierageDto.periodeFin) {
                updateData.periodeFin = new Date(updateArrierageDto.periodeFin);
            }

            if (updateArrierageDto.montantDu !== undefined) {
                updateData.montantDu = updateArrierageDto.montantDu;
                // Recalculer le montant restant
                updateData.montantRestant = updateArrierageDto.montantDu - Number(arrierageExistant.montantPaye);
            }

            if (updateArrierageDto.description !== undefined) {
                updateData.description = updateArrierageDto.description;
            }

            if (updateArrierageDto.statut) {
                updateData.statut = updateArrierageDto.statut;
            }

            // Valider les dates si elles sont modifiées
            const periodeDebut = updateData.periodeDebut || arrierageExistant.periodeDebut;
            const periodeFin = updateData.periodeFin || arrierageExistant.periodeFin;

            if (periodeDebut >= periodeFin) {
                throw new BadRequestException('La date de début doit être antérieure à la date de fin');
            }

            // Mettre à jour l'arriéré
            const arrierage = await this.prisma.arrieragesLoyers.update({
                where: { id },
                data: updateData,
                include: {
                    lot: {
                        include: {
                            immeuble: true,
                            locataire: true
                        }
                    },
                    paiementsPartiels: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            this.logger.log(`Arriéré mis à jour avec succès`, { arrierageId: id });

            return this.mapToArrierageDto(arrierage);

        } catch (error) {
            this.logger.error(`Erreur lors de la mise à jour de l'arriéré: ${error.message}`, error.stack);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la mise à jour de l\'arriéré');
        }
    }

    /**
     * Supprimer un arriéré
     */
    async remove(id: string): Promise<void> {
        if (!isUUID(id)) {
            throw new BadRequestException('ID doit être un UUID valide');
        }

        this.logger.log('Suppression d\'un arriéré', { arrierageId: id });

        try {
            // Vérifier que l'arriéré existe
            const arrierage = await this.prisma.arrieragesLoyers.findUnique({
                where: { id }
            });

            if (!arrierage) {
                throw new NotFoundException(`Arriéré avec l'ID ${id} non trouvé`);
            }

            // Supprimer l'arriéré (les paiements partiels seront supprimés en cascade)
            await this.prisma.arrieragesLoyers.delete({
                where: { id }
            });

            this.logger.log(`Arriéré supprimé avec succès`, { arrierageId: id });

        } catch (error) {
            this.logger.error(`Erreur lors de la suppression de l'arriéré: ${error.message}`, error.stack);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la suppression de l\'arriéré');
        }
    }

    /**
     * Enregistrer un paiement partiel sur un arriéré
     */
    async enregistrerPaiementPartiel(
        arrierageId: string,
        createPaiementDto: CreatePaiementPartielDto,
        userId: string
    ): Promise<ArrierageDto> {
        if (!isUUID(arrierageId)) {
            throw new BadRequestException('arrierageId doit être un UUID valide');
        }

        this.logger.log('Enregistrement d\'un paiement partiel', { arrierageId, montant: createPaiementDto.montant, userId });

        try {
            return await this.prisma.$transaction(async (tx) => {
                // Vérifier que l'arriéré existe et n'est pas soldé
                const arrierage = await tx.arrieragesLoyers.findUnique({
                    where: { id: arrierageId }
                });

                if (!arrierage) {
                    throw new NotFoundException(`Arriéré avec l'ID ${arrierageId} non trouvé`);
                }

                if (arrierage.statut === StatutArrierage.SOLDE) {
                    throw new BadRequestException('Impossible d\'ajouter un paiement à un arriéré déjà soldé');
                }

                // Vérifier que le montant du paiement ne dépasse pas le montant restant
                const montantRestantActuel = Number(arrierage.montantRestant);
                if (createPaiementDto.montant > montantRestantActuel) {
                    throw new BadRequestException(
                        `Le montant du paiement (${createPaiementDto.montant}) ne peut pas dépasser le montant restant (${montantRestantActuel})`
                    );
                }

                // Créer le paiement partiel
                await tx.paiementsPartielsArrierages.create({
                    data: {
                        arrierageId,
                        date: new Date(createPaiementDto.date),
                        montant: createPaiementDto.montant,
                        mode: createPaiementDto.mode,
                        reference: createPaiementDto.reference,
                        commentaire: createPaiementDto.commentaire,
                        createdBy: userId
                    }
                });

                // Mettre à jour l'arriéré
                const nouveauMontantPaye = Number(arrierage.montantPaye) + createPaiementDto.montant;
                const nouveauMontantRestant = Number(arrierage.montantDu) - nouveauMontantPaye;
                const nouveauStatut = nouveauMontantRestant <= 0 ? StatutArrierage.SOLDE : StatutArrierage.EN_COURS;

                const arrierageUpdated = await tx.arrieragesLoyers.update({
                    where: { id: arrierageId },
                    data: {
                        montantPaye: nouveauMontantPaye,
                        montantRestant: Math.max(0, nouveauMontantRestant),
                        statut: nouveauStatut
                    },
                    include: {
                        lot: {
                            include: {
                                immeuble: true,
                                locataire: true
                            }
                        },
                        paiementsPartiels: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                });

                this.logger.log(`Paiement partiel enregistré avec succès`, {
                    arrierageId,
                    nouveauMontantPaye,
                    nouveauMontantRestant,
                    nouveauStatut
                });

                return this.mapToArrierageDto(arrierageUpdated);
            });

        } catch (error) {
            this.logger.error(`Erreur lors de l'enregistrement du paiement partiel: ${error.message}`, error.stack);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de l\'enregistrement du paiement partiel');
        }
    }

    /**
     * Obtenir les statistiques des arriérés
     */
    async getStatistiquesArrierages(immeubleId?: string): Promise<StatistiquesArrieragesDto> {
        this.logger.log('Calcul des statistiques des arriérés', { immeubleId });

        try {
            if (immeubleId && !isUUID(immeubleId)) {
                throw new BadRequestException('immeubleId doit être un UUID valide');
            }

            // Construction des conditions de filtrage
            const where: Prisma.ArrieragesLoyersWhereInput = {};
            if (immeubleId) {
                where.lot = { immeubleId };
            }

            // Récupérer tous les arriérés avec leurs informations
            const arrierages = await this.prisma.arrieragesLoyers.findMany({
                where,
                include: {
                    lot: {
                        include: {
                            immeuble: true
                        }
                    }
                }
            });

            // Calculer les statistiques
            const arrieragesEnCours = arrierages.filter(a => a.statut === StatutArrierage.EN_COURS);
            const arrieragesSoldes = arrierages.filter(a => a.statut === StatutArrierage.SOLDE);

            const totalMontantArrierage = arrieragesEnCours.reduce((sum, a) => sum + Number(a.montantRestant), 0);
            const totalMontantPaye = arrierages.reduce((sum, a) => sum + Number(a.montantPaye), 0);

            // Répartition par immeuble
            const repartitionMap = new Map<string, { immeubleId: string; immeubleNom: string; montantTotal: number; nombreArrierages: number }>();

            for (const arrierage of arrieragesEnCours) {
                const immeubleId = arrierage.lot.immeubleId;
                const stats = repartitionMap.get(immeubleId) || {
                    immeubleId,
                    immeubleNom: arrierage.lot.immeuble.nom,
                    montantTotal: 0,
                    nombreArrierages: 0
                };

                stats.montantTotal += Number(arrierage.montantRestant);
                stats.nombreArrierages += 1;
                repartitionMap.set(immeubleId, stats);
            }

            // Calcul de l'ancienneté moyenne
            const now = new Date();
            const anciennetes = arrieragesEnCours.map(a => {
                const diffTime = now.getTime() - a.createdAt.getTime();
                return Math.floor(diffTime / (1000 * 60 * 60 * 24)); // en jours
            });

            const ancienneteMoyenne = anciennetes.length > 0
                ? Math.round(anciennetes.reduce((sum, age) => sum + age, 0) / anciennetes.length)
                : 0;

            return {
                totalMontantArrierage,
                nombreArrieragesEnCours: arrieragesEnCours.length,
                totalMontantPaye,
                nombreArrieragesSoldes: arrieragesSoldes.length,
                repartitionParImmeuble: Array.from(repartitionMap.values()).sort((a, b) => b.montantTotal - a.montantTotal),
                ancienneteMoyenne
            };

        } catch (error) {
            this.logger.error(`Erreur lors du calcul des statistiques des arriérés: ${error.message}`, error.stack);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors du calcul des statistiques des arriérés');
        }
    }

    /**
     * Mapper les données Prisma vers ArrierageDto
     */
    private mapToArrierageDto(arrierage: any): ArrierageDto {
        return {
            id: arrierage.id,
            lotId: arrierage.lotId,
            lotNumero: arrierage.lot.numero,
            immeubleNom: arrierage.lot.immeuble.nom,
            immeubleReference: arrierage.lot.immeuble.reference,
            locataireNom: arrierage.lot.locataire?.nom || 'Non renseigné',
            periodeDebut: arrierage.periodeDebut,
            periodeFin: arrierage.periodeFin,
            montantDu: Number(arrierage.montantDu),
            montantPaye: Number(arrierage.montantPaye),
            montantRestant: Number(arrierage.montantRestant),
            statut: arrierage.statut,
            description: arrierage.description,
            paiementsPartiels: arrierage.paiementsPartiels?.map((p: any) => ({
                id: p.id,
                date: p.date,
                montant: Number(p.montant),
                mode: p.mode,
                reference: p.reference,
                commentaire: p.commentaire,
                createdAt: p.createdAt,
                createdBy: p.createdBy
            })) || [],
            createdAt: arrierage.createdAt,
            createdBy: arrierage.createdBy
        };
    }

    /**
     * Calcule le taux de recouvrement des arriérés
     * @param immeubleId - ID de l'immeuble (optionnel)
     * @returns Taux de recouvrement en pourcentage
     */
    async calculerTauxRecouvrement(immeubleId?: string): Promise<number> {
        this.logger.log('Calcul du taux de recouvrement des arriérés', { immeubleId });

        try {
            const stats = await this.getStatistiquesArrierages(immeubleId);

            if (stats.totalMontantArrierage === 0 && stats.totalMontantPaye === 0) {
                return 100; // Aucun arriéré = 100% de recouvrement
            }

            const totalDu = stats.totalMontantArrierage + stats.totalMontantPaye;
            return Math.round((stats.totalMontantPaye / totalDu) * 100);

        } catch (error) {
            this.logger.error(`Erreur lors du calcul du taux de recouvrement: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Erreur lors du calcul du taux de recouvrement');
        }
    }

    /**
     * Obtient la répartition des arriérés par locataire
     * @param immeubleId - ID de l'immeuble (optionnel)
     * @returns Répartition par locataire
     */
    async getRepartitionParLocataire(immeubleId?: string): Promise<{
        locataireId: string;
        locataireNom: string;
        montantTotal: number;
        nombreArrierages: number;
    }[]> {
        this.logger.log('Récupération de la répartition des arriérés par locataire', { immeubleId });

        try {
            if (immeubleId && !isUUID(immeubleId)) {
                throw new BadRequestException('immeubleId doit être un UUID valide');
            }

            const where: Prisma.ArrieragesLoyersWhereInput = {
                statut: StatutArrierage.EN_COURS
            };
            if (immeubleId) {
                where.lot = { immeubleId };
            }

            const arrierages = await this.prisma.arrieragesLoyers.findMany({
                where,
                include: {
                    lot: {
                        include: {
                            locataire: true
                        }
                    }
                }
            });

            // Grouper par locataire
            const repartitionMap = new Map<string, {
                locataireId: string;
                locataireNom: string;
                montantTotal: number;
                nombreArrierages: number;
            }>();

            for (const arrierage of arrierages) {
                const locataireId = arrierage.lot.locataireId || 'sans-locataire';
                const locataireNom = arrierage.lot.locataire?.nom || 'Sans locataire';

                const stats = repartitionMap.get(locataireId) || {
                    locataireId,
                    locataireNom,
                    montantTotal: 0,
                    nombreArrierages: 0
                };

                stats.montantTotal += Number(arrierage.montantRestant);
                stats.nombreArrierages += 1;
                repartitionMap.set(locataireId, stats);
            }

            return Array.from(repartitionMap.values()).sort((a, b) => b.montantTotal - a.montantTotal);

        } catch (error) {
            this.logger.error(`Erreur lors de la récupération de la répartition par locataire: ${error.message}`, error.stack);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la récupération de la répartition par locataire');
        }
    }
}