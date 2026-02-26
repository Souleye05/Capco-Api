import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutBail } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { handlePrismaError } from '../../common/utils/prisma-error.utils';
import { CreateBailDto } from './dto/create-bail.dto';
import { UpdateBailDto } from './dto/update-bail.dto';

type BailWithInclude = Prisma.BauxGetPayload<{
    include: typeof BauxService['DEFAULT_INCLUDE'];
}>;

@Injectable()
export class BauxService {
    constructor(private readonly prisma: PrismaService) { }

    private static readonly DEFAULT_INCLUDE = {
        lot: {
            select: {
                id: true,
                numero: true,
                immeuble: { select: { id: true, nom: true, reference: true } },
            },
        },
        locataire: {
            select: { id: true, nom: true, telephone: true },
        },
    } satisfies Prisma.BauxInclude;

    async create(createDto: CreateBailDto, userId: string) {
        try {
            const lot = await this.prisma.lots.findUnique({
                where: { id: createDto.lotId },
            });

            if (!lot) {
                throw new NotFoundException(`Lot avec l'ID ${createDto.lotId} non trouvé`);
            }

            const locataire = await this.prisma.locataires.findUnique({
                where: { id: createDto.locataireId },
            });

            if (!locataire) {
                throw new NotFoundException(`Locataire avec l'ID ${createDto.locataireId} non trouvé`);
            }

            const result = await this.prisma.$transaction(async (tx) => {
                const bail = await tx.baux.create({
                    data: {
                        lotId: createDto.lotId,
                        locataireId: createDto.locataireId,
                        dateDebut: new Date(createDto.dateDebut + 'T00:00:00.000Z'),
                        dateFin: createDto.dateFin ? new Date(createDto.dateFin + 'T00:00:00.000Z') : null,
                        montantLoyer: createDto.montantLoyer,
                        jourPaiementPrevu: createDto.jourPaiementPrevu || 5,
                        statut: createDto.statut || StatutBail.ACTIF,
                        createdBy: userId,
                    },
                    include: BauxService.DEFAULT_INCLUDE,
                });

                if (createDto.statut !== StatutBail.INACTIF) {
                    await tx.lots.update({
                        where: { id: createDto.lotId },
                        data: {
                            statut: 'OCCUPE',
                            locataireId: createDto.locataireId,
                            loyerMensuelAttendu: createDto.montantLoyer,
                        },
                    });
                }

                return bail;
            });

            return BauxService.mapToResponseDto(result);
        } catch (error) {
            handlePrismaError(error, 'Bail');
        }
    }

    async findByLot(lotId: string) {
        const baux = await this.prisma.baux.findMany({
            where: { lotId },
            include: BauxService.DEFAULT_INCLUDE,
            orderBy: { dateDebut: 'desc' },
        });

        return baux.map(BauxService.mapToResponseDto);
    }

    async findByLocataire(locataireId: string) {
        const baux = await this.prisma.baux.findMany({
            where: { locataireId },
            include: BauxService.DEFAULT_INCLUDE,
            orderBy: { dateDebut: 'desc' },
        });

        return baux.map(BauxService.mapToResponseDto);
    }

    async findOne(id: string) {
        const bail = await this.prisma.baux.findUnique({
            where: { id },
            include: BauxService.DEFAULT_INCLUDE,
        });

        if (!bail) {
            throw new NotFoundException(`Bail avec l'ID ${id} non trouvé`);
        }

        return BauxService.mapToResponseDto(bail);
    }

    async update(id: string, updateDto: UpdateBailDto) {
        try {
            const data: Prisma.BauxUncheckedUpdateInput = {};
            if (updateDto.dateDebut) data.dateDebut = new Date(updateDto.dateDebut + 'T00:00:00.000Z');
            if (updateDto.dateFin !== undefined) data.dateFin = updateDto.dateFin ? new Date(updateDto.dateFin + 'T00:00:00.000Z') : null;
            if (updateDto.montantLoyer !== undefined) data.montantLoyer = updateDto.montantLoyer;
            if (updateDto.jourPaiementPrevu !== undefined) data.jourPaiementPrevu = updateDto.jourPaiementPrevu;
            if (updateDto.statut !== undefined) data.statut = updateDto.statut;

            const result = await this.prisma.$transaction(async (tx) => {
                const bail = await tx.baux.update({
                    where: { id },
                    data,
                    include: BauxService.DEFAULT_INCLUDE,
                });

                // Consolidate lot updates into a single operation
                const lotUpdateData: Prisma.LotsUncheckedUpdateInput = {};
                let shouldUpdateLot = false;

                if (updateDto.statut === StatutBail.INACTIF) {
                    lotUpdateData.statut = 'LIBRE';
                    lotUpdateData.locataireId = null;
                    shouldUpdateLot = true;
                } else if (updateDto.montantLoyer !== undefined) {
                    lotUpdateData.loyerMensuelAttendu = updateDto.montantLoyer;
                    shouldUpdateLot = true;
                }

                if (shouldUpdateLot) {
                    await tx.lots.update({
                        where: { id: bail.lotId },
                        data: lotUpdateData,
                    });
                }

                return bail;
            });

            return BauxService.mapToResponseDto(result);
        } catch (error) {
            handlePrismaError(error, 'Bail');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            await this.prisma.$transaction(async (tx) => {
                const bail = await tx.baux.delete({
                    where: { id },
                    select: { lotId: true, statut: true }
                });

                if (bail.statut === StatutBail.ACTIF) {
                    const otherActiveBaux = await tx.baux.count({
                        where: { lotId: bail.lotId, statut: 'ACTIF' },
                    });

                    if (otherActiveBaux === 0) {
                        await tx.lots.update({
                            where: { id: bail.lotId },
                            data: { statut: 'LIBRE', locataireId: null },
                        });
                    }
                }
            });
        } catch (error) {
            handlePrismaError(error, 'Bail');
        }
    }

    private static mapToResponseDto(bail: BailWithInclude) {
        return {
            id: bail.id,
            lotId: bail.lotId,
            locataireId: bail.locataireId,
            dateDebut: bail.dateDebut,
            dateFin: bail.dateFin,
            montantLoyer: Number(bail.montantLoyer),
            jourPaiementPrevu: bail.jourPaiementPrevu,
            statut: bail.statut,
            locataireNom: bail.locataire?.nom,
            locataireTelephone: bail.locataire?.telephone,
            lotNumero: bail.lot?.numero,
            immeubleNom: bail.lot?.immeuble?.nom,
            immeubleReference: bail.lot?.immeuble?.reference,
            createdAt: bail.createdAt,
        };
    }
}
