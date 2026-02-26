import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { handlePrismaError } from '../../common/utils/prisma-error.utils';
import { CreateRapportGestionDto, UpdateRapportStatutDto } from './dto/create-rapport.dto';
import { dateStringToISODateTime } from '../../common/utils/date.utils';
import { ArrieragesService } from '../impayes/arrierages.service';
import { StatistiquesArrieragesDto } from '../impayes/dto/arrierage.dto';

/** Include used when returning a rapport with its immeuble + proprietaire */
const RAPPORT_INCLUDE = {
    immeuble: {
        select: {
            nom: true,
            reference: true,
            adresse: true,
            tauxCommissionCapco: true,
            proprietaire: { select: { nom: true, telephone: true, email: true } },
        },
    },
} satisfies Prisma.RapportsGestionInclude;

type RapportWithInclude = Prisma.RapportsGestionGetPayload<{ include: typeof RAPPORT_INCLUDE }>;

@Injectable()
export class RapportsGestionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly arrieragesService: ArrieragesService
    ) { }

    async generate(createDto: CreateRapportGestionDto, userId: string) {
        const immeuble = await this.prisma.immeubles.findUnique({
            where: { id: createDto.immeubleId },
            include: {
                proprietaire: { select: { nom: true } },
            },
        });

        if (!immeuble) {
            throw new NotFoundException(`Immeuble avec l'ID ${createDto.immeubleId} non trouvé`);
        }

        const periodeDebut = new Date(createDto.periodeDebut + 'T00:00:00.000Z');
        const periodeFin = new Date(createDto.periodeFin + 'T23:59:59.999Z');

        const [loyersResult, depensesResult, arrieragesStats] = await Promise.all([
            this.prisma.encaissementsLoyers.aggregate({
                where: {
                    lot: { immeubleId: createDto.immeubleId },
                    dateEncaissement: {
                        gte: periodeDebut,
                        lte: periodeFin,
                    },
                },
                _sum: {
                    montantEncaisse: true,
                    commissionCapco: true,
                    netProprietaire: true,
                },
            }),
            this.prisma.depensesImmeubles.aggregate({
                where: {
                    immeubleId: createDto.immeubleId,
                    date: {
                        gte: periodeDebut,
                        lte: periodeFin,
                    },
                },
                _sum: { montant: true },
            }),
            // Récupérer les statistiques d'arriérés pour cet immeuble
            this.arrieragesService.getStatistiquesArrierages(createDto.immeubleId)
        ]);

        const totalLoyers = Number(loyersResult._sum.montantEncaisse) || 0;
        const totalCommissions = Number(loyersResult._sum.commissionCapco) || 0;
        const totalDepenses = Number(depensesResult._sum.montant) || 0;
        const netProprietaire = totalLoyers - totalCommissions - totalDepenses;

        const rapport = await this.prisma.rapportsGestion.create({
            data: {
                immeubleId: createDto.immeubleId,
                periodeDebut,
                periodeFin,
                totalLoyers,
                totalDepenses,
                totalCommissions,
                netProprietaire,
                genererPar: userId,
                statut: 'BROUILLON',
            },
            include: RAPPORT_INCLUDE,
        });

        return RapportsGestionService.mapToResponseDto(rapport, arrieragesStats);
    }

    async findByImmeuble(immeubleId: string) {
        const rapports = await this.prisma.rapportsGestion.findMany({
            where: { immeubleId },
            include: RAPPORT_INCLUDE,
            orderBy: { dateGeneration: 'desc' },
        });

        // Récupérer les statistiques d'arriérés pour cet immeuble
        const arrieragesStats = await this.arrieragesService.getStatistiquesArrierages(immeubleId);

        return rapports.map(rapport => RapportsGestionService.mapToResponseDto(rapport, arrieragesStats));
    }

    async findOne(id: string) {
        const rapport = await this.prisma.rapportsGestion.findUnique({
            where: { id },
            include: RAPPORT_INCLUDE,
        });

        if (!rapport) {
            throw new NotFoundException(`Rapport avec l'ID ${id} non trouvé`);
        }

        // Récupérer les statistiques d'arriérés pour cet immeuble
        const arrieragesStats = await this.arrieragesService.getStatistiquesArrierages(rapport.immeubleId);

        return RapportsGestionService.mapToResponseDto(rapport, arrieragesStats);
    }

    async updateStatut(id: string, updateDto: UpdateRapportStatutDto) {
        try {
            const rapport = await this.prisma.rapportsGestion.update({
                where: { id },
                data: { statut: updateDto.statut },
                include: RAPPORT_INCLUDE,
            });

            // Récupérer les statistiques d'arriérés pour cet immeuble
            const arrieragesStats = await this.arrieragesService.getStatistiquesArrierages(rapport.immeubleId);

            return RapportsGestionService.mapToResponseDto(rapport, arrieragesStats);
        } catch (error) {
            handlePrismaError(error, 'Rapport de gestion');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            await this.prisma.rapportsGestion.delete({ where: { id } });
        } catch (error) {
            handlePrismaError(error, 'Rapport de gestion');
        }
    }

    private static mapToResponseDto(rapport: RapportWithInclude, arrieragesStats?: StatistiquesArrieragesDto) {
        return {
            id: rapport.id,
            immeubleId: rapport.immeubleId,
            periodeDebut: rapport.periodeDebut,
            periodeFin: rapport.periodeFin,
            totalLoyers: Number(rapport.totalLoyers),
            totalDepenses: Number(rapport.totalDepenses),
            totalCommissions: Number(rapport.totalCommissions),
            netProprietaire: Number(rapport.netProprietaire),
            dateGeneration: rapport.dateGeneration,
            statut: rapport.statut,
            immeubleNom: rapport.immeuble?.nom,
            immeubleReference: rapport.immeuble?.reference,
            immeubleAdresse: rapport.immeuble?.adresse,
            tauxCommission: rapport.immeuble?.tauxCommissionCapco ? Number(rapport.immeuble.tauxCommissionCapco) : undefined,
            proprietaireNom: rapport.immeuble?.proprietaire?.nom,
            proprietaireTelephone: rapport.immeuble?.proprietaire?.telephone,
            proprietaireEmail: rapport.immeuble?.proprietaire?.email,
            // Intégration des statistiques d'arriérés
            arrierages: arrieragesStats ? {
                totalMontantArrierage: arrieragesStats.totalMontantArrierage,
                nombreArrieragesEnCours: arrieragesStats.nombreArrieragesEnCours,
                totalMontantPaye: arrieragesStats.totalMontantPaye,
                nombreArrieragesSoldes: arrieragesStats.nombreArrieragesSoldes,
                tauxRecouvrement: arrieragesStats.totalMontantArrierage > 0 
                    ? Math.round((arrieragesStats.totalMontantPaye / (arrieragesStats.totalMontantArrierage + arrieragesStats.totalMontantPaye)) * 100)
                    : 100,
                ancienneteMoyenne: arrieragesStats.ancienneteMoyenne
            } : null,
        };
    }
}
