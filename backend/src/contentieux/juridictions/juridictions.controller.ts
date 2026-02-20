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
import { JuridictionsService } from './juridictions.service';
import {
  CreateJuridictionDto,
  UpdateJuridictionDto,
  JuridictionResponseDto,
  JuridictionsQueryDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppRole } from '@prisma/client';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@ApiTags('Juridictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('juridictions')
export class JuridictionsController {
  constructor(private readonly juridictionsService: JuridictionsService) {}

  @Post()
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Créer une nouvelle juridiction' })
  @ApiResponse({
    status: 201,
    description: 'Juridiction créée avec succès',
    type: JuridictionResponseDto,
  })
  async create(@Body() createJuridictionDto: CreateJuridictionDto): Promise<JuridictionResponseDto> {
    return this.juridictionsService.create(createJuridictionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les juridictions avec pagination' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des juridictions',
  })
  async findAll(@Query() query: JuridictionsQueryDto): Promise<PaginatedResponse<JuridictionResponseDto>> {
    return this.juridictionsService.findAll(query);
  }

  @Get('active')
  @Public() // Rendre cet endpoint public pour le frontend
  @ApiOperation({ summary: 'Récupérer toutes les juridictions actives' })
  @ApiResponse({
    status: 200,
    description: 'Liste des juridictions actives',
    type: [JuridictionResponseDto],
  })
  async findActive(): Promise<JuridictionResponseDto[]> {
    return this.juridictionsService.findActive();
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des juridictions' })
  @ApiResponse({
    status: 200,
    description: 'Résultats de recherche',
    type: [JuridictionResponseDto],
  })
  async search(
    @Query('q') search: string,
    @Query('limit') limit?: number,
  ): Promise<JuridictionResponseDto[]> {
    return this.juridictionsService.search(search, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une juridiction par ID' })
  @ApiResponse({
    status: 200,
    description: 'Juridiction trouvée',
    type: JuridictionResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<JuridictionResponseDto> {
    return this.juridictionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Mettre à jour une juridiction' })
  @ApiResponse({
    status: 200,
    description: 'Juridiction mise à jour avec succès',
    type: JuridictionResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateJuridictionDto: UpdateJuridictionDto,
  ): Promise<JuridictionResponseDto> {
    return this.juridictionsService.update(id, updateJuridictionDto);
  }

  @Delete(':id')
  @Roles(AppRole.admin)
  @ApiOperation({ summary: 'Supprimer une juridiction' })
  @ApiResponse({
    status: 200,
    description: 'Juridiction supprimée avec succès',
  })
  async remove(@Param('id') id: string) {
    await this.juridictionsService.remove(id);
    return { message: 'Juridiction supprimée avec succès' };
  }
}