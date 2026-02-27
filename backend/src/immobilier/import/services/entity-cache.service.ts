import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { ImportConfig } from '../config/import.config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

@Injectable()
export class EntityCacheService {
  private readonly logger = new Logger(EntityCacheService.name);
  private readonly proprietairesCache = new Map<string, CacheEntry<any>>();
  private readonly locatairesCache = new Map<string, CacheEntry<any>>();
  private readonly immeublesCache = new Map<string, CacheEntry<any>>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ImportConfig
  ) {}

  async getProprietaire(nom: string): Promise<any | null> {
    const cached = this.getCachedEntry(this.proprietairesCache, nom);
    if (cached) {
      return cached.data;
    }

    const proprietaire = await this.prisma.proprietaires.findFirst({
      where: { nom }
    });

    if (proprietaire) {
      this.setCachedEntry(this.proprietairesCache, nom, proprietaire);
    }

    return proprietaire;
  }

  async getLocataire(nom: string): Promise<any | null> {
    const cached = this.getCachedEntry(this.locatairesCache, nom);
    if (cached) {
      return cached.data;
    }

    const locataire = await this.prisma.locataires.findFirst({
      where: { nom }
    });

    if (locataire) {
      this.setCachedEntry(this.locatairesCache, nom, locataire);
    }

    return locataire;
  }

  async getImmeuble(nom: string): Promise<any | null> {
    const cached = this.getCachedEntry(this.immeublesCache, nom);
    if (cached) {
      return cached.data;
    }

    const immeuble = await this.prisma.immeubles.findFirst({
      where: { nom }
    });

    if (immeuble) {
      this.setCachedEntry(this.immeublesCache, nom, immeuble);
    }

    return immeuble;
  }

  cacheProprietaire(nom: string, proprietaire: any): void {
    this.setCachedEntry(this.proprietairesCache, nom, proprietaire);
  }

  cacheLocataire(nom: string, locataire: any): void {
    this.setCachedEntry(this.locatairesCache, nom, locataire);
  }

  cacheImmeuble(nom: string, immeuble: any): void {
    this.setCachedEntry(this.immeublesCache, nom, immeuble);
  }

  private getCachedEntry<T>(cache: Map<string, CacheEntry<T>>, key: string): CacheEntry<T> | null {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée n'a pas expiré
    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      cache.delete(key);
      return null;
    }

    // Incrémenter le compteur de hits
    entry.hits++;
    return entry;
  }

  private setCachedEntry<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
    // Vérifier la taille du cache
    if (cache.size >= this.config.cacheSize) {
      this.evictLeastUsed(cache);
    }

    cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  private evictLeastUsed<T>(cache: Map<string, CacheEntry<T>>): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;

    for (const [key, entry] of cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      cache.delete(leastUsedKey);
    }
  }

  clearCache(): void {
    this.proprietairesCache.clear();
    this.locatairesCache.clear();
    this.immeublesCache.clear();
    this.logger.log('Cache cleared');
  }

  getCacheStats() {
    return {
      proprietaires: {
        size: this.proprietairesCache.size,
        totalHits: Array.from(this.proprietairesCache.values()).reduce((sum, entry) => sum + entry.hits, 0)
      },
      locataires: {
        size: this.locatairesCache.size,
        totalHits: Array.from(this.locatairesCache.values()).reduce((sum, entry) => sum + entry.hits, 0)
      },
      immeubles: {
        size: this.immeublesCache.size,
        totalHits: Array.from(this.immeublesCache.values()).reduce((sum, entry) => sum + entry.hits, 0)
      }
    };
  }
}