import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { DossierResponseDto } from './dto/dossier-response.dto';
import { DossiersQueryDto } from './dto/dossiers-query.dto';
import { TypeHonoraires, StatutRecouvrement } from '@prisma/client';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class DossiersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly referenceGenerator: ReferenceGeneratorService,
    ) { }

    /**
     * Créer un nouveau dossier de recouvrement
     */
    async create(createDossierDto: CreateDossierDto, userId: string): Promise<DossierResponseDto> {
        const reference = await this.referenceGenerator.generateDossierRecouvrementReference();

        const totalARecouvrer = createDossierDto.montantPrincipal + (createDossierDto.penalitesInterets || 0);

        const result = await this.prisma.$transaction(async (tx) => {
            const dossier = await tx.dossiersRecouvrement.create({
                data: {
                    reference,
                    creancierNom: createDossierDto.creancierNom,
                    creancierTelephone: createDossierDto.creancierTelephone,
                    creancierEmail: createDossierDto.creancierEmail,
                    debiteurNom: createDossierDto.debiteurNom,
                    debiteurTelephone: createDossierDto.debiteurTelephone,
                    debiteurEmail: createDossierDto.debiteurEmail,
                    debiteurAdresse: createDossierDto.debiteurAdresse,
                    montantPrincipal: createDossierDto.montantPrincipal,
                    penalitesInterets: createDossierDto.penalitesInterets || 0,
                    totalARecouvrer: totalARecouvrer,
                    statut: createDossierDto.statut || StatutRecouvrement.EN_COURS,
                    notes: createDossierDto.notes,
                    createdBy: userId,
                },
                include: this.defaultInclude,
            });

            // Créer l'honoraire initial si fourni
            if (createDossierDto.honoraire) {
                await tx.honorairesRecouvrement.create({
                    data: {
                        dossierId: dossier.id,
                        type: (createDossierDto.honoraire.type as TypeHonoraires) || TypeHonoraires.FORFAIT,
                        montantPrevu: createDossierDto.honoraire.montantPrevu || 0,
                        pourcentage: createDossierDto.honoraire.pourcentage,
                        montantPaye: 0,
                        createdBy: userId,
                    },
                });
            }

            return dossier;
        });

        // Re-fetch with full includes
        return this.findOne(result.id);
    }

    /**
     * Récupérer tous les dossiers avec pagination
     */
    async findAll(query: DossiersQueryDto): Promise<PaginatedResponse<DossierResponseDto>> {
        const whereClause: any = {};
        if (query.statut) whereClause.statut = query.statut;

        const result = await this.paginationService.paginate(
            this.prisma.dossiersRecouvrement,
            query,
            {
                where: whereClause,
                include: this.defaultInclude,
                searchFields: ['reference', 'creancierNom', 'debiteurNom', 'notes'],
                defaultSortBy: 'createdAt',
            },
        );

        return {
            data: result.data.map(dossier => this.mapToResponseDto(dossier)),
            pagination: result.pagination,
        };
    }

    /**
     * Récupérer un dossier par ID
     */
    async findOne(id: string): Promise<DossierResponseDto> {
        const dossier = await this.prisma.dossiersRecouvrement.findUnique({
            where: { id },
            include: this.defaultInclude,
        });

        if (!dossier) {
            throw new NotFoundException(`Dossier de recouvrement avec l'ID ${id} non trouvé`);
        }

        return this.mapToResponseDto(dossier);
    }

    /**
     * Mettre à jour un dossier
     */
    async update(id: string, updateDossierDto: UpdateDossierDto): Promise<DossierResponseDto> {
        const existing = await this.prisma.dossiersRecouvrement.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException(`Dossier de recouvrement avec l'ID ${id} non trouvé`);
        }

        const data: any = {};
        if (updateDossierDto.creancierNom !== undefined) data.creancierNom = updateDossierDto.creancierNom;
        if (updateDossierDto.creancierTelephone !== undefined) data.creancierTelephone = updateDossierDto.creancierTelephone;
        if (updateDossierDto.creancierEmail !== undefined) data.creancierEmail = updateDossierDto.creancierEmail;
        if (updateDossierDto.debiteurNom !== undefined) data.debiteurNom = updateDossierDto.debiteurNom;
        if (updateDossierDto.debiteurTelephone !== undefined) data.debiteurTelephone = updateDossierDto.debiteurTelephone;
        if (updateDossierDto.debiteurEmail !== undefined) data.debiteurEmail = updateDossierDto.debiteurEmail;
        if (updateDossierDto.debiteurAdresse !== undefined) data.debiteurAdresse = updateDossierDto.debiteurAdresse;
        if (updateDossierDto.notes !== undefined) data.notes = updateDossierDto.notes;
        if (updateDossierDto.statut !== undefined) data.statut = updateDossierDto.statut;

        if (updateDossierDto.montantPrincipal !== undefined || updateDossierDto.penalitesInterets !== undefined) {
            const montantPrincipal = updateDossierDto.montantPrincipal ?? Number(existing.montantPrincipal);
            const penalitesInterets = updateDossierDto.penalitesInterets ?? Number(existing.penalitesInterets);
            data.montantPrincipal = montantPrincipal;
            data.penalitesInterets = penalitesInterets;
            data.totalARecouvrer = montantPrincipal + penalitesInterets;
        }

        await this.prisma.dossiersRecouvrement.update({
            where: { id },
            data,
        });

        return this.findOne(id);
    }

    /**
     * Supprimer un dossier
     */
    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.prisma.dossiersRecouvrement.delete({ where: { id } });
    }

    /**
     * Obtenir les statistiques des dossiers
     */
    async getStatistics() {
        const [totalDossiers, enCours, clotures, aggregation] = await Promise.all([
            this.prisma.dossiersRecouvrement.count(),
            this.prisma.dossiersRecouvrement.count({ where: { statut: 'EN_COURS' } }),
            this.prisma.dossiersRecouvrement.count({ where: { statut: 'CLOTURE' } }),
            this.prisma.dossiersRecouvrement.aggregate({
                _sum: {
                    totalARecouvrer: true,
                },
            }),
        ]);

        // Total des paiements reçus
        const totalPaiements = await this.prisma.paiementsRecouvrement.aggregate({
            _sum: { montant: true },
        });

        const totalARecouvrer = Number(aggregation._sum.totalARecouvrer) || 0;
        const totalRecouvre = Number(totalPaiements._sum.montant) || 0;

        return {
            totalDossiers,
            enCours,
            clotures,
            totalARecouvrer,
            totalRecouvre,
            soldeRestant: totalARecouvrer - totalRecouvre,
            tauxRecouvrement: totalARecouvrer > 0 ? Math.round((totalRecouvre / totalARecouvrer) * 100) : 0,
        };
    }

    private readonly defaultInclude = {
        actionsRecouvrements: {
            orderBy: { date: 'desc' as const },
            take: 5,
        },
        paiementsRecouvrements: {
            orderBy: { date: 'desc' as const },
        },
        honorairesRecouvrements: true,
        depensesDossiers: {
            orderBy: { date: 'desc' as const },
        },
    };

    private mapToResponseDto(dossier: any): DossierResponseDto {
        const totalPaiements = dossier.paiementsRecouvrements?.reduce(
            (sum: number, p: any) => sum + Number(p.montant), 0,
        ) || 0;

        const derniereAction = dossier.actionsRecouvrements?.[0];

        return {
            id: dossier.id,
            reference: dossier.reference,
            creancierNom: dossier.creancierNom,
            creancierTelephone: dossier.creancierTelephone,
            creancierEmail: dossier.creancierEmail,
            debiteurNom: dossier.debiteurNom,
            debiteurTelephone: dossier.debiteurTelephone,
            debiteurEmail: dossier.debiteurEmail,
            debiteurAdresse: dossier.debiteurAdresse,
            montantPrincipal: Number(dossier.montantPrincipal),
            penalitesInterets: Number(dossier.penalitesInterets) || 0,
            totalARecouvrer: Number(dossier.totalARecouvrer),
            totalPaiements,
            soldeRestant: Number(dossier.totalARecouvrer) - totalPaiements,
            statut: dossier.statut,
            notes: dossier.notes,
            nombreActions: dossier.actionsRecouvrements?.length || 0,
            derniereAction: derniereAction ? {
                id: derniereAction.id,
                date: derniereAction.date,
                typeAction: derniereAction.typeAction,
                resume: derniereAction.resume,
            } : undefined,
            actions: dossier.actionsRecouvrements?.map((a: any) => ({
                id: a.id,
                date: a.date,
                typeAction: a.typeAction,
                resume: a.resume,
                prochaineEtape: a.prochaineEtape,
                echeanceProchaineEtape: a.echeanceProchaineEtape,
            })),
            paiements: dossier.paiementsRecouvrements?.map((p: any) => ({
                id: p.id,
                date: p.date,
                montant: Number(p.montant),
                mode: p.mode,
                reference: p.reference,
                commentaire: p.commentaire,
            })),
            depenses: dossier.depensesDossiers?.map((d: any) => ({
                id: d.id,
                date: d.date,
                nature: d.nature,
                typeDepense: d.typeDepense,
                montant: Number(d.montant),
                justificatif: d.justificatif,
            })),
            honoraires: dossier.honorairesRecouvrements?.map((h: any) => ({
                id: h.id,
                type: h.type,
                montantPrevu: Number(h.montantPrevu),
                pourcentage: h.pourcentage ? Number(h.pourcentage) : undefined,
                montantPaye: Number(h.montantPaye),
                createdAt: h.createdAt,
            })),
            createdAt: dossier.createdAt,
            updatedAt: dossier.updatedAt,
        };
    }
}
