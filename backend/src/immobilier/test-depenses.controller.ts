import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Test - Dépenses')
@Controller('immobilier/test-depenses')
export class TestDepensesController {
    @Get()
    @ApiOperation({ summary: 'Test endpoint pour dépenses sans authentification' })
    async test(@Query('immeubleId') immeubleId?: string) {
        return { 
            message: 'Endpoint dépenses fonctionne correctement', 
            timestamp: new Date().toISOString(),
            immeubleId: immeubleId || 'non fourni'
        };
    }
}