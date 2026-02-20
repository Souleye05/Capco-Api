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

// Interface pour les données de la base (snake_case)
interface JuridictionDb {
  id: string;
  nom: string;
  code?: string;
  description?: string;
  ordre: number;
  est_actif: boolean;
  created_at: Date;
  updated_at: Date;
}

// Fonction utilitaire pour mapper les données de la base vers l'interface
function mapJuridictionFromDb(dbJuridiction: JuridictionDb): Juridiction {
  return {
    id: dbJuridiction.id,
    nom: dbJuridiction.nom,
    code: dbJuridiction.code,
    description: dbJuridiction.description,
    ordre: dbJuridiction.ordre,
    estActif: dbJuridiction.est_actif,
    createdAt: dbJuridiction.created_at,
    updatedAt: dbJuridiction.updated_at,
  };
}

@Injectable()
export class JuridictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createJuridictionDto: CreateJuridictionDto): Promise<Juridiction> {
    const result = await (this.prisma as any).juridictions.create({
      data: createJuridictionDto,
    });
    return mapJuridictionFromDb(result as JuridictionDb);
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
      (this.prisma as any).juridictions,
      paginationQuery,
      {
        where,
        searchFields: ['nom', 'code', 'description'],
        defaultSortBy: 'ordre',
      },
    );
  }

  async findOne(id: string): Promise<Juridiction> {
    const result = await (this.prisma as any).juridictions.findUniqueOrThrow({
      where: { id },
    });
    return mapJuridictionFromDb(result as JuridictionDb);
  }

  async update(id: string, updateJuridictionDto: UpdateJuridictionDto): Promise<Juridiction> {
    const result = await (this.prisma as any).juridictions.update({
      where: { id },
      data: updateJuridictionDto,
    });
    return mapJuridictionFromDb(result as JuridictionDb);
  }

  async remove(id: string): Promise<void> {
    await (this.prisma as any).juridictions.delete({
      where: { id },
    });
  }

  async findActive(): Promise<Juridiction[]> {
    const results = await (this.prisma as any).juridictions.findMany({
      where: { est_actif: true },
      orderBy: { ordre: 'asc' },
    });
    return results.map(result => mapJuridictionFromDb(result as JuridictionDb));
  }

  async search(search: string, limit: number = 10): Promise<Juridiction[]> {
    const results = await this.paginationService.searchOnly(
      (this.prisma as any).juridictions,
      search,
      ['nom', 'code', 'description'],
      limit,
    );
    return results.map(result => mapJuridictionFromDb(result as JuridictionDb));
  }
}