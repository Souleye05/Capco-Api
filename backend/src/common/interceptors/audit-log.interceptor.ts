import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../services/prisma.service';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Skip audit if explicitly disabled
    if (auditOptions?.skipAudit) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const body = request.body;

    // Skip audit for non-authenticated requests
    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.logAuditEntry({
            user,
            method,
            url,
            body,
            response,
            auditOptions,
            duration: Date.now() - startTime,
            success: true,
          });
        },
        error: (error) => {
          this.logAuditEntry({
            user,
            method,
            url,
            body,
            error: error.message,
            auditOptions,
            duration: Date.now() - startTime,
            success: false,
          });
        },
      }),
    );
  }

  private async logAuditEntry(data: {
    user: any;
    method: string;
    url: string;
    body: any;
    response?: any;
    error?: string;
    auditOptions?: AuditLogOptions;
    duration: number;
    success: boolean;
  }) {
    try {
      const {
        user,
        method,
        url,
        body,
        response,
        error,
        auditOptions,
        duration,
        success,
      } = data;

      // Extract entity information from response or body
      let entityId: string | null = null;
      let entityType: string | null = null;

      if (auditOptions?.entityType) {
        entityType = auditOptions.entityType;
      }

      if (response?.id) {
        entityId = response.id;
      } else if (body?.id) {
        entityId = body.id;
      }

      // Determine action from method and custom options
      let action = auditOptions?.action;
      if (!action) {
        switch (method) {
          case 'POST':
            action = 'CREATE';
            break;
          case 'PUT':
          case 'PATCH':
            action = 'UPDATE';
            break;
          case 'DELETE':
            action = 'DELETE';
            break;
          case 'GET':
            action = 'READ';
            break;
          default:
            action = method;
        }
      }

      // Extract module from URL or use custom module
      const module = auditOptions?.module || this.extractModuleFromUrl(url);

      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action,
          module,
          entityType,
          entityId,
          entityReference: response?.reference || null,
        },
      });
    } catch (auditError) {
      // Log audit errors but don't fail the request
      console.error('Failed to create audit log:', auditError);
    }
  }

  private extractModuleFromUrl(url: string): string {
    const pathSegments = url.split('/').filter(Boolean);
    return pathSegments[0] || 'unknown';
  }

  private extractIpAddress(request: any): string {
    return request.ip || 
           request.connection?.remoteAddress || 
           request.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           '127.0.0.1';
  }

  private sanitizeData(data: any): any {
    if (!data) return null;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}