import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepensesDossierService } from './depenses-dossier.service';
import { CreateDepenseDossierDto } from './dto/create-depense-dossier.dto';
import { UpdateDepenseDossierDto } from './dto/update-depense-dossier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Recouvrement - Dépenses Dossier')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recouvrement/depenses')
export class DepensesDossierController {
    constructor(private readonly depensesService: DepensesDossierService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_DEPENSE_DOSSIER', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Créer une dépense de dossier' })
    async create(
        @Body() createDto: CreateDepenseDossierDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.depensesService.create(createDto, userId);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Statistiques des dépenses de dossier' })
    async getStatistics() {
        return this.depensesService.getStatistics();
    }

    @Get('dossier/:dossierId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les dépenses d\'un dossier' })
    async findByDossier(@Param('dossierId', ParseUUIDPipe) dossierId: string) {
        return this.depensesService.findByDossier(dossierId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer une dépense par ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.depensesService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_DEPENSE_DOSSIER', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Mettre à jour une dépense' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDepenseDossierDto,
    ) {
        return this.depensesService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_DEPENSE_DOSSIER', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Supprimer une dépense' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.depensesService.remove(id);
        return { message: 'Dépense supprimée avec succès' };
    }
}
