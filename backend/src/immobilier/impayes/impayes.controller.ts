import {
    Controller, Get, Query, UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ImpayesService } from './impayes.service';
import { ImpayeDto, ImpayesQueryDto, StatistiquesImpayesDto } from './dto/impaye.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
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
}
