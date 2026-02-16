import {
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuditLog } from '../decorators/audit-log.decorator';
import { ParseUUIDPipe } from '../pipes/parse-uuid.pipe';
import { BaseCrudService, SecurityContext, CrudEntity } from '../services/base-crud.service';
import { PaginationQueryDto, PaginatedResponse } from '../dto/pagination.dto';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Array<{ role: string }>;
  cabinetId?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
export abstract class BaseCrudController<
  TEntity extends CrudEntity,
  TCreateDto = any,
  TUpdateDto = any,
  TQueryDto extends PaginationQueryDto = PaginationQueryDto
> {
  constructor(
    protected readonly service: BaseCrudService<TEntity, TCreateDto, TUpdateDto, TQueryDto>,
  ) {}

  @Get()
  @AuditLog({ action: 'LIST' })
  async findAll(
    @Query() query: TQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponse<TEntity>> {
    const securityContext = this.buildSecurityContext(user);
    return this.service.findAll(query, securityContext);
  }

  @Get(':id')
  @AuditLog({ action: 'READ' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TEntity> {
    const securityContext = this.buildSecurityContext(user);
    return this.service.findOne(id, securityContext);
  }

  @Post()
  @AuditLog({ action: 'CREATE' })
  async create(
    @Body() createDto: TCreateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TEntity> {
    const securityContext = this.buildSecurityContext(user);
    return this.service.create(createDto, securityContext);
  }

  @Put(':id')
  @AuditLog({ action: 'UPDATE' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: TUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TEntity> {
    const securityContext = this.buildSecurityContext(user);
    return this.service.update(id, updateDto, securityContext);
  }

  @Delete(':id')
  @AuditLog({ action: 'DELETE' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    const securityContext = this.buildSecurityContext(user);
    return this.service.remove(id, securityContext);
  }

  protected buildSecurityContext(user: AuthenticatedUser): SecurityContext {
    return {
      userId: user.id,
      roles: user.roles.map(r => r.role),
      cabinetId: user.cabinetId,
    };
  }
}