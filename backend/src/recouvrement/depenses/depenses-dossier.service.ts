import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateDepenseDossierDto } from './dto/create-depense-dossier.dto';
import { UpdateDepenseDossierDto } from './dto/update-depense-dossier.dto';

@Injectable()
export class DepensesDossierService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateDepenseDossierDto, userId: string) {
        const dossier = await this.prisma.dossiersRecouvrement.findUnique({
            where: { id: createDto.dossierId },
        });

        if (!dossier) {
            throw new NotFoundException(`Dossier avec l'ID ${createDto.dossierId} non trouvé`);
        }

        const depense = await this.prisma.depensesDossier.create({
            data: {
                dossierId: createDto.dossierId,
                date: new Date(createDto.date + 'T00:00:00.000Z'),
                nature: createDto.nature,
                typeDepense: createDto.typeDepense || 'AUTRES',
                montant: createDto.montant,
                justificatif: createDto.justificatif,
                createdBy: userId,
            },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return this.mapToResponseDto(depense);
    }

    async findByDossier(dossierId: string) {
        const depenses = await this.prisma.depensesDossier.findMany({
            where: { dossierId },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
            orderBy: { date: 'desc' },
        });

        return depenses.map(d => this.mapToResponseDto(d));
    }

    async findOne(id: string) {
        const depense = await this.prisma.depensesDossier.findUnique({
            where: { id },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        if (!depense) {
            throw new NotFoundException(`Dépense avec l'ID ${id} non trouvée`);
        }

        return this.mapToResponseDto(depense);
    }

    async update(id: string, updateDto: UpdateDepenseDossierDto) {
        await this.findOne(id);

        const data: any = {};
        if (updateDto.date) data.date = new Date(updateDto.date + 'T00:00:00.000Z');
        if (updateDto.nature !== undefined) data.nature = updateDto.nature;
        if (updateDto.typeDepense) data.typeDepense = updateDto.typeDepense;
        if (updateDto.montant !== undefined) data.montant = updateDto.montant;
        if (updateDto.justificatif !== undefined) data.justificatif = updateDto.justificatif;

        const depense = await this.prisma.depensesDossier.update({
            where: { id },
            data,
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return this.mapToResponseDto(depense);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.prisma.depensesDossier.delete({ where: { id } });
    }

    async getStatistics() {
        const result = await this.prisma.depensesDossier.aggregate({
            _sum: { montant: true },
            _count: true,
        });

        const parType = await this.prisma.depensesDossier.groupBy({
            by: ['typeDepense'],
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

    private mapToResponseDto(depense: any) {
        return {
            id: depense.id,
            dossierId: depense.dossierId,
            date: depense.date,
            nature: depense.nature,
            typeDepense: depense.typeDepense,
            montant: Number(depense.montant),
            justificatif: depense.justificatif,
            dossierReference: depense.dossiersRecouvrement?.reference,
            createdAt: depense.createdAt,
        };
    }
}
