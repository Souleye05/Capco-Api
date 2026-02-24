import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecouvrementService } from './recouvrement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Recouvrement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recouvrement')
export class RecouvrementController {
    constructor(private readonly recouvrementService: RecouvrementService) { }

    @Get('dashboard')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Tableau de bord du recouvrement' })
    async getDashboard() {
        return this.recouvrementService.getDashboard();
    }
}
