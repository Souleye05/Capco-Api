import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';
import { getAppConfig, getDatabaseConfig } from '../config/config.helpers';
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
    const connectionStats = await this.prismaService.getConnectionStats();
    const appCfg = getAppConfig(this.configService);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: appCfg.environment,
      database: {
        healthy: dbHealthy,
        // non-sensitive runtime stats only
        connectionStats,
      },
      configuration: {
        port: appCfg.port,
        apiPrefix: appCfg.apiPrefix,
        // do not expose full CORS origins list in health endpoint
        corsOriginsCount: (appCfg.corsOrigins || []).length,
        enableSwagger: appCfg.enableSwagger,
        enableAudit: appCfg.enableAudit,
      },
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Configuration validation check' })
  @ApiResponse({ status: 200, description: 'Configuration is valid' })
  async configCheck() {
    const dbCfg = getDatabaseConfig(this.configService);
    const appCfg = getAppConfig(this.configService);

    return {
      status: 'ok',
      message: 'Configuration validation passed',
      configs: {
        database: {
          // only expose presence of database URL and non-sensitive numeric settings
          urlSet: !!dbCfg.url,
          maxConnections: dbCfg.maxConnections,
          connectionTimeout: dbCfg.connectionTimeout,
        },
        jwt: {
          issuer: this.configService.get<string>('jwt.issuer'),
          audience: this.configService.get<string>('jwt.audience'),
          expiresIn: this.configService.get<string>('jwt.expiresIn'),
        },
        app: {
          environment: appCfg.environment,
          port: appCfg.port,
          logLevel: appCfg.logLevel,
        },
      },
    };
  }
}