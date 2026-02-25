import {
    Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocatairesService } from './locataires.service';
import { CreateLocataireDto } from './dto/create-locataire.dto';
import { UpdateLocataireDto } from './dto/update-locataire.dto';
import { LocataireResponseDto } from './dto/locataire-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier - Locataires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier/locataires')
export class LocatairesController {
    constructor(private readonly locatairesService: LocatairesService) { }

    @Post()
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'CREATE_LOCATAIRE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Créer un nouveau locataire' })
    @ApiResponse({ status: 201, type: LocataireResponseDto })
    async create(
        @Body() createDto: CreateLocataireDto,
        @CurrentUser('id') userId: string,
    ): Promise<LocataireResponseDto> {
        return this.locatairesService.create(createDto, userId);
    }

    @Get()
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer tous les locataires avec pagination' })
    async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<LocataireResponseDto>> {
        return this.locatairesService.findAll(query);
    }

    @Get(':id')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Récupérer un locataire par ID' })
    @ApiResponse({ status: 200, type: LocataireResponseDto })
    @ApiResponse({ status: 404, description: 'Locataire non trouvé' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LocataireResponseDto> {
        return this.locatairesService.findOne(id);
    }

    @Patch(':id')
    @Roles(AppRole.admin, AppRole.collaborateur)
    @AuditLog({ action: 'UPDATE_LOCATAIRE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Mettre à jour un locataire' })
    @ApiResponse({ status: 200, type: LocataireResponseDto })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateLocataireDto,
    ): Promise<LocataireResponseDto> {
        return this.locatairesService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(AppRole.admin)
    @AuditLog({ action: 'DELETE_LOCATAIRE', module: 'IMMOBILIER' })
    @ApiOperation({ summary: 'Supprimer un locataire' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        await this.locatairesService.remove(id);
        return { message: 'Locataire supprimé avec succès' };
    }
}
