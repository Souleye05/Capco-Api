import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HonorairesRecouvrementService } from './honoraires-recouvrement.service';
import { CreateHonoraireRecouvrementDto } from './dto/create-honoraire-recouvrement.dto';
import { UpdateHonoraireRecouvrementDto } from './dto/update-honoraire-recouvrement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Recouvrement - Honoraires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recouvrement/honoraires')
export class HonorairesRecouvrementController {
    constructor(private readonly honorairesService: HonorairesRecouvrementService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_HONORAIRE_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Créer un honoraire de recouvrement' })
    async create(
        @Body() createDto: CreateHonoraireRecouvrementDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.honorairesService.create(createDto, userId);
    }

    @Get('dossier/:dossierId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les honoraires d\'un dossier' })
    async findByDossier(@Param('dossierId', ParseUUIDPipe) dossierId: string) {
        return this.honorairesService.findByDossier(dossierId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un honoraire par ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.honorairesService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_HONORAIRE_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Mettre à jour un honoraire' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateHonoraireRecouvrementDto,
    ) {
        return this.honorairesService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_HONORAIRE_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Supprimer un honoraire' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.honorairesService.remove(id);
        return { message: 'Honoraire supprimé avec succès' };
    }
}
