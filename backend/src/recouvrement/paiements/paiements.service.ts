import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { PaiementResponseDto } from './dto/paiement-response.dto';
import { PaiementsQueryDto } from './dto/paiements-query.dto';
import { dateStringToISODateTime, createDateFilter } from '../../common/utils/date.utils';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class PaiementsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
    ) { }

    async findAll(query: PaiementsQueryDto): Promise<PaginatedResponse<PaiementResponseDto>> {
        const whereClause: any = {};

        if (query.dossierId) whereClause.dossierId = query.dossierId;
        
        // Filtre par période
        if (query.dateDebut || query.dateFin) {
            whereClause.date = createDateFilter(query.dateDebut, query.dateFin);
        }

        const result = await this.paginationService.paginate(
            this.prisma.paiementsRecouvrement,
            query,
            {
                where: whereClause,
                include: {
                    dossiersRecouvrement: {
                        select: {
                            reference: true,
                            debiteurNom: true,
                            creancierNom: true,
                        }
                    },
                },
                searchFields: ['reference', 'commentaire', 'dossiersRecouvrement.reference', 'dossiersRecouvrement.debiteurNom', 'dossiersRecouvrement.creancierNom'],
                defaultSortBy: 'date',
            }
        );

        return {
            data: result.data.map(p => this.mapToResponseDto(p)),
            pagination: result.pagination,
        };
    }

    async create(createPaiementDto: CreatePaiementDto, userId: string): Promise<PaiementResponseDto> {
        // Vérifier que le dossier existe avec ses paiements existants
        const dossier = await this.prisma.dossiersRecouvrement.findUnique({
            where: { id: createPaiementDto.dossierId },
            include: { paiementsRecouvrements: true }
        });

        if (!dossier) {
            throw new NotFoundException(`Dossier avec l'ID ${createPaiementDto.dossierId} non trouvé`);
        }

        // Calculer le solde restant
        const totalDejaPaye = dossier.paiementsRecouvrements.reduce((sum, p) => sum + Number(p.montant), 0);
        const soldeRestant = Number(dossier.totalARecouvrer) - totalDejaPaye;

        if (createPaiementDto.montant > soldeRestant) {
            throw new BadRequestException(`Le montant du paiement (${createPaiementDto.montant}) dépasse le solde restant du dossier (${soldeRestant})`);
        }

        const paiement = await this.prisma.$transaction(async (tx) => {
            const p = await tx.paiementsRecouvrement.create({
                data: {
                    dossierId: createPaiementDto.dossierId,
                    date: new Date(createPaiementDto.date + 'T00:00:00.000Z'),
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

            // Si le dossier est soldé ou dépassement (si on autorisait), on change son statut
            // Ici on est strict, donc pile poil égal
            if (createPaiementDto.montant >= soldeRestant) {
                await tx.dossiersRecouvrement.update({
                    where: { id: dossier.id },
                    data: { statut: 'CLOTURE' }
                });
            }

            return p;
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
        if (updatePaiementDto.date) data.date = new Date(updatePaiementDto.date + 'T00:00:00.000Z');
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

    async getStatistics(query: PaiementsQueryDto = {}) {
        const whereClause: any = {};

        if (query.dossierId) whereClause.dossierId = query.dossierId;
        if (query.dateDebut || query.dateFin) {
            whereClause.date = createDateFilter(query.dateDebut, query.dateFin);
        }

        const result = await this.prisma.paiementsRecouvrement.aggregate({
            where: whereClause,
            _sum: { montant: true },
            _count: true,
            _max: { date: true },
        });

        // Répartition par mode de paiement
        const parMode = await this.prisma.paiementsRecouvrement.groupBy({
            by: ['mode'],
            where: whereClause,
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
