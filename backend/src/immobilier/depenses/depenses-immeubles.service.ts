import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { handlePrismaError } from '../../common/utils/prisma-error.utils';
import { CreateDepenseImmeubleDto } from './dto/create-depense-immeuble.dto';
import { UpdateDepenseImmeubleDto } from './dto/update-depense-immeuble.dto';
import { parseDate } from '../../common/utils/date.utils';

type DepenseWithImmeuble = Prisma.DepensesImmeublesGetPayload<{
    include: typeof DepensesImmeublesService['DEFAULT_INCLUDE'];
}>;

@Injectable()
export class DepensesImmeublesService {
    constructor(private readonly prisma: PrismaService) { }

    private static readonly DEFAULT_INCLUDE = {
        immeuble: { select: { nom: true, reference: true } },
    } satisfies Prisma.DepensesImmeublesInclude;

    async create(createDto: CreateDepenseImmeubleDto, userId: string) {
        const immeuble = await this.prisma.immeubles.findUnique({
            where: { id: createDto.immeubleId },
        });

        if (!immeuble) {
            throw new NotFoundException(`Immeuble avec l'ID ${createDto.immeubleId} non trouvé`);
        }

        const depense = await this.prisma.depensesImmeubles.create({
            data: {
                immeubleId: createDto.immeubleId,
                date: parseDate(createDto.date),
                nature: createDto.nature,
                description: createDto.description,
                montant: createDto.montant,
                typeDepense: createDto.typeDepense || 'AUTRES_DEPENSES',
                justificatif: createDto.justificatif,
                createdBy: userId,
            },
            include: DepensesImmeublesService.DEFAULT_INCLUDE,
        });

        return DepensesImmeublesService.mapToResponseDto(depense);
    }

    async findByImmeuble(immeubleId: string) {
        const depenses = await this.prisma.depensesImmeubles.findMany({
            where: { immeubleId },
            include: DepensesImmeublesService.DEFAULT_INCLUDE,
            orderBy: { date: 'desc' },
        });

        return depenses.map(DepensesImmeublesService.mapToResponseDto);
    }

    async findOne(id: string) {
        const depense = await this.prisma.depensesImmeubles.findUnique({
            where: { id },
            include: DepensesImmeublesService.DEFAULT_INCLUDE,
        });

        if (!depense) {
            throw new NotFoundException(`Dépense avec l'ID ${id} non trouvée`);
        }

        return DepensesImmeublesService.mapToResponseDto(depense);
    }

    async update(id: string, updateDto: UpdateDepenseImmeubleDto) {
        const data: Prisma.DepensesImmeublesUncheckedUpdateInput = {};
        if (updateDto.date) data.date = parseDate(updateDto.date);
        if (updateDto.nature !== undefined) data.nature = updateDto.nature;
        if (updateDto.description !== undefined) data.description = updateDto.description;
        if (updateDto.montant !== undefined) data.montant = updateDto.montant;
        if (updateDto.typeDepense) data.typeDepense = updateDto.typeDepense;
        if (updateDto.justificatif !== undefined) data.justificatif = updateDto.justificatif;

        try {
            const depense = await this.prisma.depensesImmeubles.update({
                where: { id },
                data,
                include: DepensesImmeublesService.DEFAULT_INCLUDE,
            });

            return DepensesImmeublesService.mapToResponseDto(depense);
        } catch (error) {
            handlePrismaError(error, 'Dépense immeuble');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            await this.prisma.depensesImmeubles.delete({ where: { id } });
        } catch (error) {
            handlePrismaError(error, 'Dépense immeuble');
        }
    }

    async getStatistics(immeubleId?: string) {
        const where: Prisma.DepensesImmeublesWhereInput = {};
        if (immeubleId) where.immeubleId = immeubleId;

        const result = await this.prisma.depensesImmeubles.aggregate({
            where,
            _sum: { montant: true },
            _count: true,
        });

        const parType = await this.prisma.depensesImmeubles.groupBy({
            by: ['typeDepense'],
            where,
            _sum: { montant: true },
            _count: true,
        });

        return {
            totalMontant: Number(result._sum.montant) || 0,
            nombreDepenses: result._count,
            parType: parType.map(t => ({
                type: t.typeDepense,
                montant: Number(t._sum.montant) || 0,
                nombre: t._count,
            })),
        };
    }

    private static mapToResponseDto(depense: DepenseWithImmeuble) {
        return {
            id: depense.id,
            immeubleId: depense.immeubleId,
            date: depense.date,
            nature: depense.nature,
            description: depense.description,
            montant: Number(depense.montant),
            typeDepense: depense.typeDepense,
            justificatif: depense.justificatif,
            immeubleNom: depense.immeuble?.nom,
            immeubleReference: depense.immeuble?.reference,
            createdAt: depense.createdAt,
        };
    }
}
