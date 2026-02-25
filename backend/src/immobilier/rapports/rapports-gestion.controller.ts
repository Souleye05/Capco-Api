import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RapportsGestionService } from './rapports-gestion.service';
import { CreateRapportGestionDto, UpdateRapportStatutDto } from './dto/create-rapport.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Rapports de Gestion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/rapports')
export class RapportsGestionController {
    constructor(private readonly rapportsService: RapportsGestionService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'GENERATE_RAPPORT_GESTION', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Générer un rapport de gestion pour un immeuble' })
    async generate(
        @Body() createDto: CreateRapportGestionDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.rapportsService.generate(createDto, userId);
    }

    @Get('immeuble/:immeubleId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les rapports d\'un immeuble' })
    async findByImmeuble(@Param('immeubleId', ParseUUIDPipe) immeubleId: string) {
        return this.rapportsService.findByImmeuble(immeubleId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un rapport par ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.rapportsService.findOne(id);
    }

    @Patch(':id/statut')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_RAPPORT_STATUT', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Mettre à jour le statut d\'un rapport' })
    async updateStatut(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateRapportStatutDto,
    ) {
        return this.rapportsService.updateStatut(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_RAPPORT_GESTION', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Supprimer un rapport de gestion' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.rapportsService.remove(id);
        return { message: 'Rapport supprimé avec succès' };
    }
}
