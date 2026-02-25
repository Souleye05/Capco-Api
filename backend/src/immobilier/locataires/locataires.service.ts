import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { handlePrismaError } from '../../common/utils/prisma-error.utils';
import { CreateLocataireDto } from './dto/create-locataire.dto';
import { UpdateLocataireDto } from './dto/update-locataire.dto';
import { LocataireResponseDto } from './dto/locataire-response.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

type LocataireWithInclude = Prisma.LocatairesGetPayload<{
    include: typeof LocatairesService['DEFAULT_INCLUDE'];
}>;

@Injectable()
export class LocatairesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
    ) { }

    private static readonly DEFAULT_INCLUDE = {
        lots: {
            select: {
                id: true,
                numero: true,
                etage: true,
                type: true,
                statut: true,
                loyerMensuelAttendu: true,
                immeuble: {
                    select: { id: true, nom: true, reference: true },
                },
            },
        },
        baux: {
            where: { statut: 'ACTIF' as const },
            select: {
                id: true,
                dateDebut: true,
                dateFin: true,
                montantLoyer: true,
                jourPaiementPrevu: true,
                statut: true,
                lot: {
                    select: { id: true, numero: true, immeuble: { select: { nom: true } } },
                },
            },
        },
    } satisfies Prisma.LocatairesInclude;

    async create(createDto: CreateLocataireDto, userId: string): Promise<LocataireResponseDto> {
        const locataire = await this.prisma.locataires.create({
            data: {
                nom: createDto.nom,
                telephone: createDto.telephone,
                email: createDto.email,
                createdBy: userId,
            },
            include: LocatairesService.DEFAULT_INCLUDE,
        });

        return LocatairesService.mapToResponseDto(locataire);
    }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<LocataireResponseDto>> {
        const result = await this.paginationService.paginate(
            this.prisma.locataires,
            query,
            {
                include: LocatairesService.DEFAULT_INCLUDE,
                searchFields: ['nom', 'telephone', 'email'],
                defaultSortBy: 'createdAt',
            },
        );

        return {
            data: result.data.map((l: LocataireWithInclude) => LocatairesService.mapToResponseDto(l)),
            pagination: result.pagination,
        };
    }

    async findOne(id: string): Promise<LocataireResponseDto> {
        const locataire = await this.prisma.locataires.findUnique({
            where: { id },
            include: LocatairesService.DEFAULT_INCLUDE,
        });

        if (!locataire) {
            throw new NotFoundException(`Locataire avec l'ID ${id} non trouvé`);
        }

        return LocatairesService.mapToResponseDto(locataire);
    }

    async update(id: string, updateDto: UpdateLocataireDto): Promise<LocataireResponseDto> {
        const data: Prisma.LocatairesUpdateInput = {};
        if (updateDto.nom !== undefined) data.nom = updateDto.nom;
        if (updateDto.telephone !== undefined) data.telephone = updateDto.telephone;
        if (updateDto.email !== undefined) data.email = updateDto.email;

        try {
            const locataire = await this.prisma.locataires.update({
                where: { id },
                data,
                include: LocatairesService.DEFAULT_INCLUDE,
            });

            return LocatairesService.mapToResponseDto(locataire);
        } catch (error) {
            handlePrismaError(error, 'Locataire');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            await this.prisma.locataires.delete({ where: { id } });
        } catch (error) {
            handlePrismaError(error, 'Locataire');
        }
    }

    private static mapToResponseDto(locataire: LocataireWithInclude): LocataireResponseDto {
        return {
            id: locataire.id,
            nom: locataire.nom,
            telephone: locataire.telephone ?? undefined,
            email: locataire.email ?? undefined,
            nombreLots: locataire.lots.length,
            nombreBauxActifs: locataire.baux.length,
            lots: locataire.lots.map((l) => ({
                id: l.id,
                numero: l.numero,
                etage: l.etage,
                type: l.type,
                statut: l.statut,
                loyerMensuelAttendu: Number(l.loyerMensuelAttendu),
                immeubleNom: l.immeuble?.nom,
                immeubleReference: l.immeuble?.reference,
            })),
            baux: locataire.baux.map((b) => ({
                id: b.id,
                dateDebut: b.dateDebut,
                dateFin: b.dateFin,
                montantLoyer: Number(b.montantLoyer),
                jourPaiementPrevu: b.jourPaiementPrevu,
                statut: b.statut,
                lotNumero: b.lot?.numero,
                immeubleNom: b.lot?.immeuble?.nom,
            })),
            createdAt: locataire.createdAt,
        };
    }
}
