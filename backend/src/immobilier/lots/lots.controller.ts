import {
    Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { LotResponseDto } from './dto/lot-response.dto';
import { LotsQueryDto } from './dto/lots-query.dto';
import { LotsStatisticsQueryDto } from './dto/lots-statistics-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Lots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/lots')
export class LotsController {
    constructor(private readonly lotsService: LotsService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_LOT', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Créer un nouveau lot' })
    @ApiResponse({ status: 201, type: LotResponseDto })
    async create(
        @Body() createDto: CreateLotDto,
        @CurrentUser('id') userId: string,
    ): Promise<LotResponseDto> {
        return this.lotsService.create(createDto, userId);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Statistiques des lots' })
    async getStatistics(@Query() query: LotsStatisticsQueryDto) {
        return this.lotsService.getStatistics(query.immeubleId);
    }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer tous les lots avec pagination' })
    async findAll(@Query() query: LotsQueryDto): Promise<PaginatedResponse<LotResponseDto>> {
        return this.lotsService.findAll(query);
    }

    @Get('immeuble/:immeubleId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les lots d\'un immeuble (paginé par défaut)' })
    async findByImmeuble(@Param('immeubleId', ParseUUIDPipe) immeubleId: string, @Query() query: LotsQueryDto): Promise<PaginatedResponse<LotResponseDto>> {
        return this.lotsService.findAll({ ...query, immeubleId });
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un lot par ID' })
    @ApiResponse({ status: 200, type: LotResponseDto })
    @ApiResponse({ status: 404, description: 'Lot non trouvé' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LotResponseDto> {
        return this.lotsService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_LOT', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Mettre à jour un lot' })
    @ApiResponse({ status: 200, type: LotResponseDto })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateLotDto,
    ): Promise<LotResponseDto> {
        return this.lotsService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_LOT', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Supprimer un lot' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        await this.lotsService.remove(id);
        return { message: 'Lot supprimé avec succès' };
    }
}
