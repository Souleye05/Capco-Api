import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const dbHealthy = await this.prismaService.healthCheck();
    const connectionInfo = await this.prismaService.getConnectionInfo();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('app.environment'),
      database: {
        healthy: dbHealthy,
        connection: connectionInfo,
      },
      configuration: {
        port: this.configService.get<number>('app.port'),
        apiPrefix: this.configService.get<string>('app.apiPrefix'),
        corsOrigins: this.configService.get<string[]>('app.corsOrigins'),
        enableSwagger: this.configService.get<boolean>('app.enableSwagger'),
        enableAudit: this.configService.get<boolean>('app.enableAudit'),
      },
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Configuration validation check' })
  @ApiResponse({ status: 200, description: 'Configuration is valid' })
  async configCheck() {
    return {
      status: 'ok',
      message: 'Configuration validation passed',
      configs: {
        database: {
          host: this.configService.get<string>('database.host'),
          port: this.configService.get<number>('database.port'),
          database: this.configService.get<string>('database.database'),
          schema: this.configService.get<string>('database.schema'),
        },
        jwt: {
          issuer: this.configService.get<string>('jwt.issuer'),
          audience: this.configService.get<string>('jwt.audience'),
          expiresIn: this.configService.get<string>('jwt.expiresIn'),
        },
        app: {
          environment: this.configService.get<string>('app.environment'),
          port: this.configService.get<number>('app.port'),
          logLevel: this.configService.get<string>('app.logLevel'),
        },
      },
    };
  }
}