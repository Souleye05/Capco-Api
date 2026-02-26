import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { handlePrismaError } from '../../common/utils/prisma-error.utils';
import { CreateEncaissementDto } from './dto/create-encaissement.dto';
import { UpdateEncaissementDto } from './dto/update-encaissement.dto';
import { parseDate } from '../../common/utils/date.utils';

type EncaissementWithInclude = Prisma.EncaissementsLoyersGetPayload<{
    include: typeof EncaissementsService['DEFAULT_INCLUDE'];
}>;

@Injectable()
export class EncaissementsService {
    constructor(private readonly prisma: PrismaService) { }

    private statsCache = new Map<string, { data: any, timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    private clearCache() {
        this.statsCache.clear();
    }

    private static readonly DEFAULT_INCLUDE = {
        lot: {
            select: {
                id: true,
                numero: true,
                immeuble: {
                    select: { id: true, nom: true, reference: true, tauxCommissionCapco: true },
                },
                locataire: {
                    select: { id: true, nom: true },
                },
            },
        },
    } satisfies Prisma.EncaissementsLoyersInclude;

    async create(createDto: CreateEncaissementDto, userId: string) {
        const lot = await this.prisma.lots.findUnique({
            where: { id: createDto.lotId },
            include: {
                immeuble: {
                    select: { id: true, nom: true, tauxCommissionCapco: true },
                },
            },
        });

        if (!lot) {
            throw new NotFoundException(`Lot avec l'ID ${createDto.lotId} non trouvé`);
        }

        const tauxCommission = Number(lot.immeuble.tauxCommissionCapco) / 100;
        const commissionCapco = Math.round(createDto.montantEncaisse * tauxCommission);
        const netProprietaire = createDto.montantEncaisse - commissionCapco;

        const encaissement = await this.prisma.encaissementsLoyers.create({
            data: {
                lotId: createDto.lotId,
                moisConcerne: createDto.moisConcerne,
                dateEncaissement: parseDate(createDto.dateEncaissement),
                montantEncaisse: createDto.montantEncaisse,
                modePaiement: createDto.modePaiement,
                observation: createDto.observation,
                commissionCapco,
                netProprietaire,
                createdBy: userId,
            },
            include: EncaissementsService.DEFAULT_INCLUDE,
        });

        return EncaissementsService.mapToResponseDto(encaissement);
    }

    async findByLot(lotId: string) {
        const encaissements = await this.prisma.encaissementsLoyers.findMany({
            where: { lotId },
            include: EncaissementsService.DEFAULT_INCLUDE,
            orderBy: { dateEncaissement: 'desc' },
        });

        return encaissements.map(EncaissementsService.mapToResponseDto);
    }

    async findByImmeuble(immeubleId: string) {
        const encaissements = await this.prisma.encaissementsLoyers.findMany({
            where: {
                lot: { immeubleId },
            },
            include: EncaissementsService.DEFAULT_INCLUDE,
            orderBy: { dateEncaissement: 'desc' },
        });

        return encaissements.map(EncaissementsService.mapToResponseDto);
    }

    async findOne(id: string) {
        const encaissement = await this.prisma.encaissementsLoyers.findUnique({
            where: { id },
            include: EncaissementsService.DEFAULT_INCLUDE,
        });

        if (!encaissement) {
            throw new NotFoundException(`Encaissement avec l'ID ${id} non trouvé`);
        }

        return EncaissementsService.mapToResponseDto(encaissement);
    }

    async update(id: string, updateDto: UpdateEncaissementDto) {
        const existing = await this.prisma.encaissementsLoyers.findUnique({
            where: { id },
            include: {
                lot: {
                    include: {
                        immeuble: { select: { tauxCommissionCapco: true } },
                    },
                },
            },
        });

        if (!existing) {
            throw new NotFoundException(`Encaissement avec l'ID ${id} non trouvé`);
        }

        const data: Prisma.EncaissementsLoyersUncheckedUpdateInput = {};
        if (updateDto.moisConcerne !== undefined) data.moisConcerne = updateDto.moisConcerne;
        if (updateDto.dateEncaissement) data.dateEncaissement = parseDate(updateDto.dateEncaissement);
        if (updateDto.modePaiement) data.modePaiement = updateDto.modePaiement;
        if (updateDto.observation !== undefined) data.observation = updateDto.observation;

        if (updateDto.montantEncaisse !== undefined) {
            const tauxCommission = Number(existing.lot.immeuble.tauxCommissionCapco) / 100;
            data.montantEncaisse = updateDto.montantEncaisse;
            data.commissionCapco = Math.round(updateDto.montantEncaisse * tauxCommission);
            data.netProprietaire = updateDto.montantEncaisse - Number(data.commissionCapco);
        }

        const encaissement = await this.prisma.encaissementsLoyers.update({
            where: { id },
            data,
            include: EncaissementsService.DEFAULT_INCLUDE,
        });

        return EncaissementsService.mapToResponseDto(encaissement);
    }

    async remove(id: string): Promise<void> {
        try {
            await this.prisma.encaissementsLoyers.delete({ where: { id } });
            this.clearCache();
        } catch (error) {
            handlePrismaError(error, 'Encaissement');
        }
    }

    async getStatistics(params: { immeubleId?: string; moisConcerne?: string } = {}) {
        const cacheKey = `${params.immeubleId || 'all'}_${params.moisConcerne || 'all'}`;
        const cached = this.statsCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        const where: Prisma.EncaissementsLoyersWhereInput = {};
        if (params.immeubleId) where.lot = { immeubleId: params.immeubleId };
        if (params.moisConcerne) where.moisConcerne = params.moisConcerne;

        const totals = await this.prisma.encaissementsLoyers.aggregate({
            where,
            _sum: {
                montantEncaisse: true,
                commissionCapco: true,
                netProprietaire: true,
            },
            _count: true,
        });

        const parMode = await this.prisma.encaissementsLoyers.groupBy({
            by: ['modePaiement'],
            where,
            _sum: { montantEncaisse: true },
            _count: true,
        });

        const result = {
            totalEncaisse: Number(totals._sum.montantEncaisse) || 0,
            totalCommissions: Number(totals._sum.commissionCapco) || 0,
            totalNetProprietaire: Number(totals._sum.netProprietaire) || 0,
            nombreEncaissements: totals._count,
            parMode: parMode.map(m => ({
                mode: m.modePaiement,
                montant: Number(m._sum.montantEncaisse) || 0,
                nombre: m._count,
            })),
        };

        this.statsCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    }

    private static mapToResponseDto(encaissement: EncaissementWithInclude) {
        return {
            id: encaissement.id,
            lotId: encaissement.lotId,
            moisConcerne: encaissement.moisConcerne,
            dateEncaissement: encaissement.dateEncaissement,
            montantEncaisse: Number(encaissement.montantEncaisse),
            modePaiement: encaissement.modePaiement,
            observation: encaissement.observation,
            commissionCapco: Number(encaissement.commissionCapco),
            netProprietaire: Number(encaissement.netProprietaire),
            lotNumero: encaissement.lot?.numero,
            immeubleNom: encaissement.lot?.immeuble?.nom,
            immeubleReference: encaissement.lot?.immeuble?.reference,
            locataireNom: encaissement.lot?.locataire?.nom,
            createdAt: encaissement.createdAt,
        };
    }
}
