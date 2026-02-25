import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { handlePrismaError } from '../../common/utils/prisma-error.utils';
import { CreateImmeubleDto } from './dto/create-immeuble.dto';
import { UpdateImmeubleDto } from './dto/update-immeuble.dto';
import { ImmeubleResponseDto } from './dto/immeuble-response.dto';
import { ImmeublesQueryDto } from './dto/immeubles-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

type ImmeubleWithInclude = Prisma.ImmeublesGetPayload<{
    include: typeof ImmeublesService['DEFAULT_INCLUDE'];
}>;

@Injectable()
export class ImmeublesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly referenceGenerator: ReferenceGeneratorService,
    ) { }

    private static readonly DEFAULT_INCLUDE = {
        proprietaire: {
            select: { id: true, nom: true },
        },
        lots: {
            select: {
                id: true,
                numero: true,
                etage: true,
                type: true,
                loyerMensuelAttendu: true,
                statut: true,
                locataire: {
                    select: { id: true, nom: true },
                },
            },
            orderBy: { numero: 'asc' as const },
        },
    } satisfies Prisma.ImmeublesInclude;

    async create(createDto: CreateImmeubleDto, userId: string): Promise<ImmeubleResponseDto> {
        const proprietaire = await this.prisma.proprietaires.findUnique({
            where: { id: createDto.proprietaireId },
        });

        if (!proprietaire) {
            throw new NotFoundException(`Propriétaire avec l'ID ${createDto.proprietaireId} non trouvé`);
        }

        const reference = await this.referenceGenerator.generateImmeubleReference();

        const immeuble = await this.prisma.immeubles.create({
            data: {
                proprietaireId: createDto.proprietaireId,
                nom: createDto.nom,
                reference,
                adresse: createDto.adresse,
                tauxCommissionCapco: createDto.tauxCommissionCapco,
                notes: createDto.notes,
                createdBy: userId,
            },
            include: ImmeublesService.DEFAULT_INCLUDE,
        });

        return ImmeublesService.mapToResponseDto(immeuble);
    }

    async findAll(query: ImmeublesQueryDto): Promise<PaginatedResponse<ImmeubleResponseDto>> {
        const where: Prisma.ImmeublesWhereInput = {};
        if (query.proprietaireId) where.proprietaireId = query.proprietaireId;

        const result = await this.paginationService.paginate(
            this.prisma.immeubles,
            query,
            {
                where,
                include: ImmeublesService.DEFAULT_INCLUDE,
                searchFields: ['nom', 'reference', 'adresse', 'notes'],
                defaultSortBy: 'createdAt',
            },
        );

        return {
            data: result.data.map((i: ImmeubleWithInclude) => ImmeublesService.mapToResponseDto(i)),
            pagination: result.pagination,
        };
    }

    async findOne(id: string): Promise<ImmeubleResponseDto> {
        const immeuble = await this.prisma.immeubles.findUnique({
            where: { id },
            include: ImmeublesService.DEFAULT_INCLUDE,
        });

        if (!immeuble) {
            throw new NotFoundException(`Immeuble avec l'ID ${id} non trouvé`);
        }

        return ImmeublesService.mapToResponseDto(immeuble);
    }

    async update(id: string, updateDto: UpdateImmeubleDto): Promise<ImmeubleResponseDto> {
        const data: Prisma.ImmeublesUpdateInput = {};
        if (updateDto.nom !== undefined) data.nom = updateDto.nom;
        if (updateDto.adresse !== undefined) data.adresse = updateDto.adresse;
        if (updateDto.tauxCommissionCapco !== undefined) data.tauxCommissionCapco = updateDto.tauxCommissionCapco;
        if (updateDto.notes !== undefined) data.notes = updateDto.notes;

        try {
            const immeuble = await this.prisma.immeubles.update({
                where: { id },
                data,
                include: ImmeublesService.DEFAULT_INCLUDE,
            });

            return ImmeublesService.mapToResponseDto(immeuble);
        } catch (error) {
            handlePrismaError(error, 'Immeuble');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            await this.prisma.immeubles.delete({ where: { id } });
        } catch (error) {
            handlePrismaError(error, 'Immeuble');
        }
    }

    async getStatistics() {
        const [totalImmeubles, totalLots, lotsOccupes, lotsLibres] = await Promise.all([
            this.prisma.immeubles.count(),
            this.prisma.lots.count(),
            this.prisma.lots.count({ where: { statut: 'OCCUPE' } }),
            this.prisma.lots.count({ where: { statut: 'LIBRE' } }),
        ]);

        const totalLoyers = await this.prisma.encaissementsLoyers.aggregate({
            _sum: { montantEncaisse: true },
        });

        const totalDepenses = await this.prisma.depensesImmeubles.aggregate({
            _sum: { montant: true },
        });

        return {
            totalImmeubles,
            totalLots,
            lotsOccupes,
            lotsLibres,
            tauxOccupation: totalLots > 0 ? Math.round((lotsOccupes / totalLots) * 100) : 0,
            totalLoyersEncaisses: Number(totalLoyers._sum.montantEncaisse) || 0,
            totalDepenses: Number(totalDepenses._sum.montant) || 0,
        };
    }

    private static mapToResponseDto(immeuble: ImmeubleWithInclude): ImmeubleResponseDto {
        const lots = immeuble.lots;
        const lotsOccupes = lots.filter((l) => l.statut === 'OCCUPE').length;
        const lotsLibres = lots.filter((l) => l.statut === 'LIBRE').length;

        return {
            id: immeuble.id,
            proprietaireId: immeuble.proprietaireId,
            nom: immeuble.nom,
            reference: immeuble.reference,
            adresse: immeuble.adresse,
            tauxCommissionCapco: Number(immeuble.tauxCommissionCapco),
            notes: immeuble.notes ?? undefined,
            proprietaireNom: immeuble.proprietaire?.nom,
            nombreLots: lots.length,
            lotsOccupes,
            lotsLibres,
            lots: lots.map((l) => ({
                id: l.id,
                numero: l.numero,
                etage: l.etage,
                type: l.type,
                loyerMensuelAttendu: Number(l.loyerMensuelAttendu),
                statut: l.statut,
                locataireNom: l.locataire?.nom,
            })),
            createdAt: immeuble.createdAt,
        };
    }
}
