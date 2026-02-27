import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { ImportConfig } from '../config/import.config';
import { EntityCacheService } from './entity-cache.service';
import { ErrorClassifierService } from './error-classifier.service';
import { ImportErrorDto, EntityType } from '../dto';
import { $Enums } from '@prisma/client';

export interface BatchResult {
  successfulRows: number;
  errors: ImportErrorDto[];
  processedRows: number;
}

export interface ProcessorContext {
  userId?: string;
  importId: string;
  entityType: EntityType;
}

@Injectable()
export class BatchProcessorService {
  private readonly logger = new Logger(BatchProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ImportConfig,
    private readonly cache: EntityCacheService,
    private readonly errorClassifier: ErrorClassifierService
  ) {}

  async processBatch<T>(
    batch: any[],
    processor: (row: any, context: ProcessorContext) => Promise<T>,
    context: ProcessorContext
  ): Promise<BatchResult> {
    const result: BatchResult = {
      successfulRows: 0,
      errors: [],
      processedRows: 0
    };

    // Traitement en parallèle si activé et batch suffisamment grand
    if (this.config.enableParallelProcessing && batch.length > 10) {
      return this.processParallel(batch, processor, context);
    }

    // Traitement séquentiel
    return this.processSequential(batch, processor, context);
  }

  private async processSequential<T>(
    batch: any[],
    processor: (row: any, context: ProcessorContext) => Promise<T>,
    context: ProcessorContext
  ): Promise<BatchResult> {
    const result: BatchResult = {
      successfulRows: 0,
      errors: [],
      processedRows: 0
    };

    for (const row of batch) {
      try {
        await processor(row, context);
        result.successfulRows++;
      } catch (error) {
        const classifiedError = this.errorClassifier.classifyError(
          error,
          row._rowNumber,
          'general',
          null
        );
        result.errors.push(classifiedError);
      }
      result.processedRows++;
    }

    return result;
  }

  private async processParallel<T>(
    batch: any[],
    processor: (row: any, context: ProcessorContext) => Promise<T>,
    context: ProcessorContext
  ): Promise<BatchResult> {
    const result: BatchResult = {
      successfulRows: 0,
      errors: [],
      processedRows: batch.length
    };

    const promises = batch.map(async (row) => {
      try {
        await processor(row, context);
        return { success: true, row };
      } catch (error) {
        const classifiedError = this.errorClassifier.classifyError(
          error,
          row._rowNumber,
          'general',
          null
        );
        return { success: false, error: classifiedError };
      }
    });

    const results = await Promise.allSettled(promises);
    
    results.forEach((promiseResult) => {
      if (promiseResult.status === 'fulfilled') {
        const { success, error } = promiseResult.value;
        if (success) {
          result.successfulRows++;
        } else if (error) {
          result.errors.push(error);
        }
      } else {
        // Promise rejetée
        result.errors.push({
          row: 0,
          field: 'general',
          value: null,
          error: `Erreur de traitement parallèle: ${promiseResult.reason}`,
          severity: 'ERROR'
        });
      }
    });

    return result;
  }

  async processProprietairesBatch(
    batch: any[],
    context: ProcessorContext
  ): Promise<BatchResult> {
    return this.processBatch(batch, async (row, ctx) => {
      return this.processProprietaireRow(row, ctx);
    }, context);
  }

  async processImmeublesBatch(
    batch: any[],
    context: ProcessorContext
  ): Promise<BatchResult> {
    return this.processBatch(batch, async (row, ctx) => {
      return this.processImmeubleRow(row, ctx);
    }, context);
  }

  async processLocatairesBatch(
    batch: any[],
    context: ProcessorContext
  ): Promise<BatchResult> {
    return this.processBatch(batch, async (row, ctx) => {
      return this.processLocataireRow(row, ctx);
    }, context);
  }

  async processLotsBatch(
    batch: any[],
    context: ProcessorContext
  ): Promise<BatchResult> {
    return this.processBatch(batch, async (row, ctx) => {
      return this.processLotRow(row, ctx);
    }, context);
  }

  private async processProprietaireRow(row: any, context: ProcessorContext): Promise<any> {
    const nom = row.nom?.toString().trim();
    if (!nom || nom.includes('(exemple)')) {
      throw new Error('Nom de propriétaire invalide ou exemple');
    }

    // Vérifier le cache d'abord
    let existing = await this.cache.getProprietaire(nom);
    if (existing) {
      throw new Error(`Propriétaire déjà existant: ${nom}`);
    }

    // Créer le propriétaire
    const proprietaire = await this.prisma.proprietaires.create({
      data: {
        nom,
        telephone: row.telephone?.toString() || null,
        email: row.email || null,
        adresse: row.adresse || null,
        createdBy: context.userId || 'import-system'
      }
    });

    // Mettre en cache
    this.cache.cacheProprietaire(nom, proprietaire);
    return proprietaire;
  }

