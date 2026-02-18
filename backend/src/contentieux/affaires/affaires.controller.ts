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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AffairesService } from './affaires.service';
import { CreateAffaireDto } from './dto/create-affaire.dto';
import { UpdateAffaireDto } from './dto/update-affaire.dto';
import { AffaireResponseDto } from './dto/affaire-response.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Affaires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contentieux/affaires')
export class AffairesController {
  constructor(private readonly affairesService: AffairesService) {}

  @Post()
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'CREATE_AFFAIRE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Créer une nouvelle affaire' })
  @ApiResponse({ status: 201, description: 'Affaire créée avec succès', type: AffaireResponseDto })
  async create(
    @Body() createAffaireDto: CreateAffaireDto,
    @CurrentUser('id') userId: string,
  ): Promise<AffaireResponseDto> {
    return this.affairesService.create(createAffaireDto, userId);
  }

  @Get()
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ summary: 'Récupérer toutes les affaires avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste des affaires récupérée avec succès' })
  async findAll(@Query() pagination: PaginationQueryDto): Promise<PaginatedResponse<AffaireResponseDto>> {
    return this.affairesService.findAll(pagination);
  }

  @Get(':id')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ summary: 'Récupérer une affaire par ID' })
  @ApiResponse({ status: 200, description: 'Affaire récupérée avec succès', type: AffaireResponseDto })
  @ApiResponse({ status: 404, description: 'Affaire non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AffaireResponseDto> {
    return this.affairesService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.admin, AppRole.collaborateur)
  @AuditLog({ action: 'UPDATE_AFFAIRE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Mettre à jour une affaire' })
  @ApiResponse({ status: 200, description: 'Affaire mise à jour avec succès', type: AffaireResponseDto })
  @ApiResponse({ status: 404, description: 'Affaire non trouvée' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAffaireDto: UpdateAffaireDto,
  ): Promise<AffaireResponseDto> {
    return this.affairesService.update(id, updateAffaireDto);
  }

  @Delete(':id')
  @Roles(AppRole.admin)
  @AuditLog({ action: 'DELETE_AFFAIRE', module: 'CONTENTIEUX' })
  @ApiOperation({ summary: 'Supprimer une affaire' })
  @ApiResponse({ status: 200, description: 'Affaire supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Affaire non trouvée' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string}> {
    await this.affairesService.remove(id);
    return { message: 'Affaire supprimée avec succès' };
  }
}