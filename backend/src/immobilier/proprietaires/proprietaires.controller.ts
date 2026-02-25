import {
    Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProprietairesService } from './proprietaires.service';
import { CreateProprietaireDto } from './dto/create-proprietaire.dto';
import { UpdateProprietaireDto } from './dto/update-proprietaire.dto';
import { ProprietaireResponseDto } from './dto/proprietaire-response.dto';
import { ProprietairesQueryDto } from './dto/proprietaires-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Propriétaires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/proprietaires')
export class ProprietairesController {
    constructor(private readonly proprietairesService: ProprietairesService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_PROPRIETAIRE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Créer un nouveau propriétaire' })
    @ApiResponse({ status: 201, type: ProprietaireResponseDto })
    async create(
        @Body() createDto: CreateProprietaireDto,
        @CurrentUser('id') userId: string,
    ): Promise<ProprietaireResponseDto> {
        return this.proprietairesService.create(createDto, userId);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Obtenir les statistiques des propriétaires' })
    async getStatistics() {
        return this.proprietairesService.getStatistics();
    }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer tous les propriétaires avec pagination' })
    async findAll(@Query() query: ProprietairesQueryDto): Promise<PaginatedResponse<ProprietaireResponseDto>> {
        return this.proprietairesService.findAll(query);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un propriétaire par ID' })
    @ApiResponse({ status: 200, type: ProprietaireResponseDto })
    @ApiResponse({ status: 404, description: 'Propriétaire non trouvé' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProprietaireResponseDto> {
        return this.proprietairesService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_PROPRIETAIRE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Mettre à jour un propriétaire' })
    @ApiResponse({ status: 200, type: ProprietaireResponseDto })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateProprietaireDto,
    ): Promise<ProprietaireResponseDto> {
        return this.proprietairesService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_PROPRIETAIRE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Supprimer un propriétaire' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        await this.proprietairesService.remove(id);
        return { message: 'Propriétaire supprimé avec succès' };
    }
}
