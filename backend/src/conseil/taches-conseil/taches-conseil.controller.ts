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
import { TachesConseilService } from './taches-conseil.service';
import {
  CreateTacheConseilDto,
  UpdateTacheConseilDto,
  TacheConseilResponseDto,
  TachesConseilQueryDto,
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../types/prisma-enums';

@ApiTags('Tâches Conseil')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('conseil/taches')
export class TachesConseilController {
  constructor(private readonly tachesConseilService: TachesConseilService) {}

  @Post()
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Créer une nouvelle tâche conseil',
    description: 'Crée une nouvelle tâche conseil pour un client existant'
  })
  @ApiResponse({
    status: 201,
    description: 'Tâche conseil créée avec succès',
    type: TacheConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Client conseil non trouvé' })
  async create(
    @Body() createTacheConseilDto: CreateTacheConseilDto,
    @CurrentUser('id') userId: string,
  ): Promise<TacheConseilResponseDto> {
    return this.tachesConseilService.create(createTacheConseilDto, userId);
  }

  @Get()
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer toutes les tâches conseil',
    description: 'Récupère la liste paginée des tâches conseil avec filtres optionnels'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des tâches conseil récupérée avec succès',
    type: 'PaginatedResponse<TacheConseilResponseDto>',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filtrer par client conseil' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrer par type de tâche' })
  @ApiQuery({ name: 'moisConcerne', required: false, description: 'Filtrer par mois concerné (YYYY-MM)' })
  async findAll(
    @Query() query: TachesConseilQueryDto,
  ): Promise<PaginatedResponse<TacheConseilResponseDto>> {
    return this.tachesConseilService.findAll(query);
  }

  @Get('client/:clientId/month/:moisConcerne')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer les tâches par client et mois',
    description: 'Récupère toutes les tâches d\'un client pour un mois donné'
  })
  @ApiParam({ name: 'clientId', description: 'ID du client conseil' })
  @ApiParam({ name: 'moisConcerne', description: 'Mois concerné (format YYYY-MM)' })
  @ApiResponse({
    status: 200,
    description: 'Tâches récupérées avec succès',
    type: [TacheConseilResponseDto],
  })
  async findByClientAndMonth(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('moisConcerne') moisConcerne: string,
  ): Promise<TacheConseilResponseDto[]> {
    return this.tachesConseilService.findByClientAndMonth(clientId, moisConcerne);
  }

  @Get('client/:clientId/month/:moisConcerne/time-summary')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer le résumé du temps par client et mois',
    description: 'Calcule le temps total passé pour un client sur un mois donné'
  })
  @ApiParam({ name: 'clientId', description: 'ID du client conseil' })
  @ApiParam({ name: 'moisConcerne', description: 'Mois concerné (format YYYY-MM)' })
  @ApiResponse({
    status: 200,
    description: 'Résumé du temps calculé avec succès',
  })
  async getTotalTimeByClientAndMonth(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('moisConcerne') moisConcerne: string,
  ) {
    return this.tachesConseilService.getTotalTimeByClientAndMonth(clientId, moisConcerne);
  }

  @Get(':id')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer une tâche conseil par ID',
    description: 'Récupère les détails d\'une tâche conseil spécifique'
  })
  @ApiParam({ name: 'id', description: 'ID de la tâche conseil' })
  @ApiResponse({
    status: 200,
    description: 'Tâche conseil récupérée avec succès',
    type: TacheConseilResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tâche conseil non trouvée' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TacheConseilResponseDto> {
    return this.tachesConseilService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Mettre à jour une tâche conseil',
    description: 'Met à jour les informations d\'une tâche conseil existante'
  })
  @ApiParam({ name: 'id', description: 'ID de la tâche conseil' })
  @ApiResponse({
    status: 200,
    description: 'Tâche conseil mise à jour avec succès',
    type: TacheConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Tâche conseil non trouvée' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTacheConseilDto: UpdateTacheConseilDto,
  ): Promise<TacheConseilResponseDto> {
    return this.tachesConseilService.update(id, updateTacheConseilDto);
  }

  @Delete(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Supprimer une tâche conseil',
    description: 'Supprime définitivement une tâche conseil'
  })
  @ApiParam({ name: 'id', description: 'ID de la tâche conseil' })
  @ApiResponse({
    status: 200,
    description: 'Tâche conseil supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Tâche conseil non trouvée' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tachesConseilService.remove(id);
  }
}