  private async processImmeubleRow(row: any, context: ProcessorContext): Promise<any> {
    const nom = row.nom?.toString().trim();
    if (!nom || nom.includes('(exemple)')) {
      throw new Error('Nom d\'immeuble invalide ou exemple');
    }

    // Vérifier le cache
    let existing = await this.cache.getImmeuble(nom);
    if (existing) {
      return existing; // Retourner l'existant sans erreur
    }

    // Récupérer le propriétaire
    const proprietaireNom = row.proprietaire_nom?.toString().trim();
    let proprietaire = null;
    if (proprietaireNom) {
      proprietaire = await this.cache.getProprietaire(proprietaireNom);
      if (!proprietaire) {
        throw new Error(`Propriétaire introuvable: ${proprietaireNom}`);
      }
    }

    // Créer l'immeuble
    const immeuble = await this.prisma.immeubles.create({
      data: {
        nom,
        adresse: row.adresse || nom,
        proprietaireId: proprietaire?.id || null,
        tauxCommissionCapco: this.parseCommission(row.taux_commission),
        notes: row.notes || null,
        reference: await this.generateReference(),
        createdBy: context.userId || 'import-system'
      }
    });

    this.cache.cacheImmeuble(nom, immeuble);
    return immeuble;
  }

  private async processLocataireRow(row: any, context: ProcessorContext): Promise<any> {
    const nom = row.nom?.toString().trim();
    if (!nom || nom.includes('(exemple)')) {
      throw new Error('Nom de locataire invalide ou exemple');
    }

    let existing = await this.cache.getLocataire(nom);
    if (existing) {
      return existing;
    }

    const locataire = await this.prisma.locataires.create({
      data: {
        nom,
        telephone: row.telephone?.toString() || null,
        email: row.email || null,
        createdBy: context.userId || 'import-system'
      }
    });

    this.cache.cacheLocataire(nom, locataire);
    return locataire;
  }

  private async processLotRow(row: any, context: ProcessorContext): Promise<any> {
    const numero = row.numero?.toString().trim();
    if (!numero || numero.includes('(exemple)')) {
      throw new Error('Numéro de lot invalide ou exemple');
    }

    const immeubleNom = row.immeuble_nom?.toString().trim();
    const immeuble = await this.cache.getImmeuble(immeubleNom);
    if (!immeuble) {
      throw new Error(`Immeuble introuvable: ${immeubleNom}`);
    }

    // Vérifier si le lot existe déjà
    const existingLot = await this.prisma.lots.findFirst({
      where: { numero, immeubleId: immeuble.id }
    });

    if (existingLot) {
      throw new Error(`Lot déjà existant: ${numero} dans ${immeubleNom}`);
    }

    // Récupérer le locataire si spécifié
    let locataireId = null;
    const locataireNom = row.locataire_nom?.toString().trim();
    if (locataireNom) {
      const locataire = await this.cache.getLocataire(locataireNom);
      locataireId = locataire?.id || null;
    }

    return this.prisma.lots.create({
      data: {
        numero,
        immeubleId: immeuble.id,
        type: this.parseType(row.type),
        etage: row.etage?.toString() || null,
        loyerMensuelAttendu: this.parseNumber(row.loyer_mensuel),
        locataireId,
        statut: this.parseStatut(row.statut),
        createdBy: context.userId || 'import-system'
      }
    });
  }

  private parseNumber(value: any): number {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    const num = parseFloat(value.toString().replace(/[^0-9.,]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  }

  private parseCommission(value: any): number {
    if (value === undefined || value === null || value === '') return 5;
    if (typeof value === 'number') return value;
    const num = parseFloat(value.toString().replace('%', '').trim());
    return isNaN(num) ? 5 : num;
  }

  private parseType(value: any): $Enums.TypeLot {
    const validTypes = ['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE'];
    const type = value?.toString().toUpperCase();
    return validTypes.includes(type) ? type as $Enums.TypeLot : 'AUTRE' as $Enums.TypeLot;
  }

  private parseStatut(value: any): $Enums.StatutLot {
    const statut = value?.toString().toUpperCase();
    return statut === 'OCCUPE' ? 'OCCUPE' as $Enums.StatutLot : 'LIBRE' as $Enums.StatutLot;
  }

  private async generateReference(): Promise<string> {
    // Implémentation simplifiée - à adapter selon vos besoins
    return `IMM_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
}