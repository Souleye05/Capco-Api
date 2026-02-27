import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutLot, TypeLot } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { handlePrismaError } from '../../common/utils/prisma-error.utils';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { LotResponseDto } from './dto/lot-response.dto';
import { LotsQueryDto } from './dto/lots-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

type LotWithInclude = Prisma.LotsGetPayload<{
    include: typeof LotsService['DEFAULT_INCLUDE'];
}>;

@Injectable()
export class LotsService {
    constructor(private readonly prisma: PrismaService) { }

    private static readonly DEFAULT_INCLUDE = {
        immeuble: {
            select: { id: true, nom: true, reference: true },
        },
        locataire: {
            select: { id: true, nom: true },
        },
    } satisfies Prisma.LotsInclude;

    async create(createDto: CreateLotDto, userId: string): Promise<LotResponseDto> {
        const immeuble = await this.prisma.immeubles.findUnique({
            where: { id: createDto.immeubleId },
        });

        if (!immeuble) {
            throw new NotFoundException(`Immeuble avec l'ID ${createDto.immeubleId} non trouvé`);
        }

        if (createDto.locataireId) {
            const locataire = await this.prisma.locataires.findUnique({
                where: { id: createDto.locataireId },
            });
            if (!locataire) {
                throw new NotFoundException(`Locataire avec l'ID ${createDto.locataireId} non trouvé`);
            }
        }

        const lot = await this.prisma.lots.create({
            data: {
                immeubleId: createDto.immeubleId,
                numero: createDto.numero,
                etage: createDto.etage,
                type: createDto.type || TypeLot.AUTRE,
                loyerMensuelAttendu: createDto.loyerMensuelAttendu || 0,
                statut: createDto.statut || StatutLot.LIBRE,
                locataireId: createDto.locataireId,
                createdBy: userId,
            },
            include: LotsService.DEFAULT_INCLUDE,
        });

        return LotsService.mapToResponseDto(lot);
    }

    async getStatistics(immeubleId?: string) {
        const where: Prisma.LotsWhereInput = {};
        if (immeubleId) where.immeubleId = immeubleId;

        const [total, occupes, libres] = await Promise.all([
            this.prisma.lots.count({ where }),
            this.prisma.lots.count({ where: { ...where, statut: StatutLot.OCCUPE } }),
            this.prisma.lots.count({ where: { ...where, statut: StatutLot.LIBRE } }),
        ]);

        return { total, occupes, libres };
    }

    async findAll(query: LotsQueryDto): Promise<PaginatedResponse<LotResponseDto>> {
        const { page = 1, limit = 20, search, immeubleId, type, statut, sortBy = 'numero', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.LotsWhereInput = {};
        if (immeubleId) where.immeubleId = immeubleId;
        if (type) where.type = type;
        if (statut) where.statut = statut;
        if (search) {
            where.OR = [
                { numero: { contains: search, mode: 'insensitive' } },
                { locataire: { nom: { contains: search, mode: 'insensitive' } } },
                { immeuble: { nom: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [total, items] = await Promise.all([
            this.prisma.lots.count({ where }),
            this.prisma.lots.findMany({
                where,
                include: LotsService.DEFAULT_INCLUDE,
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: items.map(LotsService.mapToResponseDto),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }

    async findByImmeuble(immeubleId: string): Promise<LotResponseDto[]> {
        const lots = await this.prisma.lots.findMany({
            where: { immeubleId },
            include: LotsService.DEFAULT_INCLUDE,
            orderBy: { numero: 'asc' },
        });

        return lots.map(LotsService.mapToResponseDto);
    }

    async findOne(id: string): Promise<LotResponseDto> {
        const lot = await this.prisma.lots.findUnique({
            where: { id },
            include: LotsService.DEFAULT_INCLUDE,
        });

        if (!lot) {
            throw new NotFoundException(`Lot avec l'ID ${id} non trouvé`);
        }

        return LotsService.mapToResponseDto(lot);
    }

    async update(id: string, updateDto: UpdateLotDto): Promise<LotResponseDto> {
        if (updateDto.locataireId) {
            const locataire = await this.prisma.locataires.findUnique({
                where: { id: updateDto.locataireId },
            });
            if (!locataire) {
                throw new NotFoundException(`Locataire avec l'ID ${updateDto.locataireId} non trouvé`);
            }
        }

        const data: Prisma.LotsUpdateInput = {};
        if (updateDto.numero !== undefined) data.numero = updateDto.numero;
        if (updateDto.etage !== undefined) data.etage = updateDto.etage;
        if (updateDto.type !== undefined) data.type = updateDto.type;
        if (updateDto.loyerMensuelAttendu !== undefined) data.loyerMensuelAttendu = updateDto.loyerMensuelAttendu;
        if (updateDto.statut !== undefined) data.statut = updateDto.statut;
        if (updateDto.locataireId !== undefined) data.locataire = updateDto.locataireId
            ? { connect: { id: updateDto.locataireId } }
            : { disconnect: true };

        try {
            const lot = await this.prisma.lots.update({
                where: { id },
                data,
                include: LotsService.DEFAULT_INCLUDE,
            });

            return LotsService.mapToResponseDto(lot);
        } catch (error) {
            handlePrismaError(error, 'Lot');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            await this.prisma.lots.delete({ where: { id } });
        } catch (error) {
            handlePrismaError(error, 'Lot');
        }
    }

    private static mapToResponseDto(lot: LotWithInclude): LotResponseDto {
        return {
            id: lot.id,
            immeubleId: lot.immeubleId,
            numero: lot.numero,
            etage: lot.etage,
            type: lot.type,
            loyerMensuelAttendu: Number(lot.loyerMensuelAttendu),
            statut: lot.statut,
            locataireId: lot.locataireId,
            locataireNom: lot.locataire?.nom,
            immeubleNom: lot.immeuble?.nom,
            immeubleReference: lot.immeuble?.reference,
            createdAt: lot.createdAt,
        };
    }
}
