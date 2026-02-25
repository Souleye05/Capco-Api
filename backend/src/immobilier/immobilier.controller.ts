import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImmobilierService } from './immobilier.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '@prisma/client';

@ApiTags('Immobilier')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilier')
export class ImmobilierController {
    constructor(private readonly immobilierService: ImmobilierService) { }

    @Get('dashboard')
    @Roles(AppRole.admin, AppRole.collaborateur, AppRole.compta)
    @ApiOperation({ summary: 'Tableau de bord immobilier' })
    async getDashboard() {
        return this.immobilierService.getDashboard();
    }
}
