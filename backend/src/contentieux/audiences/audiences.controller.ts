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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AudiencesService } from './audiences.service';
import { AudienceCronService } from './audience-cron.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { AudienceResponseDto } from './dto/audience-response.dto';
import { AudiencesQueryDto } from './dto/audiences-query.dto';
import { CreateResultatAudienceDto, UpdateResultatAudienceDto, ResultatAudienceResponseDto } from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Audiences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contentieux/audiences')
export class AudiencesController {
  constructor(
    private readonly audiencesService: AudiencesService,
    private readonly audienceCronService: AudienceCronService,
  ) {}

  @Post()
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'CREATE_AUDIENCE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Créer une nouvelle audience' })
  @ApiResponse({ status: 201, description: 'Audience créée avec succès', type: AudienceResponseDto })
  async create(
    @Body() createAudienceDto: CreateAudienceDto,
    @CurrentUser('id') userId: string,
  ): Promise<AudienceResponseDto> {
    return this.audiencesService.create(createAudienceDto, userId);
  }

  @Get()
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ summary: 'Récupérer toutes les audiences avec pagination' })
  @ApiQuery({ name: 'affaireId', required: false, description: 'Filtrer par ID d\'affaire' })
  @ApiResponse({ status: 200, description: 'Liste des audiences récupérée avec succès' })
  async findAll(
    @Query() query: AudiencesQueryDto,
  ): Promise<PaginatedResponse<AudienceResponseDto>> {
    return this.audiencesService.findAll(query);
  }

  @Get(':id')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ summary: 'Récupérer une audience par ID' })
  @ApiResponse({ status: 200, description: 'Audience récupérée avec succès', type: AudienceResponseDto })
  @ApiResponse({ status: 404, description: 'Audience non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AudienceResponseDto> {
    return this.audiencesService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'UPDATE_AUDIENCE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Mettre à jour une audience' })
  @ApiResponse({ status: 200, description: 'Audience mise à jour avec succès', type: AudienceResponseDto })
  @ApiResponse({ status: 404, description: 'Audience non trouvée' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ): Promise<AudienceResponseDto> {
    return this.audiencesService.update(id, updateAudienceDto);
  }

  @Delete(':id')
  @Roles(AppRole.admin)
  @AuditLog({ action: 'DELETE_AUDIENCE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Supprimer une audience' })
  @ApiResponse({ status: 200, description: 'Audience supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Audience non trouvée' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string}> {
    await this.audiencesService.remove(id);
    return { message: 'Audience supprimée avec succès' };
  }

  // === ENDPOINTS POUR LES RÉSULTATS D'AUDIENCES ===

  @Post(':id/resultat')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'CREATE_RESULTAT_AUDIENCE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Créer un résultat pour une audience' })
  @ApiResponse({ status: 201, description: 'Résultat créé avec succès', type: ResultatAudienceResponseDto })
  @ApiResponse({ status: 400, description: 'Cette audience a déjà un résultat' })
  @ApiResponse({ status: 404, description: 'Audience non trouvée' })
  async createResultat(
    @Param('id', ParseUUIDPipe) audienceId: string,
    @Body() createResultatDto: CreateResultatAudienceDto,
    @CurrentUser('id') userId: string,
  ): Promise<ResultatAudienceResponseDto> {
    return this.audiencesService.createResultat(audienceId, createResultatDto, userId);
  }

  @Get(':id/resultat')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ summary: 'Récupérer le résultat d\'une audience' })
  @ApiResponse({ status: 200, description: 'Résultat récupéré avec succès', type: ResultatAudienceResponseDto })
  @ApiResponse({ status: 404, description: 'Audience ou résultat non trouvé' })
  async getResultat(@Param('id', ParseUUIDPipe) audienceId: string): Promise<ResultatAudienceResponseDto> {
    return this.audiencesService.getResultat(audienceId);
  }

  @Patch(':id/resultat')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'UPDATE_RESULTAT_AUDIENCE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Mettre à jour le résultat d\'une audience' })
  @ApiResponse({ status: 200, description: 'Résultat mis à jour avec succès', type: ResultatAudienceResponseDto })
  @ApiResponse({ status: 404, description: 'Audience ou résultat non trouvé' })
  async updateResultat(
    @Param('id', ParseUUIDPipe) audienceId: string,
    @Body() updateResultatDto: UpdateResultatAudienceDto,
    @CurrentUser('id') userId: string,
  ): Promise<ResultatAudienceResponseDto> {
    return this.audiencesService.updateResultat(audienceId, updateResultatDto, userId);
  }

  @Delete(':id/resultat')
  @Roles(AppRole.admin)
  @AuditLog({ action: 'DELETE_RESULTAT_AUDIENCE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Supprimer le résultat d\'une audience' })
  @ApiResponse({ status: 200, description: 'Résultat supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Audience ou résultat non trouvé' })
  async removeResultat(@Param('id', ParseUUIDPipe) audienceId: string): Promise<{ message: string }> {
    await this.audiencesService.removeResultat(audienceId);
    return { message: 'Résultat supprimé avec succès' };
  }

  // === ENDPOINTS POUR LES ACTIONS SPÉCIALES ===

  @Patch(':id/enrolement')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'MARK_ENROLEMENT_EFFECTUE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Marquer l\'enrôlement comme effectué' })
  @ApiResponse({ status: 200, description: 'Enrôlement marqué comme effectué', type: AudienceResponseDto })
  @ApiResponse({ status: 404, description: 'Audience non trouvée' })
  async marquerEnrolementEffectue(@Param('id', ParseUUIDPipe) id: string): Promise<AudienceResponseDto> {
    return this.audiencesService.marquerEnrolementEffectue(id);
  }

  @Get('rappel-enrolement')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Récupérer les audiences nécessitant un rappel d\'enrôlement' })
  @ApiResponse({ status: 200, description: 'Liste des audiences nécessitant un rappel', type: [AudienceResponseDto] })
  async getAudiencesRappelEnrolement(): Promise<AudienceResponseDto[]> {
    return this.audiencesService.getAudiencesRappelEnrolement();
  }

  @Get('statistics')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ summary: 'Obtenir les statistiques des audiences' })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques des audiences récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Nombre total d\'audiences' },
        aVenir: { type: 'number', description: 'Nombre d\'audiences à venir' },
        tenues: { type: 'number', description: 'Nombre d\'audiences tenues (renseignées)' },
        nonRenseignees: { type: 'number', description: 'Nombre d\'audiences non renseignées' }
      }
    }
  })
  async getStatistics(): Promise<{
    total: number;
    aVenir: number;
    tenues: number;
    nonRenseignees: number;
  }> {
    return this.audiencesService.getStatistics();
  }

  @Post('update-passed-statuses')
  @Roles(AppRole.admin)
  @AuditLog({ action: 'MANUAL_UPDATE_AUDIENCE_STATUSES', module: 'CONTENTIEUX' })
  @ApiOperation({ 
    summary: 'Déclencher manuellement la mise à jour des statuts d\'audiences passées',
    description: 'Met à jour le statut des audiences passées de A_VENIR vers PASSEE_NON_RENSEIGNEE. Normalement exécuté automatiquement chaque jour à minuit.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Mise à jour des statuts effectuée avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  async updatePassedAudienceStatuses(): Promise<{ message: string; timestamp: string }> {
    await this.audienceCronService.triggerManualUpdate();
    return {
      message: 'Mise à jour des statuts d\'audiences passées effectuée avec succès',
      timestamp: new Date().toISOString(),
    };
  }
}