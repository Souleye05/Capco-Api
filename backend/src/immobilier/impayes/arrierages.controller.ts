import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ArrieragesService } from './arrierages.service';
import {
    CreateArrierageDto,
    UpdateArrierageDto,
    CreatePaiementPartielDto,
    ArrierageDto,
    ArrieragesQueryDto,
    StatistiquesArrieragesDto
} from './dto/arrierage.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Arriérés')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/arrierages')
export class ArrieragesController {
    constructor(private readonly arrieragesService: ArrieragesService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @ApiOperation({ summary: 'Créer un nouvel arriéré' })
    @ApiResponse({ status: 201, description: 'Arriéré créé avec succès', type: ArrierageDto })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 404, description: 'Lot non trouvé' })
    async create(
        @Body() createArrierageDto: CreateArrierageDto,
        @CurrentUser('sub') userId: string
    ): Promise<ArrierageDto> {
        return this.arrieragesService.create(createArrierageDto, userId);
    }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Lister les arriérés avec pagination et filtres' })
    @ApiResponse({ status: 200, description: 'Liste paginée des arriérés' })
    async findAll(@Query() query: ArrieragesQueryDto): Promise<PaginatedResponse<ArrierageDto>> {
        return this.arrieragesService.findAll(query);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Obtenir les statistiques des arriérés' })
    @ApiResponse({ status: 200, description: 'Statistiques des arriérés', type: StatistiquesArrieragesDto })
    async getStatistiques(@Query('immeubleId') immeubleId?: string): Promise<StatistiquesArrieragesDto> {
        return this.arrieragesService.getStatistiquesArrierages(immeubleId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un arriéré par son ID' })
    @ApiParam({ name: 'id', description: 'ID de l\'arriéré' })
    @ApiResponse({ status: 200, description: 'Arriéré trouvé', type: ArrierageDto })
    @ApiResponse({ status: 404, description: 'Arriéré non trouvé' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ArrierageDto> {
        return this.arrieragesService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @ApiOperation({ summary: 'Mettre à jour un arriéré' })
    @ApiParam({ name: 'id', description: 'ID de l\'arriéré' })
    @ApiResponse({ status: 200, description: 'Arriéré mis à jour avec succès', type: ArrierageDto })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 404, description: 'Arriéré non trouvé' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateArrierageDto: UpdateArrierageDto,
        @CurrentUser('sub') userId: string
    ): Promise<ArrierageDto> {
        return this.arrieragesService.update(id, updateArrierageDto, userId);
    }

    @Delete(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @ApiOperation({ summary: 'Supprimer un arriéré' })
    @ApiParam({ name: 'id', description: 'ID de l\'arriéré' })
    @ApiResponse({ status: 200, description: 'Arriéré supprimé avec succès' })
    @ApiResponse({ status: 404, description: 'Arriéré non trouvé' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.arrieragesService.remove(id);
    }

    @Post(':id/paiements')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Enregistrer un paiement partiel sur un arriéré' })
    @ApiParam({ name: 'id', description: 'ID de l\'arriéré' })
    @ApiResponse({ status: 201, description: 'Paiement partiel enregistré avec succès', type: ArrierageDto })
    @ApiResponse({ status: 400, description: 'Données invalides ou arriéré déjà soldé' })
    @ApiResponse({ status: 404, description: 'Arriéré non trouvé' })
    async enregistrerPaiementPartiel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() createPaiementDto: CreatePaiementPartielDto,
        @CurrentUser('sub') userId: string
    ): Promise<ArrierageDto> {
        return this.arrieragesService.enregistrerPaiementPartiel(id, createPaiementDto, userId);
    }

    @Get('statistics/taux-recouvrement')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Calculer le taux de recouvrement des arriérés' })
    @ApiResponse({ status: 200, description: 'Taux de recouvrement en pourcentage' })
    async getTauxRecouvrement(@Query('immeubleId') immeubleId?: string): Promise<{ tauxRecouvrement: number }> {
        const taux = await this.arrieragesService.calculerTauxRecouvrement(immeubleId);
        return { tauxRecouvrement: taux };
    }

    @Get('statistics/repartition-locataires')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Obtenir la répartition des arriérés par locataire' })
    @ApiResponse({ status: 200, description: 'Répartition des arriérés par locataire' })
    async getRepartitionParLocataire(@Query('immeubleId') immeubleId?: string) {
        return this.arrieragesService.getRepartitionParLocataire(immeubleId);
    }
}