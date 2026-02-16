import { 
  Controller, 
  Body, 
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { BaseController } from '../common/controllers/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../common/services/prisma.service';

/**
 * Contrôleur pour la gestion des affaires
 * Compatible avec les données migrées depuis Supabase
 */

export interface CreateAffaireDto {
  reference: string;
  intitule: string;
  demandeurs?: any[];
  defendeurs?: any[];
  juridiction: string;
  chambre: string;
  notes?: string;
}

export interface UpdateAffaireDto {
  reference?: string;
  intitule?: string;
  demandeurs?: any[];
  defendeurs?: any[];
  juridiction?: string;
  chambre?: string;
  statut?: 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
  notes?: string;
}

@Controller('affaires')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AffairesController extends BaseController {
  protected modelName = 'affaires';
  protected searchFields = ['reference', 'intitule', 'juridiction', 'chambre'];

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Conditions de sécurité équivalentes aux RLS Supabase
   * Tous les utilisateurs authentifiés peuvent voir toutes les affaires
   */
  protected buildSecurityConditions(user: any): any {
    // Pour les affaires, tous les utilisateurs authentifiés ont accès
    // (équivalent à la politique RLS Supabase)
    return {};
  }

  /**
   * Validation des données de création
   */
  protected validateCreateData(data: CreateAffaireDto, user: any): any {
    if (!data.reference || !data.intitule || !data.juridiction || !data.chambre) {
      throw new HttpException(
        'Les champs reference, intitule, juridiction et chambre sont obligatoires',
        HttpStatus.BAD_REQUEST
      );
    }

    return {
      reference: data.reference.trim(),
      intitule: data.intitule.trim(),
      demandeurs: data.demandeurs || [],
      defendeurs: data.defendeurs || [],
      juridiction: data.juridiction.trim(),
      chambre: data.chambre.trim(),
      statut: 'ACTIVE',
      notes: data.notes?.trim() || null
    };
  }

  /**
   * Validation des données de mise à jour
   */
  protected validateUpdateData(data: UpdateAffaireDto, user: any, existing: any): any {
    const updateData: any = {};

    if (data.reference !== undefined) {
      if (!data.reference.trim()) {
        throw new HttpException('La référence ne peut pas être vide', HttpStatus.BAD_REQUEST);
      }
      updateData.reference = data.reference.trim();
    }

    if (data.intitule !== undefined) {
      if (!data.intitule.trim()) {
        throw new HttpException('L\'intitulé ne peut pas être vide', HttpStatus.BAD_REQUEST);
      }
      updateData.intitule = data.intitule.trim();
    }

    if (data.demandeurs !== undefined) {
      updateData.demandeurs = data.demandeurs;
    }

    if (data.defendeurs !== undefined) {
      updateData.defendeurs = data.defendeurs;
    }

    if (data.juridiction !== undefined) {
      if (!data.juridiction.trim()) {
        throw new HttpException('La juridiction ne peut pas être vide', HttpStatus.BAD_REQUEST);
      }
      updateData.juridiction = data.juridiction.trim();
    }

    if (data.chambre !== undefined) {
      if (!data.chambre.trim()) {
        throw new HttpException('La chambre ne peut pas être vide', HttpStatus.BAD_REQUEST);
      }
      updateData.chambre = data.chambre.trim();
    }

    if (data.statut !== undefined) {
      if (!['ACTIVE', 'CLOTUREE', 'RADIEE'].includes(data.statut)) {
        throw new HttpException('Statut invalide', HttpStatus.BAD_REQUEST);
      }
      updateData.statut = data.statut;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes?.trim() || null;
    }

    return updateData;
  }

  /**
   * Validation des permissions de suppression
   */
  protected validateDeletePermissions(user: any, item: any): void {
    // Seuls les admins peuvent supprimer des affaires
    if (!user.roles.includes('admin')) {
      throw new HttpException(
        'Seuls les administrateurs peuvent supprimer des affaires',
        HttpStatus.FORBIDDEN
      );
    }

    // Ne pas permettre la suppression d'affaires avec des audiences
    // Cette vérification sera faite au niveau de la base de données via les contraintes
  }

  /**
   * Relations à inclure dans les réponses
   */
  protected getIncludeRelations(): any {
    return {
      audienceses: {
        orderBy: { date: 'desc' },
        take: 5 // Limiter aux 5 dernières audiences
      },
      honorairesContentieuxes: true,
      depensesAffaireses: {
        orderBy: { date: 'desc' },
        take: 10 // Limiter aux 10 dernières dépenses
      }
    };
  }

  /**
   * Transformation de la réponse pour maintenir la compatibilité Supabase
   */
  protected transformResponse(item: any): any {
    return {
      id: item.id,
      reference: item.reference,
      intitule: item.intitule,
      demandeurs: item.demandeurs,
      defendeurs: item.defendeurs,
      juridiction: item.juridiction,
      chambre: item.chambre,
      statut: item.statut,
      notes: item.notes,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      created_by: item.createdBy,
      // Relations
      audiences: item.audienceses?.map(audience => ({
        id: audience.id,
        date: audience.date,
        heure: audience.heure,
        objet: audience.objet,
        statut: audience.statut,
        notes_preparation: audience.notesPreparation,
        created_at: audience.createdAt
      })) || [],
      honoraires_contentieux: item.honorairesContentieuxes?.map(honoraire => ({
        id: honoraire.id,
        montant_facture: honoraire.montantFacture,
        montant_encaisse: honoraire.montantEncaisse,
        date_facturation: honoraire.dateFacturation,
        notes: honoraire.notes,
        created_at: honoraire.createdAt
      })) || [],
      depenses_affaires: item.depensesAffaireses?.map(depense => ({
        id: depense.id,
        date: depense.date,
        type_depense: depense.typeDepense,
        nature: depense.nature,
        montant: depense.montant,
        description: depense.description,
        justificatif: depense.justificatif,
        created_at: depense.createdAt
      })) || []
    };
  }
}