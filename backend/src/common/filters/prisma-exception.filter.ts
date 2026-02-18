import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { 
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

@Catch(
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    if (exception instanceof PrismaClientKnownRequestError) {
      status = this.handleKnownRequestError(exception);
      message = this.getKnownErrorMessage(exception);
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
    } else if (exception instanceof PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown database error';
    }

    this.logger.error(
      `Database error: ${exception.code || 'UNKNOWN'} - ${exception.message}`,
      exception.stack,
    );

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: 'Database Error',
    };

    response.status(status).json(errorResponse);
  }

  private handleKnownRequestError(
    exception: PrismaClientKnownRequestError,
  ): HttpStatus {
    switch (exception.code) {
      case 'P2000': // Value too long for field
        return HttpStatus.BAD_REQUEST;
      case 'P2001': // Record not found in where condition
        return HttpStatus.BAD_REQUEST;
      case 'P2002': // Unique constraint violation
        return HttpStatus.CONFLICT;
      case 'P2003': // Foreign key constraint violation
        return HttpStatus.BAD_REQUEST;
      case 'P2004': // Constraint violation
        return HttpStatus.BAD_REQUEST;
      case 'P2005': // Invalid value
      case 'P2006': // Invalid value
      case 'P2007': // Data validation error
        return HttpStatus.BAD_REQUEST;
      case 'P2025': // Record not found
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private getKnownErrorMessage(
    exception: PrismaClientKnownRequestError,
  ): string {
    switch (exception.code) {
      case 'P2000':
        return 'The provided value is too long for the field';
      case 'P2001':
        return 'The requested record was not found';
      case 'P2025':
        return 'The requested record was not found';
      case 'P2002':
        return 'A record with this value already exists';
      case 'P2003':
        return 'Invalid reference to related record';
      case 'P2004':
        return 'A constraint failed on the database';
      case 'P2005':
      case 'P2006':
      case 'P2007':
        return 'Invalid data provided';
      default:
        return 'A database error occurred';
    }
  }
}