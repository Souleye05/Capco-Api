import {
    Controller, Get, Post, Query, UseGuards, Param, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ImpayesService } from './impayes.service';
import { ImpayeDto, ImpayesQueryDto, StatistiquesImpayesDto } from './dto/impaye.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '@prisma/client';
import { getCurrentImpayesMonth } from '../../common/utils/date.utils';

@ApiTags('Immobilier - Impayés')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/impayes')
export class ImpayesController {
    constructor(private readonly impayesService: ImpayesService) { }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Lister les impayés avec pagination et filtres' })
    @ApiResponse({ status: 200, description: 'Liste paginée des impayés' })
    async getImpayes(@Query() query: ImpayesQueryDto): Promise<PaginatedResponse<ImpayeDto>> {
        // Déterminer le mois cible automatiquement si omis
        const moisCible = query.mois || getCurrentImpayesMonth();
        
        return this.impayesService.detecterImpayesPourMois({
            ...query,
            mois: moisCible
        });
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Obtenir les statistiques des impayés' })
    @ApiResponse({ status: 200, type: StatistiquesImpayesDto })
    async getStatistiques(@Query('immeubleId') immeubleId?: string): Promise<StatistiquesImpayesDto> {
        return this.impayesService.getStatistiquesImpayes(immeubleId);
    }

    @Post('generate-alerts')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @ApiOperation({ summary: 'Générer des alertes pour tous les impayés du mois courant' })
    @ApiResponse({ status: 201, description: 'Nombre d\'alertes générées' })
    async genererAlertesImpayesMoisCourant(@CurrentUser('sub') userId: string): Promise<{ alertesGenerees: number }> {
        const alertesGenerees = await this.impayesService.genererAlertesImpayesMoisCourant(userId);
        return { alertesGenerees };
    }

    @Post(':lotId/generate-alert')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @ApiOperation({ summary: 'Générer une alerte pour un impayé spécifique' })
    @ApiParam({ name: 'lotId', description: 'ID du lot' })
    @ApiResponse({ status: 201, description: 'Alerte générée avec succès' })
    async genererAlerteImpaye(
        @Param('lotId', ParseUUIDPipe) lotId: string,
        @Query('mois') mois?: string,
        @CurrentUser('sub') userId?: string
    ): Promise<{ message: string }> {
        const moisCible = mois || getCurrentImpayesMonth();
        await this.impayesService.genererAlerteImpaye(lotId, moisCible, userId);
        return { message: 'Alerte générée avec succès' };
    }

    @Get('immeuble/:immeubleId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les impayés par immeuble' })
    @ApiParam({ name: 'immeubleId', description: 'ID de l\'immeuble' })
    @ApiResponse({ status: 200, type: [ImpayeDto] })
    async getImpayesParImmeuble(@Param('immeubleId', ParseUUIDPipe) immeubleId: string): Promise<ImpayeDto[]> {
        return this.impayesService.getImpayesParImmeuble(immeubleId);
    }

    @Get('lot/:lotId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les impayés par lot' })
    @ApiParam({ name: 'lotId', description: 'ID du lot' })
    @ApiResponse({ status: 200, type: [ImpayeDto] })
    async getImpayesParLot(@Param('lotId', ParseUUIDPipe) lotId: string): Promise<ImpayeDto[]> {
        return this.impayesService.getImpayesParLot(lotId);
    }
}
