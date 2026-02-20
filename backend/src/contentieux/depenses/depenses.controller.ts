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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { DepensesService } from './depenses.service';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { UpdateDepenseDto } from './dto/update-depense.dto';
import { DepensesQueryDto } from './dto/depenses-query.dto';

@ApiTags('Dépenses Affaires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contentieux/depenses')
export class DepensesController {
  constructor(private readonly depensesService: DepensesService) {}

  @Post()
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'CREATION', entityType: 'DEPENSES_AFFAIRES' })
  @ApiOperation({ summary: 'Créer une nouvelle dépense' })
  @ApiResponse({ status: 201, description: 'Dépense créée avec succès' })
  async create(
    @Body() createDepenseDto: CreateDepenseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.depensesService.create(createDepenseDto, userId);
  }

  @Get()
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Récupérer toutes les dépenses avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste des dépenses récupérée avec succès' })
  async findAll(@Query() query: DepensesQueryDto) {
    return this.depensesService.findAll(query);
  }

  @Get('statistiques')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Obtenir les statistiques des dépenses' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStatistics() {
    return this.depensesService.getStatistics();
  }

  @Get('rapport-periode')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Obtenir le rapport des dépenses par période' })
  @ApiResponse({ status: 200, description: 'Rapport récupéré avec succès' })
  async getRapportPeriode(
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string,
  ) {
    return this.depensesService.getRapportPeriode(new Date(dateDebut), new Date(dateFin));
  }

  @Get('affaire/:affaireId')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Récupérer les dépenses d\'une affaire' })
  @ApiResponse({ status: 200, description: 'Dépenses de l\'affaire récupérées avec succès' })
  async findByAffaire(@Param('affaireId') affaireId: string) {
    return this.depensesService.findByAffaire(affaireId);
  }

  @Get('type/:typeDepense')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Récupérer les dépenses par type' })
  @ApiResponse({ status: 200, description: 'Dépenses par type récupérées avec succès' })
  async findByType(@Param('typeDepense') typeDepense: string) {
    return this.depensesService.findByType(typeDepense);
  }

  @Get(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Récupérer une dépense par ID' })
  @ApiResponse({ status: 200, description: 'Dépense récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Dépense non trouvée' })
  async findOne(@Param('id') id: string) {
    return this.depensesService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'MODIFICATION', entityType: 'DEPENSES_AFFAIRES' })
  @ApiOperation({ summary: 'Mettre à jour une dépense' })
  @ApiResponse({ status: 200, description: 'Dépense mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Dépense non trouvée' })
  async update(
    @Param('id') id: string,
    @Body() updateDepenseDto: UpdateDepenseDto,
  ) {
    return this.depensesService.update(id, updateDepenseDto);
  }

  @Delete(':id')
  @Roles(AppRole.admin)
  @AuditLog({ action: 'SUPPRESSION', entityType: 'DEPENSES_AFFAIRES' })
  @ApiOperation({ summary: 'Supprimer une dépense' })
  @ApiResponse({ status: 200, description: 'Dépense supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Dépense non trouvée' })
  async remove(@Param('id') id: string) {
    await this.depensesService.remove(id);
    return { message: 'Dépense supprimée avec succès' };
  }
}