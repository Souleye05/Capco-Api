import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { ActionResponseDto } from './dto/action-response.dto';
import { ActionsQueryDto } from './dto/actions-query.dto';
import { createDateFilter } from '../../common/utils/date.utils';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class ActionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
    ) { }

    async findAll(query: ActionsQueryDto): Promise<PaginatedResponse<ActionResponseDto>> {
        const whereClause: any = {};

        if (query.dossierId) whereClause.dossierId = query.dossierId;
        if (query.typeAction) whereClause.typeAction = query.typeAction;
        
        // Filtre par période
        if (query.dateDebut || query.dateFin) {
            whereClause.date = createDateFilter(query.dateDebut, query.dateFin);
        }

        const result = await this.paginationService.paginate(
            this.prisma.actionsRecouvrement,
            query,
            {
                where: whereClause,
                include: {
                    dossiersRecouvrement: {
                        select: {
                            reference: true,
                        },
                    },
                },
                searchFields: ['resume', 'prochaineEtape', 'dossiersRecouvrement.reference'],
                defaultSortBy: 'date',
            }
        );

        return {
            data: result.data.map(action => this.mapToResponseDto(action)),
            pagination: result.pagination,
        };
    }

    async create(createActionDto: CreateActionDto, userId: string): Promise<ActionResponseDto> {
        // Vérifier que le dossier existe
        const dossier = await this.prisma.dossiersRecouvrement.findUnique({
            where: { id: createActionDto.dossierId },
        });

        if (!dossier) {
            throw new NotFoundException(`Dossier avec l'ID ${createActionDto.dossierId} non trouvé`);
        }

        const action = await this.prisma.actionsRecouvrement.create({
            data: {
                dossierId: createActionDto.dossierId,
                date: new Date(createActionDto.date + 'T00:00:00.000Z'),
                typeAction: createActionDto.typeAction,
                resume: createActionDto.resume,
                prochaineEtape: createActionDto.prochaineEtape,
                echeanceProchaineEtape: createActionDto.echeanceProchaineEtape ? new Date(createActionDto.echeanceProchaineEtape + 'T00:00:00.000Z') : null,
                pieceJointe: createActionDto.pieceJointe,
                createdBy: userId,
            },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return this.mapToResponseDto(action);
    }

    async findByDossier(dossierId: string): Promise<ActionResponseDto[]> {
        const actions = await this.prisma.actionsRecouvrement.findMany({
            where: { dossierId },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
            orderBy: { date: 'desc' },
        });

        return actions.map(action => this.mapToResponseDto(action));
    }

    async findOne(id: string): Promise<ActionResponseDto> {
        const action = await this.prisma.actionsRecouvrement.findUnique({
            where: { id },
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        if (!action) {
            throw new NotFoundException(`Action avec l'ID ${id} non trouvée`);
        }

        return this.mapToResponseDto(action);
    }

    async update(id: string, updateActionDto: UpdateActionDto): Promise<ActionResponseDto> {
        await this.findOne(id);

        const data: any = {};
        if (updateActionDto.date) data.date = new Date(updateActionDto.date + 'T00:00:00.000Z');
        if (updateActionDto.typeAction) data.typeAction = updateActionDto.typeAction;
        if (updateActionDto.resume !== undefined) data.resume = updateActionDto.resume;
        if (updateActionDto.prochaineEtape !== undefined) data.prochaineEtape = updateActionDto.prochaineEtape;
        if (updateActionDto.echeanceProchaineEtape !== undefined) {
            data.echeanceProchaineEtape = updateActionDto.echeanceProchaineEtape ? new Date(updateActionDto.echeanceProchaineEtape + 'T00:00:00.000Z') : null;
        }
        if (updateActionDto.pieceJointe !== undefined) data.pieceJointe = updateActionDto.pieceJointe;

        const action = await this.prisma.actionsRecouvrement.update({
            where: { id },
            data,
            include: {
                dossiersRecouvrement: { select: { reference: true } },
            },
        });

        return this.mapToResponseDto(action);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.prisma.actionsRecouvrement.delete({ where: { id } });
    }

    private mapToResponseDto(action: any): ActionResponseDto {
        return {
            id: action.id,
            dossierId: action.dossierId,
            date: action.date,
            typeAction: action.typeAction,
            resume: action.resume,
            prochaineEtape: action.prochaineEtape,
            echeanceProchaineEtape: action.echeanceProchaineEtape,
            pieceJointe: action.pieceJointe,
            dossierReference: action.dossiersRecouvrement?.reference,
            createdAt: action.createdAt,
        };
    }
}
