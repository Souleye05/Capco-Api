import {
    Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EncaissementsService } from './encaissements.service';
import { CreateEncaissementDto } from './dto/create-encaissement.dto';
import { UpdateEncaissementDto } from './dto/update-encaissement.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Encaissements Loyers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/encaissements')
export class EncaissementsController {
    constructor(private readonly encaissementsService: EncaissementsService) { }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer tous les encaissements avec pagination' })
    async findAll(@Query() query: PaginationQueryDto) {
        return this.encaissementsService.findAll(query);
    }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @AuditLog({ action: 'CREATE_ENCAISSEMENT_LOYER', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Enregistrer un encaissement de loyer' })
    async create(
        @Body() createDto: CreateEncaissementDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.encaissementsService.create(createDto, userId);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Statistiques des encaissements' })
    async getStatistics(
        @Query('immeubleId') immeubleId?: string,
        @Query('moisConcerne') moisConcerne?: string,
    ) {
        return this.encaissementsService.getStatistics({ immeubleId, moisConcerne });
    }

    @Get('lot/:lotId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les encaissements d\'un lot' })
    async findByLot(@Param('lotId', ParseUUIDPipe) lotId: string) {
        return this.encaissementsService.findByLot(lotId);
    }

    @Get('immeuble/:immeubleId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les encaissements d\'un immeuble' })
    async findByImmeuble(@Param('immeubleId', ParseUUIDPipe) immeubleId: string) {
        return this.encaissementsService.findByImmeuble(immeubleId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un encaissement par ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.encaissementsService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_ENCAISSEMENT_LOYER', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Mettre à jour un encaissement' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateEncaissementDto,
    ) {
        return this.encaissementsService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_ENCAISSEMENT_LOYER', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Supprimer un encaissement' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.encaissementsService.remove(id);
        return { message: 'Encaissement supprimé avec succès' };
    }
}
