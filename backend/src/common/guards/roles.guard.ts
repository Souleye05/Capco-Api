import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../types/prisma-enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface UserRole {
  role: AppRole;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  roles?: UserRole[] | string[]; // Support both formats
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: AuthenticatedUser } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.roles || user.roles.length === 0) {
      throw new ForbiddenException('User has no roles assigned');
    }

    // Support both string array and object array formats
    const userRoles: string[] = user.roles.map(role => 
      typeof role === 'string' ? role : role.role
    );

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}