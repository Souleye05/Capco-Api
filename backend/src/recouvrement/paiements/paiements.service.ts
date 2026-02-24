import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { PaiementResponseDto } from './dto/paiement-response.dto';
import { parseDate } from '../../common/utils/date.utils';

@Injectable()
export class PaiementsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        dossierId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{ data: PaiementResponseDto[]; total: number }> {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (params.dossierId) {
            where.dossierId = params.dossierId;
        }

        if (params.startDate || params.endDate) {
            where.date = {};
            if (params.startDate) where.date.gte = parseDate(params.startDate);
            if (params.endDate) where.date.lte = parseDate(params.endDate);
        }

        if (params.search) {
            where.OR = [
                { reference: { contains: params.search, mode: 'insensitive' } },
                { commentaire: { contains: params.search, mode: 'insensitive' } },
                {
                    dossiersRecouvrement: {
                        OR: [
                            { reference: { contains: params.search, mode: 'insensitive' } },
                            { debiteurNom: { contains: params.search, mode: 'insensitive' } },
                            { creancierNom: { contains: params.search, mode: 'insensitive' } },
                        ]
                    }
                },
            ];
        }

        const [paiements, total] = await Promise.all([
            this.prisma.paiementsRecouvrement.findMany({
                where,
                skip,
                take: limit,
                include: {
                    dossiersRecouvrement: {
                        select: {
                            reference: true,
                            debiteurNom: true,
                            creancierNom: true,
                        }
                    },
                },
                orderBy: { date: 'desc' },
            }),
            this.prisma.paiementsRecouvrement.count({ where }),
        ]);

        return {
            data: paiements.map(p => this.mapToResponseDto(p)),
            total,
        };
    }

    async create(createPaiementDto: CreatePaiementDto, userId: string): Promise<PaiementResponseDto> {
        // Vérifier que le dossier existe
        const dossier = await this.prisma.dossiersRecouvrement.findUnique({
            where: { id: createPaiementDto.dossierId },
        });

        if (!dossier) {
            throw new NotFoundException(`Dossier avec l'ID ${createPaiementDto.dossierId} non trouvé`);
        }

        const paiement = await this.prisma.paiementsRecouvrement.create({
            data: {
                dossierId: createPaiementDto.dossierId,
                date: parseDate(createPaiementDto.date),
                montant: createPaiementDto.montant,
                mode: createPaiementDto.mode,
                reference: createPaiementDto.reference,
                commentaire: createPaiementDto.commentaire,
                createdBy: userId,
            },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return this.mapToResponseDto(paiement);
    }

    async findByDossier(dossierId: string): Promise<PaiementResponseDto[]> {
        const paiements = await this.prisma.paiementsRecouvrement.findMany({
            where: { dossierId },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
            orderBy: { date: 'desc' },
        });

        return paiements.map(p => this.mapToResponseDto(p));
    }

    async findOne(id: string): Promise<PaiementResponseDto> {
        const paiement = await this.prisma.paiementsRecouvrement.findUnique({
            where: { id },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        if (!paiement) {
            throw new NotFoundException(`Paiement avec l'ID ${id} non trouvé`);
        }

        return this.mapToResponseDto(paiement);
    }

    async update(id: string, updatePaiementDto: UpdatePaiementDto): Promise<PaiementResponseDto> {
        await this.findOne(id);

        const data: any = {};
        if (updatePaiementDto.date) data.date = parseDate(updatePaiementDto.date);
        if (updatePaiementDto.montant !== undefined) data.montant = updatePaiementDto.montant;
        if (updatePaiementDto.mode) data.mode = updatePaiementDto.mode;
        if (updatePaiementDto.reference !== undefined) data.reference = updatePaiementDto.reference;
        if (updatePaiementDto.commentaire !== undefined) data.commentaire = updatePaiementDto.commentaire;

        const paiement = await this.prisma.paiementsRecouvrement.update({
            where: { id },
            data,
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return this.mapToResponseDto(paiement);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.prisma.paiementsRecouvrement.delete({ where: { id } });
    }

    async getStatistics(params: {
        dossierId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    } = {}) {
        const where: any = {};

        if (params.dossierId) where.dossierId = params.dossierId;
        if (params.startDate || params.endDate) {
            where.date = {};
            if (params.startDate) where.date.gte = parseDate(params.startDate);
            if (params.endDate) where.date.lte = parseDate(params.endDate);
        }

        if (params.search) {
            where.OR = [
                { reference: { contains: params.search, mode: 'insensitive' } },
                {
                    dossiersRecouvrement: {
                        OR: [
                            { reference: { contains: params.search, mode: 'insensitive' } },
                            { debiteurNom: { contains: params.search, mode: 'insensitive' } },
                        ]
                    }
                }
            ];
        }

        const result = await this.prisma.paiementsRecouvrement.aggregate({
            where,
            _sum: { montant: true },
            _count: true,
            _max: { date: true },
        });

        // Répartition par mode de paiement
        const parMode = await this.prisma.paiementsRecouvrement.groupBy({
            by: ['mode'],
            _sum: { montant: true },
            _count: true,
        });

        return {
            totalMontant: Number(result._sum.montant) || 0,
            nombrePaiements: result._count,
            dernierPaiement: result._max.date,
            parMode: parMode.map(m => ({
                mode: m.mode,
                montant: Number(m._sum.montant) || 0,
                nombre: m._count,
            })),
        };
    }

    private mapToResponseDto(paiement: any): PaiementResponseDto {
        return {
            id: paiement.id,
            dossierId: paiement.dossierId,
            date: paiement.date,
            montant: Number(paiement.montant),
            mode: paiement.mode,
            reference: paiement.reference,
            commentaire: paiement.commentaire,
            dossierReference: paiement.dossiersRecouvrement?.reference,
            creancierNom: paiement.dossiersRecouvrement?.creancierNom,
            debiteurNom: paiement.dossiersRecouvrement?.debiteurNom,
            createdAt: paiement.createdAt,
        };
    }
}
