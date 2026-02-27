import {
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientsConseilService } from './clients-conseil/clients-conseil.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '../types/prisma-enums';

@ApiTags('Conseil - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('conseil')
export class ConseilController {
  constructor(
    private readonly clientsConseilService: ClientsConseilService,
  ) {}

  @Get('dashboard')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Récupérer le tableau de bord du module conseil',
    description: 'Récupère les statistiques et indicateurs clés du module conseil'
  })
  @ApiResponse({
    status: 200,
    description: 'Données du tableau de bord récupérées avec succès',
  })
  async getDashboard() {
    const clientStats = await this.clientsConseilService.getStatistics();
    
    return {
      clients: clientStats,
      // Ici on pourrait ajouter d'autres statistiques comme :
      // - Nombre de tâches du mois
      // - Chiffre d'affaires du mois
      // - Factures en attente de paiement
      // - etc.
    };
  }

  @Get('health')
  @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
  @ApiOperation({ 
    summary: 'Vérifier l\'état du module conseil',
    description: 'Endpoint de santé pour vérifier que le module conseil fonctionne correctement'
  })
  @ApiResponse({
    status: 200,
    description: 'Module conseil opérationnel',
  })
  async getHealth() {
    return {
      status: 'healthy',
      module: 'conseil',
      timestamp: new Date().toISOString(),
      message: 'Module Conseil opérationnel',
    };
  }
}