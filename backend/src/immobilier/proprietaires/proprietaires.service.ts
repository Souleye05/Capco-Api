import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { handlePrismaError } from '../../common/utils/prisma-error.utils';
import { CreateProprietaireDto } from './dto/create-proprietaire.dto';
import { UpdateProprietaireDto } from './dto/update-proprietaire.dto';
import { ProprietaireResponseDto } from './dto/proprietaire-response.dto';
import { ProprietairesQueryDto } from './dto/proprietaires-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

/** Shape returned by Prisma when using DEFAULT_INCLUDE */
type ProprietaireWithInclude = Prisma.ProprietairesGetPayload<{
    include: typeof ProprietairesService['DEFAULT_INCLUDE'];
}>;

@Injectable()
export class ProprietairesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
    ) { }

    /** Default include for Proprietaire queries */
    private static readonly DEFAULT_INCLUDE = {
        immeubles: {
            select: {
                id: true,
                nom: true,
                reference: true,
                adresse: true,
                tauxCommissionCapco: true,
            },
            orderBy: { createdAt: 'desc' as const },
        },
    } satisfies Prisma.ProprietairesInclude;

    /**
     * Créer un nouveau propriétaire
     */
    async create(createDto: CreateProprietaireDto, userId: string): Promise<ProprietaireResponseDto> {
        const proprietaire = await this.prisma.proprietaires.create({
            data: {
                nom: createDto.nom,
                telephone: createDto.telephone,
                email: createDto.email,
                adresse: createDto.adresse,
                createdBy: userId,
            },
            include: ProprietairesService.DEFAULT_INCLUDE,
        });

        return ProprietairesService.mapToResponseDto(proprietaire);
    }

    /**
     * Récupérer tous les propriétaires avec pagination
     */
    async findAll(query: ProprietairesQueryDto): Promise<PaginatedResponse<ProprietaireResponseDto>> {
        const where: Prisma.ProprietairesWhereInput = {};

        if (query.withImmeublesOnly === 'true') {
            where.immeubles = { some: {} };
        }

        const result = await this.paginationService.paginate(
            this.prisma.proprietaires,
            query,
            {
                where,
                include: ProprietairesService.DEFAULT_INCLUDE,
                searchFields: ['nom', 'telephone', 'email', 'adresse'],
                defaultSortBy: 'createdAt',
            },
        );

        return {
            data: result.data.map((p: ProprietaireWithInclude) => ProprietairesService.mapToResponseDto(p)),
            pagination: result.pagination,
        };
    }

    /**
     * Récupérer un propriétaire par ID
     */
    async findOne(id: string): Promise<ProprietaireResponseDto> {
        const proprietaire = await this.prisma.proprietaires.findUnique({
            where: { id },
            include: ProprietairesService.DEFAULT_INCLUDE,
        });

        if (!proprietaire) {
            throw new NotFoundException(`Propriétaire avec l'ID ${id} non trouvé`);
        }

        return ProprietairesService.mapToResponseDto(proprietaire);
    }

    /**
     * Mettre à jour un propriétaire — single query + P2025 catch
     */
    async update(id: string, updateDto: UpdateProprietaireDto): Promise<ProprietaireResponseDto> {
        const data: Prisma.ProprietairesUpdateInput = {};
        if (updateDto.nom !== undefined) data.nom = updateDto.nom;
        if (updateDto.telephone !== undefined) data.telephone = updateDto.telephone;
        if (updateDto.email !== undefined) data.email = updateDto.email;
        if (updateDto.adresse !== undefined) data.adresse = updateDto.adresse;

        try {
            const proprietaire = await this.prisma.proprietaires.update({
                where: { id },
                data,
                include: ProprietairesService.DEFAULT_INCLUDE,
            });

            return ProprietairesService.mapToResponseDto(proprietaire);
        } catch (error) {
            handlePrismaError(error, 'Propriétaire');
        }
    }

    /**
     * Supprimer un propriétaire — single atomic operation
     */
    async remove(id: string): Promise<void> {
        try {
            await this.prisma.proprietaires.delete({ where: { id } });
        } catch (error) {
            handlePrismaError(error, 'Propriétaire');
        }
    }

    /**
     * Obtenir les statistiques des propriétaires
     */
    async getStatistics() {
        const [totalProprietaires, totalImmeubles] = await Promise.all([
            this.prisma.proprietaires.count(),
            this.prisma.immeubles.count(),
        ]);

        return {
            totalProprietaires,
            totalImmeubles,
        };
    }

    private static mapToResponseDto(proprietaire: ProprietaireWithInclude): ProprietaireResponseDto {
        return {
            id: proprietaire.id,
            nom: proprietaire.nom,
            telephone: proprietaire.telephone ?? undefined,
            email: proprietaire.email ?? undefined,
            adresse: proprietaire.adresse ?? undefined,
            nombreImmeubles: proprietaire.immeubles.length,
            immeubles: proprietaire.immeubles.map((i) => ({
                id: i.id,
                nom: i.nom,
                reference: i.reference,
                adresse: i.adresse,
                tauxCommissionCapco: Number(i.tauxCommissionCapco),
            })),
            createdAt: proprietaire.createdAt,
        };
    }
}
