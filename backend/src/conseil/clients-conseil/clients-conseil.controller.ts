import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsConseilService } from './clients-conseil.service';
import {
  CreateClientConseilDto,
  UpdateClientConseilDto,
  ClientConseilResponseDto,
  ClientsConseilQueryDto,
  StatutClientConseil,
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../types/prisma-enums';

@ApiTags('Clients Conseil')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('conseil/clients')
export class ClientsConseilController {
  constructor(private readonly clientsConseilService: ClientsConseilService) {}

  @Post()
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Créer un nouveau client conseil',
    description: 'Crée un nouveau client conseil avec génération automatique de référence'
  })
  @ApiResponse({
    status: 201,
    description: 'Client conseil créé avec succès',
    type: ClientConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async create(
    @Body() createClientConseilDto: CreateClientConseilDto,
    @CurrentUser('id') userId: string,
  ): Promise<ClientConseilResponseDto> {
    return this.clientsConseilService.create(createClientConseilDto, userId);
  }

  @Get()
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer tous les clients conseil',
    description: 'Récupère la liste paginée des clients conseil avec filtres optionnels'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des clients conseil récupérée avec succès',
    type: 'PaginatedResponse<ClientConseilResponseDto>',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche' })
  @ApiQuery({ name: 'statut', required: false, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrer par type de partie' })
  async findAll(
    @Query() query: ClientsConseilQueryDto,
  ): Promise<PaginatedResponse<ClientConseilResponseDto>> {
    return this.clientsConseilService.findAll(query);
  }

  @Get('statistics')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Récupérer les statistiques des clients conseil',
    description: 'Récupère les statistiques globales des clients conseil'
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  async getStatistics() {
    return this.clientsConseilService.getStatistics();
  }

  @Get(':id')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer un client conseil par ID',
    description: 'Récupère les détails d\'un client conseil spécifique'
  })
  @ApiParam({ name: 'id', description: 'ID du client conseil' })
  @ApiResponse({
    status: 200,
    description: 'Client conseil récupéré avec succès',
    type: ClientConseilResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Client conseil non trouvé' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientConseilResponseDto> {
    return this.clientsConseilService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Mettre à jour un client conseil',
    description: 'Met à jour les informations d\'un client conseil existant'
  })
  @ApiParam({ name: 'id', description: 'ID du client conseil' })
  @ApiResponse({
    status: 200,
    description: 'Client conseil mis à jour avec succès',
    type: ClientConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Client conseil non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientConseilDto: UpdateClientConseilDto,
  ): Promise<ClientConseilResponseDto> {
    return this.clientsConseilService.update(id, updateClientConseilDto);
  }

  @Patch(':id/status')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Changer le statut d\'un client conseil',
    description: 'Change le statut d\'un client conseil (ACTIF, SUSPENDU, RESILIE)'
  })
  @ApiParam({ name: 'id', description: 'ID du client conseil' })
  @ApiResponse({
    status: 200,
    description: 'Statut du client conseil mis à jour avec succès',
    type: ClientConseilResponseDto,
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('statut') statut: StatutClientConseil,
  ): Promise<ClientConseilResponseDto> {
    return this.clientsConseilService.updateStatus(id, statut);
  }

  @Delete(':id')
  @Roles(AppRole.admin)
  @ApiOperation({ 
    summary: 'Supprimer un client conseil',
    description: 'Supprime définitivement un client conseil et toutes ses données associées'
  })
  @ApiParam({ name: 'id', description: 'ID du client conseil' })
  @ApiResponse({
    status: 200,
    description: 'Client conseil supprimé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Client conseil non trouvé' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.clientsConseilService.remove(id);
  }
}