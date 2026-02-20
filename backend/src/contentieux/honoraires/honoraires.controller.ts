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
import { HonorairesService } from './honoraires.service';
import { CreateHonoraireDto } from './dto/create-honoraire.dto';
import { UpdateHonoraireDto } from './dto/update-honoraire.dto';
import { HonorairesQueryDto } from './dto/honoraires-query.dto';

@ApiTags('Honoraires Contentieux')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contentieux/honoraires')
export class HonorairesController {
  constructor(private readonly honorairesService: HonorairesService) {}

  @Post()
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'CREATION', entityType: 'HONORAIRES_CONTENTIEUX' })
  @ApiOperation({ summary: 'Créer un nouvel honoraire' })
  @ApiResponse({ status: 201, description: 'Honoraire créé avec succès' })
  async create(
    @Body() createHonoraireDto: CreateHonoraireDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.honorairesService.create(createHonoraireDto, userId);
  }

  @Get()
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Récupérer tous les honoraires avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste des honoraires récupérée avec succès' })
  async findAll(@Query() query: HonorairesQueryDto) {
    return this.honorairesService.findAll(query);
  }

  @Get('statistiques')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Obtenir les statistiques des honoraires' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStatistics() {
    return this.honorairesService.getStatistics();
  }

  @Get('affaire/:affaireId')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Récupérer les honoraires d\'une affaire' })
  @ApiResponse({ status: 200, description: 'Honoraires de l\'affaire récupérés avec succès' })
  async findByAffaire(@Param('affaireId') affaireId: string) {
    return this.honorairesService.findByAffaire(affaireId);
  }

  @Get(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @ApiOperation({ summary: 'Récupérer un honoraire par ID' })
  @ApiResponse({ status: 200, description: 'Honoraire récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Honoraire non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.honorairesService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'MODIFICATION', entityType: 'HONORAIRES_CONTENTIEUX' })
  @ApiOperation({ summary: 'Mettre à jour un honoraire' })
  @ApiResponse({ status: 200, description: 'Honoraire mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Honoraire non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateHonoraireDto: UpdateHonoraireDto,
  ) {
    return this.honorairesService.update(id, updateHonoraireDto);
  }

  @Delete(':id')
  @Roles(AppRole.admin)
  @AuditLog({ action: 'SUPPRESSION', entityType: 'HONORAIRES_CONTENTIEUX' })
  @ApiOperation({ summary: 'Supprimer un honoraire' })
  @ApiResponse({ status: 200, description: 'Honoraire supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Honoraire non trouvé' })
  async remove(@Param('id') id: string) {
    await this.honorairesService.remove(id);
    return { message: 'Honoraire supprimé avec succès' };
  }
}