import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Recouvrement - Actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recouvrement/actions')
export class ActionsController {
    constructor(private readonly actionsService: ActionsService) { }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer toutes les actions' })
    async findAll() {
        return this.actionsService.findAll();
    }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_ACTION_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Créer une nouvelle action de recouvrement' })
    async create(
        @Body() createActionDto: CreateActionDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.actionsService.create(createActionDto, userId);
    }

    @Get('dossier/:dossierId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les actions d\'un dossier' })
    async findByDossier(@Param('dossierId', ParseUUIDPipe) dossierId: string) {
        return this.actionsService.findByDossier(dossierId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer une action par ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.actionsService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_ACTION_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Mettre à jour une action' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateActionDto: UpdateActionDto,
    ) {
        return this.actionsService.update(id, updateActionDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_ACTION_RECOUVREMENT', module: 'RECOUVREMENT' })
    @ApiOperation({ summary: 'Supprimer une action' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.actionsService.remove(id);
        return { message: 'Action supprimée avec succès' };
    }
}
