import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { 
  CreateTacheConseilDto, 
  UpdateTacheConseilDto, 
  TacheConseilResponseDto,
  TachesConseilQueryDto 
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class TachesConseilService {
  private readonly logger = new Logger(TachesConseilService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Créer une nouvelle tâche conseil
   */
  async create(createTacheConseilDto: CreateTacheConseilDto, userId: string): Promise<TacheConseilResponseDto> {
    try {
      // Vérifier que le client conseil existe
      const clientExists = await this.prisma.clientsConseil.findUnique({
        where: { id: createTacheConseilDto.clientId },
        select: { id: true, statut: true },
      });

      if (!clientExists) {
        throw new NotFoundException(`Client conseil avec l'ID ${createTacheConseilDto.clientId} non trouvé`);
      }

      if (clientExists.statut === 'RESILIE') {
        throw new BadRequestException('Impossible de créer une tâche pour un client résilié');
      }

      // Valider le format du mois concerné
      if (!this.isValidMonthFormat(createTacheConseilDto.moisConcerne)) {
        throw new BadRequestException('Le mois concerné doit être au format YYYY-MM');
      }

      const tacheConseil = await this.prisma.tachesConseil.create({
        data: {
          ...createTacheConseilDto,
          date: new Date(createTacheConseilDto.date),
          createdBy: userId,
        },
        include: {
          clientsConseil: {
            select: {
              id: true,
              reference: true,
              nom: true,
            },
          },
        },
      });

      this.logger.log(`Tâche conseil créée avec succès pour le client ${createTacheConseilDto.clientId}`);
      return this.mapToResponseDto(tacheConseil);
    } catch (error) {
      this.logger.error('Erreur lors de la création de la tâche conseil:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les tâches conseil avec pagination et filtres
   */
  async findAll(query: TachesConseilQueryDto): Promise<PaginatedResponse<TacheConseilResponseDto>> {
    try {
      // Construire les conditions de filtrage
      const where: any = {};
      
      if (query.clientId) {
        where.clientId = query.clientId;
      }
      
      if (query.type) {
        where.type = query.type;
      }

      if (query.moisConcerne) {
        where.moisConcerne = query.moisConcerne;
      }

      const result = await this.paginationService.paginate(
        this.prisma.tachesConseil,
        query,
        {
          where,
          include: {
            clientsConseil: {
              select: {
                id: true,
                reference: true,
                nom: true,
              },
            },
          },
          searchFields: ['description', 'clientsConseil.nom', 'clientsConseil.reference'],
          defaultSortBy: 'date',
        }
      );

      return {
        data: result.data.map(tache => this.mapToResponseDto(tache)),
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des tâches conseil:', error);
      throw error;
    }
  }

  /**
   * Récupérer une tâche conseil par ID
   */
  async findOne(id: string): Promise<TacheConseilResponseDto> {
    try {
      const tacheConseil = await this.prisma.tachesConseil.findUnique({
        where: { id },
        include: {
          clientsConseil: {
            select: {
              id: true,
              reference: true,
              nom: true,
            },
          },
        },
      });

      if (!tacheConseil) {
        throw new NotFoundException(`Tâche conseil avec l'ID ${id} non trouvée`);
      }

      return this.mapToResponseDto(tacheConseil);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération de la tâche conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour une tâche conseil
   */
  async update(id: string, updateTacheConseilDto: UpdateTacheConseilDto): Promise<TacheConseilResponseDto> {
    try {
      // Vérifier que la tâche existe
      await this.findOne(id);

      // Valider le client si fourni
      if (updateTacheConseilDto.clientId) {
        const clientExists = await this.prisma.clientsConseil.findUnique({
          where: { id: updateTacheConseilDto.clientId },
          select: { id: true, statut: true },
        });

        if (!clientExists) {
          throw new NotFoundException(`Client conseil avec l'ID ${updateTacheConseilDto.clientId} non trouvé`);
        }

        if (clientExists.statut === 'RESILIE') {
          throw new BadRequestException('Impossible d\'associer une tâche à un client résilié');
        }
      }

      // Valider le format du mois concerné si fourni
      if (updateTacheConseilDto.moisConcerne && !this.isValidMonthFormat(updateTacheConseilDto.moisConcerne)) {
        throw new BadRequestException('Le mois concerné doit être au format YYYY-MM');
      }

      const updatedTache = await this.prisma.tachesConseil.update({
        where: { id },
        data: {
          ...updateTacheConseilDto,
          ...(updateTacheConseilDto.date && { date: new Date(updateTacheConseilDto.date) }),
        },
        include: {
          clientsConseil: {
            select: {
              id: true,
              reference: true,
              nom: true,
            },
          },
        },
      });

      this.logger.log(`Tâche conseil ${id} mise à jour avec succès`);
      return this.mapToResponseDto(updatedTache);
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour de la tâche conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer une tâche conseil
   */
  async remove(id: string): Promise<void> {
    try {
      // Vérifier que la tâche existe
      await this.findOne(id);

      await this.prisma.tachesConseil.delete({
        where: { id },
      });

      this.logger.log(`Tâche conseil ${id} supprimée avec succès`);
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression de la tâche conseil ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer les tâches par client et mois
   */
  async findByClientAndMonth(clientId: string, moisConcerne: string): Promise<TacheConseilResponseDto[]> {
    try {
      if (!this.isValidMonthFormat(moisConcerne)) {
        throw new BadRequestException('Le mois concerné doit être au format YYYY-MM');
      }

      const taches = await this.prisma.tachesConseil.findMany({
        where: {
          clientId,
          moisConcerne,
        },
        include: {
          clientsConseil: {
            select: {
              id: true,
              reference: true,
              nom: true,
            },
          },
        },
        orderBy: { date: 'asc' },
      });

      return taches.map(tache => this.mapToResponseDto(tache));
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des tâches pour le client ${clientId} et le mois ${moisConcerne}:`, error);
      throw error;
    }
  }

  /**
   * Calculer le temps total par client et mois
   */
  async getTotalTimeByClientAndMonth(clientId: string, moisConcerne: string): Promise<{
    totalMinutes: number;
    totalHours: number;
    nombreTaches: number;
  }> {
    try {
      const result = await this.prisma.tachesConseil.aggregate({
        where: {
          clientId,
          moisConcerne,
          dureeMinutes: { not: null },
        },
        _sum: { dureeMinutes: true },
        _count: { id: true },
      });

      const totalMinutes = result._sum.dureeMinutes || 0;
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100; // Arrondi à 2 décimales

      return {
        totalMinutes,
        totalHours,
        nombreTaches: result._count.id,
      };
    } catch (error) {
      this.logger.error(`Erreur lors du calcul du temps total pour le client ${clientId} et le mois ${moisConcerne}:`, error);
      throw error;
    }
  }

  /**
   * Valider le format du mois (YYYY-MM)
   */
  private isValidMonthFormat(mois: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(mois)) return false;

    const [year, month] = mois.split('-').map(Number);
    return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
  }

  /**
   * Mapper les données Prisma vers le DTO de réponse
   */
  private mapToResponseDto(tacheConseil: any): TacheConseilResponseDto {
    return {
      id: tacheConseil.id,
      clientId: tacheConseil.clientId,
      date: tacheConseil.date,
      type: tacheConseil.type,
      description: tacheConseil.description,
      dureeMinutes: tacheConseil.dureeMinutes,
      moisConcerne: tacheConseil.moisConcerne,
      createdAt: tacheConseil.createdAt,
      createdBy: tacheConseil.createdBy,
      clientsConseil: tacheConseil.clientsConseil,
    };
  }
}