import {
    Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepensesImmeublesService } from './depenses-immeubles.service';
import { CreateDepenseImmeubleDto } from './dto/create-depense-immeuble.dto';
import { UpdateDepenseImmeubleDto } from './dto/update-depense-immeuble.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Dépenses Immeubles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/depenses')
export class DepensesImmeublesController {
    constructor(private readonly depensesService: DepensesImmeublesService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_DEPENSE_IMMEUBLE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Créer une dépense d\'immeuble' })
    async create(
        @Body() createDto: CreateDepenseImmeubleDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.depensesService.create(createDto, userId);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Statistiques des dépenses' })
    async getStatistics(@Query('immeubleId') immeubleId?: string) {
        return this.depensesService.getStatistics(immeubleId);
    }

    @Get('immeuble/:immeubleId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les dépenses d\'un immeuble' })
    async findByImmeuble(@Param('immeubleId', ParseUUIDPipe) immeubleId: string) {
        return this.depensesService.findByImmeuble(immeubleId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer une dépense par ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.depensesService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_DEPENSE_IMMEUBLE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Mettre à jour une dépense' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDepenseImmeubleDto,
    ) {
        return this.depensesService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_DEPENSE_IMMEUBLE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Supprimer une dépense' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.depensesService.remove(id);
        return { message: 'Dépense supprimée avec succès' };
    }
}
