import {
    Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ImmeublesService } from './immeubles.service';
import { CreateImmeubleDto } from './dto/create-immeuble.dto';
import { UpdateImmeubleDto } from './dto/update-immeuble.dto';
import { ImmeubleResponseDto } from './dto/immeuble-response.dto';
import { ImmeublesQueryDto } from './dto/immeubles-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Immeubles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/immeubles')
export class ImmeublesController {
    constructor(private readonly immeublesService: ImmeublesService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_IMMEUBLE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Créer un nouvel immeuble' })
    @ApiResponse({ status: 201, type: ImmeubleResponseDto })
    async create(
        @Body() createDto: CreateImmeubleDto,
        @CurrentUser('id') userId: string,
    ): Promise<ImmeubleResponseDto> {
        return this.immeublesService.create(createDto, userId);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Obtenir les statistiques des immeubles' })
    async getStatistics() {
        return this.immeublesService.getStatistics();
    }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer tous les immeubles avec pagination' })
    async findAll(@Query() query: ImmeublesQueryDto): Promise<PaginatedResponse<ImmeubleResponseDto>> {
        return this.immeublesService.findAll(query);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un immeuble par ID' })
    @ApiResponse({ status: 200, type: ImmeubleResponseDto })
    @ApiResponse({ status: 404, description: 'Immeuble non trouvé' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ImmeubleResponseDto> {
        return this.immeublesService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_IMMEUBLE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Mettre à jour un immeuble' })
    @ApiResponse({ status: 200, type: ImmeubleResponseDto })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateImmeubleDto,
    ): Promise<ImmeubleResponseDto> {
        return this.immeublesService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_IMMEUBLE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Supprimer un immeuble' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        await this.immeublesService.remove(id);
        return { message: 'Immeuble supprimé avec succès' };
    }
}
