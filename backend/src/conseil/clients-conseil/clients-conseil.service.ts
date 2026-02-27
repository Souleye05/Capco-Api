import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma, StatutClientConseil, TypePartie } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

// Import direct des DTOs pour éviter les problèmes d'export
import { CreateClientConseilDto } from './dto/create-client-conseil.dto';
import { UpdateClientConseilDto } from './dto/update-client-conseil.dto';
import { ClientConseilResponseDto } from './dto/client-conseil-response.dto';
import { ClientsConseilQueryDto } from './dto/clients-conseil-query.dto';

// Optimisation 1: Typage strict - Définition des types Prisma précis
type ClientConseilWithCount = Prisma.ClientsConseilGetPayload<{
  include: { 
    _count: { 
      select: { 
        tachesConseils: true; 
        facturesConseils: true 
      } 
    } 
  }
}>;

type ClientConseilBasic = Prisma.ClientsConseilGetPayload<{}>;

@Injectable()
export class ClientsConseilService {
  private readonly logger = new Logger(ClientsConseilService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceGenerator: ReferenceGeneratorService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Créer un nouveau client conseil avec génération automatique de référence
   */
  async create(createClientConseilDto: CreateClientConseilDto, userId: string): Promise<ClientConseilResponseDto> {
    // Générer une référence unique
    const reference = await this.referenceGenerator.generateClientConseilReference();

    // Créer le client conseil
    const clientConseil = await this.prisma.clientsConseil.create({
      data: {
        ...createClientConseilDto,
        reference,
        createdBy: userId,
        // Convertir les nombres en Decimal pour Prisma
        honoraireMensuel: createClientConseilDto.honoraireMensuel || 0,
      },
      include: {
        _count: {
          select: {
            tachesConseils: true,
            facturesConseils: true,
          },
        },
      },
    });

    this.logger.log(`Client conseil créé avec succès: ${reference}`);
    return this.mapToResponseDto(clientConseil);
  }

  /**
   * Récupérer tous les clients conseil avec pagination et filtres
   */
  async findAll(query: ClientsConseilQueryDto): Promise<PaginatedResponse<ClientConseilResponseDto>> {
    // Optimisation 3: Suppression du try/catch redondant - pas de logique métier spécifique
    // Construire les conditions de filtrage
    const where: Prisma.ClientsConseilWhereInput = {};
    
    if (query.statut) {
      where.statut = query.statut;
    }
    
    if (query.type) {
      where.type = query.type;
    }

    const result = await this.paginationService.paginate(
      this.prisma.clientsConseil,
      query,
      {
        where,
        include: {
          _count: {
            select: {
              tachesConseils: true,
              facturesConseils: true,
            },
          },
        },
        searchFields: ['reference', 'nom', 'email', 'telephone'],
        defaultSortBy: 'createdAt',
      }
    );

    return {
      data: result.data.map(client => this.mapToResponseDto(client as ClientConseilWithCount)),
      pagination: result.pagination,
    };
  }

  /**
   * Récupérer un client conseil par ID
   */
  async findOne(id: string): Promise<ClientConseilResponseDto> {
    const clientConseil = await this.prisma.clientsConseil.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tachesConseils: true,
            facturesConseils: true,
          },
        },
      },
    });

    if (!clientConseil) {
      throw new NotFoundException(`Client conseil avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(clientConseil);
  }

  /**
   * Mettre à jour un client conseil
   */
  async update(id: string, updateClientConseilDto: UpdateClientConseilDto): Promise<ClientConseilResponseDto> {
    // Optimisation 2: Élimination des doubles requêtes - gestion directe de l'erreur P2025
    try {
      const updatedClient = await this.prisma.clientsConseil.update({
        where: { id },
        data: {
          ...updateClientConseilDto,
          // Optimisation 4: Suppression du spread conditionnel redondant
          // honoraireMensuel est déjà inclus dans le spread principal
        },
        include: {
          _count: {
            select: {
              tachesConseils: true,
              facturesConseils: true,
            },
          },
        },
      });

      this.logger.log(`Client conseil ${id} mis à jour avec succès`);
      return this.mapToResponseDto(updatedClient);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Client conseil ${id} non trouvé`);
      }
      throw error;
    }
  }

  /**
   * Supprimer un client conseil
   */
  async remove(id: string): Promise<void> {
    // Optimisation 2: Élimination des doubles requêtes - gestion directe de l'erreur P2025
    try {
      await this.prisma.clientsConseil.delete({
        where: { id },
      });

      this.logger.log(`Client conseil ${id} supprimé avec succès`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Client conseil ${id} non trouvé`);
      }
      throw error;
    }
  }

  /**
   * Changer le statut d'un client conseil
   */
  async updateStatus(id: string, statut: StatutClientConseil): Promise<ClientConseilResponseDto> {
    // Optimisation 5: Requête directe pour éviter la double vérification d'existence
    try {
      const updatedClient = await this.prisma.clientsConseil.update({
        where: { id },
        data: { statut },
        include: {
          _count: {
            select: {
              tachesConseils: true,
              facturesConseils: true,
            },
          },
        },
      });
      
      this.logger.log(`Statut du client conseil ${id} changé vers ${statut}`);
      return this.mapToResponseDto(updatedClient);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Client conseil ${id} non trouvé`);
      }
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des clients conseil
   */
  async getStatistics(): Promise<{
    total: number;
    actifs: number;
    suspendus: number;
    resilies: number;
    honoraireMoyenMensuel: number;
  }> {
    const [total, actifs, suspendus, resilies, honoraireStats] = await Promise.all([
      this.prisma.clientsConseil.count(),
      this.prisma.clientsConseil.count({ where: { statut: 'ACTIF' } }),
      this.prisma.clientsConseil.count({ where: { statut: 'SUSPENDU' } }),
      this.prisma.clientsConseil.count({ where: { statut: 'RESILIE' } }),
      this.prisma.clientsConseil.aggregate({
        _avg: { honoraireMensuel: true },
        where: { statut: 'ACTIF' },
      }),
    ]);

    return {
      total,
      actifs,
      suspendus,
      resilies,
      honoraireMoyenMensuel: Number(honoraireStats._avg.honoraireMensuel) || 0,
    };
  }

  /**
   * Mapper les données Prisma vers le DTO de réponse
   */
  private mapToResponseDto(clientConseil: ClientConseilWithCount): ClientConseilResponseDto {
    return {
      id: clientConseil.id,
      reference: clientConseil.reference,
      nom: clientConseil.nom,
      type: clientConseil.type as TypePartie,
      telephone: clientConseil.telephone,
      email: clientConseil.email,
      adresse: clientConseil.adresse,
      honoraireMensuel: Number(clientConseil.honoraireMensuel),
      jourFacturation: clientConseil.jourFacturation,
      statut: clientConseil.statut as StatutClientConseil,
      notes: clientConseil.notes,
      createdAt: clientConseil.createdAt,
      updatedAt: clientConseil.updatedAt,
      createdBy: clientConseil.createdBy,
      _count: clientConseil._count,
    };
  }
}