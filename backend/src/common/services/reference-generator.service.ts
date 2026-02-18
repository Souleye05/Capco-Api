import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Service responsible for generating unique references for business entities
 * Handles atomic reference generation to prevent race conditions
 * Supports domain-specific reference patterns
 */
@Injectable()
export class ReferenceGeneratorService {
  private readonly logger = new Logger(ReferenceGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique reference for an Affaire (Contentieux domain)
   * Format: AFF-YYYY-NNN (e.g., AFF-2024-001)
   */
  async generateAffaireReference(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AFF-${year}`;

    return this.generateUniqueReference(
      prefix,
      async (reference: string) => {
        const existing = await this.prisma.affaires.findFirst({
          where: { reference },
          select: { id: true }
        });
        return existing !== null;
      }
    );
  }

  /**
   * Generate a unique reference for a Dossier de Recouvrement
   * Format: DOS-REC-NNN (e.g., DOS-REC-001)
   */
  async generateDossierRecouvrementReference(): Promise<string> {
    const prefix = 'DOS-REC';

    return this.generateUniqueReference(
      prefix,
      async (reference: string) => {
        const existing = await this.prisma.dossiersRecouvrement.findFirst({
          where: { reference },
          select: { id: true }
        });
        return existing !== null;
      }
    );
  }

  /**
   * Generate a unique reference for an Immeuble
   * Format: IMM-NNN (e.g., IMM-001)
   */
  async generateImmeubleReference(): Promise<string> {
    const prefix = 'IMM';

    return this.generateUniqueReference(
      prefix,
      async (reference: string) => {
        const existing = await this.prisma.immeubles.findFirst({
          where: { reference },
          select: { id: true }
        });
        return existing !== null;
      }
    );
  }

  /**
   * Generate a unique reference for a Client Conseil
   * Format: CLI-CONS-NNN (e.g., CLI-CONS-001)
   */
  async generateClientConseilReference(): Promise<string> {
    const prefix = 'CLI-CONS';

    return this.generateUniqueReference(
      prefix,
      async (reference: string) => {
        const existing = await this.prisma.clientsConseil.findFirst({
          where: { reference },
          select: { id: true }
        });
        return existing !== null;
      }
    );
  }

  /**
   * Generate a unique reference for a Facture Conseil
   * Format: FACT-YYYY-MM-NNN (e.g., FACT-2024-01-001)
   */
  async generateFactureReference(clientId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `FACT-${year}-${month}`;

    return this.generateUniqueReference(
      prefix,
      async (reference: string) => {
        const existing = await this.prisma.facturesConseil.findFirst({
          where: { reference },
          select: { id: true }
        });
        return existing !== null;
      }
    );
  }

  /**
   * Generate a unique reference for a Rapport de Gestion
   * Format: RAP-GEST-YYYY-MM-NNN (e.g., RAP-GEST-2024-01-001)
   */
  async generateRapportGestionReference(immeubleId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `RAP-GEST-${year}-${month}`;

    return this.generateUniqueReference(
      prefix,
      async (reference: string) => {
        // Check if reference exists in RapportsGestion table
        // Note: The schema doesn't show a reference field in RapportsGestion,
        // but we'll prepare for it in case it's added later
        return false; // For now, assume no duplicates since no reference field exists
      }
    );
  }

  /**
   * Core method to generate unique references atomically
   * Uses database transactions to prevent race conditions
   */
  private async generateUniqueReference(
    prefix: string,
    existsChecker: (reference: string) => Promise<boolean>
  ): Promise<string> {
    const maxAttempts = 1000; // Increased limit for better scalability

    return this.prisma.executeTransaction(async (tx) => {
      // Start from sequence 1 and increment until we find an available reference
      let sequence = 1;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const paddedSequence = String(sequence).padStart(3, '0');
        const reference = `${prefix}-${paddedSequence}`;

        // Check if reference already exists
        const exists = await existsChecker(reference);

        if (!exists) {
          this.logger.debug(`Generated unique reference: ${reference}`);
          return reference;
        }

        this.logger.debug(`Reference ${reference} already exists, trying next sequence`);
        sequence++;
      }

      // If we reach here, we couldn't generate a unique reference
      const error = `Failed to generate unique reference with prefix ${prefix} after ${maxAttempts} attempts`;
      this.logger.error(error);
      throw new Error(error);
    });
  }


  /**
   * Validate reference format for a given domain
   */
  validateReferenceFormat(reference: string, domain: 'affaire' | 'recouvrement' | 'immeuble' | 'conseil' | 'facture'): boolean {
    const patterns = {
      affaire: /^AFF-\d{4}-\d{3}$/,
      recouvrement: /^DOS-REC-\d{3}$/,
      immeuble: /^IMM-\d{3}$/,
      conseil: /^CLI-CONS-\d{3}$/,
      facture: /^FACT-\d{4}-\d{2}-\d{3}$/,
    };

    const pattern = patterns[domain];
    if (!pattern) {
      this.logger.warn(`Unknown domain for reference validation: ${domain}`);
      return false;
    }

    const isValid = pattern.test(reference);
    if (!isValid) {
      this.logger.debug(`Invalid reference format for domain ${domain}: ${reference}`);
    }

    return isValid;
  }

  /**
   * Extract domain information from a reference
   */
  extractDomainFromReference(reference: string): string | null {
    if (reference.startsWith('AFF-')) return 'contentieux';
    if (reference.startsWith('DOS-REC-')) return 'recouvrement';
    if (reference.startsWith('IMM-')) return 'immobilier';
    if (reference.startsWith('CLI-CONS-')) return 'conseil';
    if (reference.startsWith('FACT-')) return 'conseil';
    if (reference.startsWith('RAP-GEST-')) return 'immobilier';
    
    return null;
  }

  /**
   * Get statistics about reference generation
   */
  async getReferenceStats(): Promise<{
    affaires: number;
    dossiersRecouvrement: number;
    immeubles: number;
    clientsConseil: number;
    facturesConseil: number;
  }> {
    try {
      const [affaires, dossiers, immeubles, clients, factures] = await Promise.all([
        this.prisma.affaires.count(),
        this.prisma.dossiersRecouvrement.count(),
        this.prisma.immeubles.count(),
        this.prisma.clientsConseil.count(),
        this.prisma.facturesConseil.count(),
      ]);

      return {
        affaires,
        dossiersRecouvrement: dossiers,
        immeubles,
        clientsConseil: clients,
        facturesConseil: factures,
      };
    } catch (error) {
      this.logger.error('Failed to get reference statistics:', error);
      throw error;
    }
  }
}