import {
    Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DossiersService } from './dossiers.service';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { DossierResponseDto } from './dto/dossier-response.dto';
import { DossiersQueryDto } from './dto/dossiers-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Recouvrement - Dossiers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recouvrement/dossiers')
export class DossiersController {
    constructor(private readonly dossiersService: DossiersService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_DOSSIER_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Créer un nouveau dossier de recouvrement' })
    @ApiResponse({ status: 201, type: DossierResponseDto })
    async create(
        @Body() createDossierDto: CreateDossierDto,
        @CurrentUser('id') userId: string,
    ): Promise<DossierResponseDto> {
        return this.dossiersService.create(createDossierDto, userId);
    }

    @Get('statistics')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Obtenir les statistiques des dossiers de recouvrement' })
    async getStatistics() {
        return this.dossiersService.getStatistics();
    }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer tous les dossiers avec pagination' })
    async findAll(@Query() query: DossiersQueryDto): Promise<PaginatedResponse<DossierResponseDto>> {
        return this.dossiersService.findAll(query);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un dossier par ID' })
    @ApiResponse({ status: 200, type: DossierResponseDto })
    @ApiResponse({ status: 404, description: 'Dossier non trouvé' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DossierResponseDto> {
        return this.dossiersService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_DOSSIER_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Mettre à jour un dossier' })
    @ApiResponse({ status: 200, type: DossierResponseDto })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDossierDto: UpdateDossierDto,
    ): Promise<DossierResponseDto> {
        return this.dossiersService.update(id, updateDossierDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_DOSSIER_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Supprimer un dossier' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        await this.dossiersService.remove(id);
        return { message: 'Dossier supprimé avec succès' };
    }
}
