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
import { FacturesConseilService } from './factures-conseil.service';
import {
  CreateFactureConseilDto,
  UpdateFactureConseilDto,
  FactureConseilResponseDto,
  FacturesConseilQueryDto,
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../types/prisma-enums';

@ApiTags('Factures Conseil')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('conseil/factures')
export class FacturesConseilController {
  constructor(private readonly facturesConseilService: FacturesConseilService) {}

  @Post()
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Créer une nouvelle facture conseil',
    description: 'Crée une nouvelle facture conseil avec génération automatique de référence'
  })
  @ApiResponse({
    status: 201,
    description: 'Facture conseil créée avec succès',
    type: FactureConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou facture déjà existante pour ce mois' })
  @ApiResponse({ status: 404, description: 'Client conseil non trouvé' })
  async create(
    @Body() createFactureConseilDto: CreateFactureConseilDto,
    @CurrentUser('id') userId: string,
  ): Promise<FactureConseilResponseDto> {
    return this.facturesConseilService.create(createFactureConseilDto, userId);
  }

  @Post('generate-monthly/:clientId/:moisConcerne')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Générer automatiquement une facture mensuelle',
    description: 'Génère automatiquement une facture basée sur l\'honoraire mensuel du client'
  })
  @ApiParam({ name: 'clientId', description: 'ID du client conseil' })
  @ApiParam({ name: 'moisConcerne', description: 'Mois concerné (format YYYY-MM)' })
  @ApiResponse({
    status: 201,
    description: 'Facture mensuelle générée avec succès',
    type: FactureConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Client non actif ou facture déjà existante' })
  @ApiResponse({ status: 404, description: 'Client conseil non trouvé' })
  async generateMonthlyBill(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('moisConcerne') moisConcerne: string,
    @CurrentUser('id') userId: string,
  ): Promise<FactureConseilResponseDto> {
    return this.facturesConseilService.generateMonthlyBill(clientId, moisConcerne, userId);
  }

  @Get()
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer toutes les factures conseil',
    description: 'Récupère la liste paginée des factures conseil avec filtres optionnels'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des factures conseil récupérée avec succès',
    type: 'PaginatedResponse<FactureConseilResponseDto>',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filtrer par client conseil' })
  @ApiQuery({ name: 'statut', required: false, description: 'Filtrer par statut de facture' })
  @ApiQuery({ name: 'moisConcerne', required: false, description: 'Filtrer par mois concerné (YYYY-MM)' })
  async findAll(
    @Query() query: FacturesConseilQueryDto,
  ): Promise<PaginatedResponse<FactureConseilResponseDto>> {
    return this.facturesConseilService.findAll(query);
  }

  @Get(':id')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer une facture conseil par ID',
    description: 'Récupère les détails d\'une facture conseil spécifique'
  })
  @ApiParam({ name: 'id', description: 'ID de la facture conseil' })
  @ApiResponse({
    status: 200,
    description: 'Facture conseil récupérée avec succès',
    type: FactureConseilResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Facture conseil non trouvée' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FactureConseilResponseDto> {
    return this.facturesConseilService.findOne(id);
  }

  @Get(':id/total-paid')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer le montant total payé pour une facture',
    description: 'Calcule le montant total des paiements effectués pour une facture'
  })
  @ApiParam({ name: 'id', description: 'ID de la facture conseil' })
  @ApiResponse({
    status: 200,
    description: 'Montant total payé calculé avec succès',
  })
  async getTotalPaid(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ totalPaid: number }> {
    const totalPaid = await this.facturesConseilService.getTotalPaid(id);
    return { totalPaid };
  }

  @Patch(':id')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Mettre à jour une facture conseil',
    description: 'Met à jour les informations d\'une facture conseil existante (sauf si payée)'
  })
  @ApiParam({ name: 'id', description: 'ID de la facture conseil' })
  @ApiResponse({
    status: 200,
    description: 'Facture conseil mise à jour avec succès',
    type: FactureConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou facture déjà payée' })
  @ApiResponse({ status: 404, description: 'Facture conseil non trouvée' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFactureConseilDto: UpdateFactureConseilDto,
  ): Promise<FactureConseilResponseDto> {
    return this.facturesConseilService.update(id, updateFactureConseilDto);
  }

  @Patch(':id/mark-as-sent')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Marquer une facture comme envoyée',
    description: 'Change le statut d\'une facture vers "ENVOYEE"'
  })
  @ApiParam({ name: 'id', description: 'ID de la facture conseil' })
  @ApiResponse({
    status: 200,
    description: 'Facture marquée comme envoyée avec succès',
    type: FactureConseilResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Facture conseil non trouvée' })
  async markAsSent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FactureConseilResponseDto> {
    return this.facturesConseilService.markAsSent(id);
  }

  @Delete(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Supprimer une facture conseil',
    description: 'Supprime définitivement une facture conseil (sauf si payée)'
  })
  @ApiParam({ name: 'id', description: 'ID de la facture conseil' })
  @ApiResponse({
    status: 200,
    description: 'Facture conseil supprimée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Impossible de supprimer une facture payée' })
  @ApiResponse({ status: 404, description: 'Facture conseil non trouvée' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.facturesConseilService.remove(id);
  }
}