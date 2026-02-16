import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'auditLog';

export interface AuditLogOptions {
  action?: string;
  module?: string;
  entityType?: string;
  skipAudit?: boolean;
}

export const AuditLog = (options: AuditLogOptions = {}) => 
  SetMetadata(AUDIT_LOG_KEY, options);