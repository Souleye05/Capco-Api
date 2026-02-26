import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaiementsService } from './paiements.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Recouvrement - Paiements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recouvrement/paiements')
export class PaiementsController {
    constructor(private readonly paiementsService: PaiementsService) { }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Liste de tous les paiements' })
    async findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('dossierId') dossierId?: string,
        @Query('dateDebut') dateDebut?: string,
        @Query('dateFin') dateFin?: string,
    ) {
        return this.paiementsService.findAll({ page, limit, search, dossierId, dateDebut, dateFin });
    }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @AuditLog({ action: 'CREATE_PAIEMENT_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Enregistrer un nouveau paiement' })
    async create(
        @Body() createPaiementDto: CreatePaiementDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.paiementsService.create(createPaiementDto, userId);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Statistiques des paiements' })
    async getStatistics(
        @Query('dossierId') dossierId?: string,
        @Query('dateDebut') dateDebut?: string,
        @Query('dateFin') dateFin?: string,
        @Query('search') search?: string,
    ) {
        return this.paiementsService.getStatistics({ dossierId, dateDebut, dateFin, search });
    }

    @Get('dossier/:dossierId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les paiements d\'un dossier' })
    async findByDossier(@Param('dossierId', ParseUUIDPipe) dossierId: string) {
        return this.paiementsService.findByDossier(dossierId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un paiement par ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.paiementsService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_PAIEMENT_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Mettre à jour un paiement' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updatePaiementDto: UpdatePaiementDto,
    ) {
        return this.paiementsService.update(id, updatePaiementDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_PAIEMENT_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Supprimer un paiement' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.paiementsService.remove(id);
        return { message: 'Paiement supprimé avec succès' };
    }
}
