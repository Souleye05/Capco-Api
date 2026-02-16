import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/services/prisma.service';
import { BaseCrudService, SecurityContext } from '../common/services/base-crud.service';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { User, AppRole } from '@prisma/client';
import {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto,
} from './dto/users.dto';

export interface UserWithRoles extends User {
  userRoles: Array<{ id: string; role: AppRole }>;
}

@Injectable()
export class UsersService extends BaseCrudService<
  UserWithRoles,
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto
> {
  protected modelName = 'user';
  protected searchFields = ['email'];

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  // Override findAll to add admin permission check and role filtering
  async findAll(
    query: UsersQueryDto,
    securityContext: SecurityContext,
  ): Promise<PaginatedResponse<UserWithRoles>> {
    // Check admin permissions for listing all users
    if (!this.isAdmin(securityContext)) {
      throw new ForbiddenException('Only admins can list all users');
    }

    return super.findAll(query, securityContext);
  }

  // Override findOne to add permission check
  async findOne(
    id: string,
    securityContext: SecurityContext,
  ): Promise<UserWithRoles> {
    // Non-admin users can only see their own profile
    if (!this.isAdmin(securityContext) && securityContext.userId !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    return super.findOne(id, securityContext);
  }

  // Override create to handle password hashing and role assignment
  async create(
    createDto: CreateUserDto,
    securityContext: SecurityContext,
  ): Promise<UserWithRoles> {
    // Check admin permissions
    if (!this.isAdmin(securityContext)) {
      throw new ForbiddenException('Only admins can create users');
    }

    // Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createDto.password, 12);

    // Create user with transaction to handle roles
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: createDto.email,
          password: hashedPassword,
        },
        include: this.getIncludeRelations(),
      });

      // Assign roles if provided
      if (createDto.roles && createDto.roles.length > 0) {
        await Promise.all(
          createDto.roles.map((role) =>
            tx.userRoles.create({
              data: {
                userId: user.id,
                role,
              },
            }),
          ),
        );
      }

      // Return user with roles
      return await tx.user.findUnique({
        where: { id: user.id },
        include: this.getIncludeRelations(),
      });
    });

    return this.transformResponse(result);
  }

  // Override update to handle email changes
  async update(
    id: string,
    updateDto: UpdateUserDto,
    securityContext: SecurityContext,
  ): Promise<UserWithRoles> {
    // Check admin permissions
    if (!this.isAdmin(securityContext)) {
      throw new ForbiddenException('Only admins can update users');
    }

    // Check if email is being changed and is unique
    if (updateDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already exists');
      }
    }

    return super.update(id, updateDto, securityContext);
  }

  // Override remove to prevent deleting last admin
  async remove(
    id: string,
    securityContext: SecurityContext,
  ): Promise<{ message: string }> {
    // Check admin permissions
    if (!this.isAdmin(securityContext)) {
      throw new ForbiddenException('Only admins can delete users');
    }

    // Check if user exists and get their roles
    const user = await this.findOne(id, securityContext);
    const userRoles = user.userRoles.map((ur) => ur.role);

    // Prevent deleting last admin
    if (userRoles.includes('admin')) {
      const adminCount = await this.prisma.userRoles.count({
        where: { role: 'admin' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    return super.remove(id, securityContext);
  }

  // Role management methods
  async assignRole(userId: string, role: AppRole, securityContext: SecurityContext): Promise<void> {
    if (!this.isAdmin(securityContext)) {
      throw new ForbiddenException('Only admins can assign roles');
    }

    // Check if user exists
    const user = await this.findOne(userId, securityContext);

    // Check if user already has this role
    const existingRole = await this.prisma.userRoles.findFirst({
      where: {
        userId,
        role,
      },
    });

    if (existingRole) {
      throw new BadRequestException('User already has this role');
    }

    await this.prisma.userRoles.create({
      data: {
        userId,
        role,
      },
    });
  }

  async removeRole(userId: string, role: AppRole, securityContext: SecurityContext): Promise<void> {
    if (!this.isAdmin(securityContext)) {
      throw new ForbiddenException('Only admins can remove roles');
    }

    // Check if user exists
    const user = await this.findOne(userId, securityContext);

    // Check if user has this role
    const existingRole = await this.prisma.userRoles.findFirst({
      where: {
        userId,
        role,
      },
    });

    if (!existingRole) {
      throw new BadRequestException('User does not have this role');
    }

    // Prevent removing last admin role
    if (role === 'admin') {
      const adminCount = await this.prisma.userRoles.count({
        where: { role: 'admin' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin role');
      }
    }

    await this.prisma.userRoles.delete({
      where: { id: existingRole.id },
    });
  }

  async getRoles(userId: string, securityContext: SecurityContext): Promise<AppRole[]> {
    // Non-admin users can only see their own roles
    if (!this.isAdmin(securityContext) && securityContext.userId !== userId) {
      throw new ForbiddenException('You can only view your own roles');
    }

    // Check if user exists
    const user = await this.findOne(userId, securityContext);

    return user.userRoles.map((ur) => ur.role);
  }

  async getUsersByRole(
    role: AppRole,
    query: UsersQueryDto,
    securityContext: SecurityContext,
  ): Promise<PaginatedResponse<UserWithRoles>> {
    if (!this.isAdmin(securityContext)) {
      throw new ForbiddenException('Only admins can list users by role');
    }

    // Add role filter to query
    const roleQuery = { ...query, filterByRole: role };
    return this.findAll(roleQuery, securityContext);
  }

  // Implementation of abstract methods from BaseCrudService
  protected buildSecurityConditions(context: SecurityContext): any {
    // For users, we don't apply additional security conditions at the query level
    // since we handle permissions in the individual methods
    return {};
  }

  protected async validateCreateData(
    data: CreateUserDto,
    context: SecurityContext,
  ): Promise<any> {
    // Hash password and prepare data
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    return {
      email: data.email,
      password: hashedPassword,
    };
  }

  protected async validateUpdateData(
    data: UpdateUserDto,
    context: SecurityContext,
    existing: UserWithRoles,
  ): Promise<any> {
    return data;
  }

  protected async validateDeletePermissions(
    context: SecurityContext,
    item: UserWithRoles,
  ): Promise<void> {
    // Additional validation is handled in the remove method override
  }

  protected getIncludeRelations(): any {
    return {
      userRoles: {
        select: {
          id: true,
          role: true,
        },
      },
    };
  }

  protected buildCustomFilters(query: UsersQueryDto): any {
    const filters: any = {};

    // Filter by role if specified
    if (query.filterByRole) {
      filters.userRoles = {
        some: {
          role: query.filterByRole,
        },
      };
    }

    return filters;
  }

  protected transformResponse(item: any): UserWithRoles {
    if (!item) return item;

    return {
      ...item,
      // Exclude password from response
      password: undefined,
    };
  }

  private isAdmin(context: SecurityContext): boolean {
    return context.roles.includes('admin');
  }
}