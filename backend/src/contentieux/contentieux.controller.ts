import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '@prisma/client';
import { ContentieuxService } from './contentieux.service';

@ApiTags('Contentieux')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contentieux')
export class ContentieuxController {
  constructor(private readonly contentieuxService: ContentieuxService) {}

  @Get('dashboard')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Obtenir le tableau de bord du contentieux' })
  @ApiResponse({ status: 200, description: 'Tableau de bord récupéré avec succès' })
  async getDashboard() {
    return this.contentieuxService.getDashboard();
  }

  @Get('affaires/:id/resume-financier')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Obtenir le résumé financier d\'une affaire' })
  @ApiResponse({ status: 200, description: 'Résumé financier récupéré avec succès' })
  async getResumeFinancierAffaire(@Param('id') id: string) {
    return this.contentieuxService.getResumeFinancierAffaire(id);
  }

  @Get('planning-audiences')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Obtenir le planning des audiences' })
  @ApiResponse({ status: 200, description: 'Planning récupéré avec succès' })
  async getPlanningAudiences(
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    const dateDebutParsed = dateDebut ? new Date(dateDebut) : undefined;
    const dateFinParsed = dateFin ? new Date(dateFin) : undefined;
    
    return this.contentieuxService.getPlanningAudiences(dateDebutParsed, dateFinParsed);
  }

  @Get('recherche')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Recherche globale dans le contentieux' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche récupérés avec succès' })
  async rechercheGlobale(@Query('terme') terme: string) {
    return this.contentieuxService.rechercheGlobale(terme);
  }

  @Get('indicateurs-performance')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Obtenir les indicateurs de performance' })
  @ApiResponse({ status: 200, description: 'Indicateurs récupérés avec succès' })
  async getIndicateursPerformance() {
    return this.contentieuxService.getIndicateursPerformance();
  }

  @Get('export')
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Exporter les données du contentieux' })
  @ApiResponse({ status: 200, description: 'Données exportées avec succès' })
  async exporterDonnees(
    @Query('type') type: 'affaires' | 'audiences' | 'honoraires' | 'depenses',
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    const options = {
      type,
      format,
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
    };

    return this.contentieuxService.exporterDonnees(options);
  }
}