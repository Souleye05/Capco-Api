import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateHonoraireRecouvrementDto } from './dto/create-honoraire-recouvrement.dto';
import { UpdateHonoraireRecouvrementDto } from './dto/update-honoraire-recouvrement.dto';

@Injectable()
export class HonorairesRecouvrementService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateHonoraireRecouvrementDto, userId: string) {
        const dossier = await this.prisma.dossiersRecouvrement.findUnique({
            where: { id: createDto.dossierId },
        });

        if (!dossier) {
            throw new NotFoundException(`Dossier avec l'ID ${createDto.dossierId} non trouvé`);
        }

        const honoraire = await this.prisma.honorairesRecouvrement.create({
            data: {
                dossierId: createDto.dossierId,
                type: createDto.type || 'FORFAIT',
                montantPrevu: createDto.montantPrevu || 0,
                pourcentage: createDto.pourcentage,
                montantPaye: createDto.montantPaye || 0,
                createdBy: userId,
            },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return this.mapToResponseDto(honoraire);
    }

    async findByDossier(dossierId: string) {
        const honoraires = await this.prisma.honorairesRecouvrement.findMany({
            where: { dossierId },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return honoraires.map(h => this.mapToResponseDto(h));
    }

    async findOne(id: string) {
        const honoraire = await this.prisma.honorairesRecouvrement.findUnique({
            where: { id },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        if (!honoraire) {
            throw new NotFoundException(`Honoraire avec l'ID ${id} non trouvé`);
        }

        return this.mapToResponseDto(honoraire);
    }

    async update(id: string, updateDto: UpdateHonoraireRecouvrementDto) {
        await this.findOne(id);

        const honoraire = await this.prisma.honorairesRecouvrement.update({
            where: { id },
            data: {
                type: updateDto.type,
                montantPrevu: updateDto.montantPrevu,
                pourcentage: updateDto.pourcentage,
                montantPaye: updateDto.montantPaye,
            },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return this.mapToResponseDto(honoraire);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.prisma.honorairesRecouvrement.delete({ where: { id } });
    }

    private mapToResponseDto(honoraire: any) {
        return {
            id: honoraire.id,
            dossierId: honoraire.dossierId,
            type: honoraire.type,
            montantPrevu: Number(honoraire.montantPrevu),
            pourcentage: honoraire.pourcentage ? Number(honoraire.pourcentage) : null,
            montantPaye: Number(honoraire.montantPaye),
            montantRestant: Number(honoraire.montantPrevu) - Number(honoraire.montantPaye),
            dossierReference: honoraire.dossiersRecouvrement?.reference,
            createdAt: honoraire.createdAt,
        };
    }
}
