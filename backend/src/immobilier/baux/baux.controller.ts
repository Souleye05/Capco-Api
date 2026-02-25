import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BauxService } from './baux.service';
import { CreateBailDto } from './dto/create-bail.dto';
import { UpdateBailDto } from './dto/update-bail.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Baux')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/baux')
export class BauxController {
    constructor(private readonly bauxService: BauxService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_BAIL', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Créer un nouveau bail' })
    async create(
        @Body() createDto: CreateBailDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.bauxService.create(createDto, userId);
    }

    @Get('lot/:lotId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les baux d\'un lot' })
    async findByLot(@Param('lotId', ParseUUIDPipe) lotId: string) {
        return this.bauxService.findByLot(lotId);
    }

    @Get('locataire/:locataireId')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer les baux d\'un locataire' })
    async findByLocataire(@Param('locataireId', ParseUUIDPipe) locataireId: string) {
        return this.bauxService.findByLocataire(locataireId);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un bail par ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.bauxService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_BAIL', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Mettre à jour un bail' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateBailDto,
    ) {
        return this.bauxService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_BAIL', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Supprimer un bail' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.bauxService.remove(id);
        return { message: 'Bail supprimé avec succès' };
    }
}
