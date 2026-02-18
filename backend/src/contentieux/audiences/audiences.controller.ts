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
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { AudienceResponseDto } from './dto/audience-response.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
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
  constructor(private readonly audiencesService: AudiencesService) {}

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
    @Query() pagination: PaginationQueryDto,
    @Query('affaireId') affaireId?: string,
  ): Promise<PaginatedResponse<AudienceResponseDto>> {
    return this.audiencesService.findAll({ ...pagination, affaireId });
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
}