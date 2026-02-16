import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { getAppConfig } from '../../config/config.helpers';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const isDevelopment = getAppConfig(this.configService).environment === 'development';

    // Log the error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Prepare error response
    const errorResponse = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message,
      ...(isDevelopment && {
        error: exception instanceof Error ? exception.message : exception,
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // Remove sensitive information in production
    if (!isDevelopment) {
      this.sanitizeErrorResponse(errorResponse);
    }

    response.status(httpStatus).json(errorResponse);
  }

  private sanitizeErrorResponse(errorResponse: any): void {
    // Remove potentially sensitive information
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    if (errorResponse.message && typeof errorResponse.message === 'string') {
      sensitiveFields.forEach(field => {
        const regex = new RegExp(`${field}[\\s]*[:=][\\s]*[^\\s,}]+`, 'gi');
        errorResponse.message = errorResponse.message.replace(regex, `${field}: [REDACTED]`);
      });
    }
  }
}