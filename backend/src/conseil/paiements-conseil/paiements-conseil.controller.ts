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
import { PaiementsConseilService } from './paiements-conseil.service';
import {
  CreatePaiementConseilDto,
  UpdatePaiementConseilDto,
  PaiementConseilResponseDto,
  PaiementsConseilQueryDto,
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../types/prisma-enums';

@ApiTags('Paiements Conseil')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('conseil/paiements')
export class PaiementsConseilController {
  constructor(private readonly paiementsConseilService: PaiementsConseilService) {}

  @Post()
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Enregistrer un nouveau paiement conseil',
    description: 'Enregistre un nouveau paiement avec mise à jour automatique du statut de facture'
  })
  @ApiResponse({
    status: 201,
    description: 'Paiement conseil enregistré avec succès',
    type: PaiementConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou montant dépassant le solde' })
  @ApiResponse({ status: 404, description: 'Facture conseil non trouvée' })
  async create(
    @Body() createPaiementConseilDto: CreatePaiementConseilDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaiementConseilResponseDto> {
    return this.paiementsConseilService.create(createPaiementConseilDto, userId);
  }

  @Get()
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer tous les paiements conseil',
    description: 'Récupère la liste paginée des paiements conseil avec filtres optionnels'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des paiements conseil récupérée avec succès',
    type: 'PaginatedResponse<PaiementConseilResponseDto>',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche' })
  @ApiQuery({ name: 'factureId', required: false, description: 'Filtrer par facture conseil' })
  @ApiQuery({ name: 'mode', required: false, description: 'Filtrer par mode de paiement' })
  async findAll(
    @Query() query: PaiementsConseilQueryDto,
  ): Promise<PaginatedResponse<PaiementConseilResponseDto>> {
    return this.paiementsConseilService.findAll(query);
  }

  @Get('statistics/by-mode')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer les statistiques des paiements par mode',
    description: 'Récupère les statistiques des paiements groupées par mode de paiement'
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des paiements par mode récupérées avec succès',
  })
  async getPaymentStatsByMode() {
    return this.paiementsConseilService.getPaymentStatsByMode();
  }

  @Get('facture/:factureId')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer les paiements d\'une facture',
    description: 'Récupère tous les paiements associés à une facture spécifique'
  })
  @ApiParam({ name: 'factureId', description: 'ID de la facture conseil' })
  @ApiResponse({
    status: 200,
    description: 'Paiements de la facture récupérés avec succès',
    type: [PaiementConseilResponseDto],
  })
  async findByFacture(
    @Param('factureId', ParseUUIDPipe) factureId: string,
  ): Promise<PaiementConseilResponseDto[]> {
    return this.paiementsConseilService.findByFacture(factureId);
  }

  @Get('facture/:factureId/total')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Calculer le total payé pour une facture',
    description: 'Calcule le montant total des paiements pour une facture donnée'
  })
  @ApiParam({ name: 'factureId', description: 'ID de la facture conseil' })
  @ApiResponse({
    status: 200,
    description: 'Total des paiements calculé avec succès',
  })
  async getTotalPaidForFacture(
    @Param('factureId', ParseUUIDPipe) factureId: string,
  ): Promise<{ totalPaid: number }> {
    const totalPaid = await this.paiementsConseilService.getTotalPaidForFacture(factureId);
    return { totalPaid };
  }

  @Get(':id')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer un paiement conseil par ID',
    description: 'Récupère les détails d\'un paiement conseil spécifique'
  })
  @ApiParam({ name: 'id', description: 'ID du paiement conseil' })
  @ApiResponse({
    status: 200,
    description: 'Paiement conseil récupéré avec succès',
    type: PaiementConseilResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Paiement conseil non trouvé' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaiementConseilResponseDto> {
    return this.paiementsConseilService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Mettre à jour un paiement conseil',
    description: 'Met à jour les informations d\'un paiement conseil existant'
  })
  @ApiParam({ name: 'id', description: 'ID du paiement conseil' })
  @ApiResponse({
    status: 200,
    description: 'Paiement conseil mis à jour avec succès',
    type: PaiementConseilResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Paiement conseil non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaiementConseilDto: UpdatePaiementConseilDto,
  ): Promise<PaiementConseilResponseDto> {
    return this.paiementsConseilService.update(id, updatePaiementConseilDto);
  }

  @Delete(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ 
    summary: 'Supprimer un paiement conseil',
    description: 'Supprime définitivement un paiement conseil avec recalcul du statut de facture'
  })
  @ApiParam({ name: 'id', description: 'ID du paiement conseil' })
  @ApiResponse({
    status: 200,
    description: 'Paiement conseil supprimé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Paiement conseil non trouvé' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.paiementsConseilService.remove(id);
  }
}