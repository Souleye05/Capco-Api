import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './services/prisma.service';
import { ReferenceGeneratorService } from './services/reference-generator.service';

// Guards
import { JwtAuthGuard, RolesGuard } from './guards';

// Interceptors
import { AuditLogInterceptor, TransformInterceptor, LoggingInterceptor } from './interceptors';

// Pipes
import { ValidationPipe, ParseUUIDPipe } from './pipes';

// Filters
import { AllExceptionsFilter, PrismaExceptionFilter } from './filters';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    ReferenceGeneratorService,
    // Guards
    JwtAuthGuard,
    RolesGuard,
    // Interceptors
    AuditLogInterceptor,
    TransformInterceptor,
    LoggingInterceptor,
    // Pipes
    ValidationPipe,
    ParseUUIDPipe,
    // Filters
    AllExceptionsFilter,
    PrismaExceptionFilter,
  ],
  exports: [
    PrismaService,
    ReferenceGeneratorService,
    // Guards
    JwtAuthGuard,
    RolesGuard,
    // Interceptors
    AuditLogInterceptor,
    TransformInterceptor,
    LoggingInterceptor,
    // Pipes
    ValidationPipe,
    ParseUUIDPipe,
    // Filters
    AllExceptionsFilter,
    PrismaExceptionFilter,
  ],
})
export class CommonModule {}