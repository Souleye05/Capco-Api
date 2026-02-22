import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { getAppConfig } from './config/config.helpers';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    const appConfig = getAppConfig(configService);

    // Get configuration values (typed)
    const { port, corsOrigins, enableSwagger, apiPrefix, environment } = appConfig;

    // Set global prefix
    app.setGlobalPrefix(apiPrefix);

    // Enable CORS
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Global validation pipe with enhanced configuration
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: environment === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }));

    // Swagger documentation
    if (enableSwagger) {
      const config = new DocumentBuilder()
        .setTitle('CAPCO API')
        .setDescription('API for CAPCO law firm management system')
        .setVersion('1.0')
        .addBearerAuth({
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        })
        .addTag('Authentication', 'User authentication and authorization')
        .addTag('Users', 'User management')
        .addTag('Contentieux', 'Litigation management')
        .addTag('Recouvrement', 'Debt recovery management')
        .addTag('Immobilier', 'Real estate management')
        .addTag('Conseil', 'Legal consulting management')
        .addTag('Audit', 'Audit logs and tracking')
        .addTag('Dashboard', 'Dashboard and statistics')
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
        },
      });
      
      logger.log(`Swagger documentation available at http://localhost:${port}/${apiPrefix}/docs`);
    }

    await app.listen(port);
    
    logger.log(`🚀 CAPCO API is running on http://localhost:${port}/${apiPrefix}`);
    logger.log(`📝 Environment: ${environment}`);
    // Avoid logging full CORS origins list (may contain internal URLs)
    logger.log(`🔗 CORS origins configured: ${Array.isArray(corsOrigins) ? corsOrigins.length : 'unknown'} entries`);
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();