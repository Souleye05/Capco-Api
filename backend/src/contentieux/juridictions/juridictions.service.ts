import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateJuridictionDto, UpdateJuridictionDto, JuridictionsQueryDto } from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

// Interface temporaire en attendant la génération Prisma
interface Juridiction {
  id: string;
  nom: string;
  code?: string;
  description?: string;
  ordre: number;
  estActif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class JuridictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createJuridictionDto: CreateJuridictionDto): Promise<Juridiction> {
    return (this.prisma as any).juridiction.create({
      data: createJuridictionDto,
    });
  }

  async findAll(query: JuridictionsQueryDto): Promise<PaginatedResponse<Juridiction>> {
    const { estActif, code, nom, ...paginationQuery } = query;

    // Build where clause for filters
    const where: any = {};

    if (estActif !== undefined) {
      where.estActif = estActif;
    }

    if (code) {
      where.code = { contains: code, mode: 'insensitive' };
    }

    if (nom) {
      where.nom = { contains: nom, mode: 'insensitive' };
    }

    return this.paginationService.paginate(
      (this.prisma as any).juridiction,
      paginationQuery,
      {
        where,
        searchFields: ['nom', 'code', 'description'],
        defaultSortBy: 'ordre',
      },
    );
  }

  async findOne(id: string): Promise<Juridiction> {
    return (this.prisma as any).juridiction.findUniqueOrThrow({
      where: { id },
    });
  }

  async update(id: string, updateJuridictionDto: UpdateJuridictionDto): Promise<Juridiction> {
    return (this.prisma as any).juridiction.update({
      where: { id },
      data: updateJuridictionDto,
    });
  }

  async remove(id: string): Promise<void> {
    await (this.prisma as any).juridiction.delete({
      where: { id },
    });
  }

  async findActive(): Promise<Juridiction[]> {
    return (this.prisma as any).juridiction.findMany({
      where: { estActif: true },
      orderBy: { ordre: 'asc' },
    });
  }

  async search(search: string, limit: number = 10): Promise<Juridiction[]> {
    return this.paginationService.searchOnly(
      (this.prisma as any).juridiction,
      search,
      ['nom', 'code', 'description'],
      limit,
    );
  }
}