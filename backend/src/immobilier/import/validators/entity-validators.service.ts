import { Injectable } from '@nestjs/common';
import { ImportErrorDto, EntityType } from '../dto';

@Injectable()
export class EntityValidatorsService {

  async validateRow(row: any, entityType: EntityType, rowNumber: number): Promise<ImportErrorDto[]> {
    switch (entityType) {
      case EntityType.PROPRIETAIRES:
        return this.validateProprietaireRow(row, rowNumber);
      case EntityType.IMMEUBLES:
        return this.validateImmeubleRow(row, rowNumber);
      case EntityType.LOCATAIRES:
        return this.validateLocataireRow(row, rowNumber);
      case EntityType.LOTS:
        return this.validateLotRow(row, rowNumber);
      default:
        return [{
          row: rowNumber,
          field: 'entityType',
          value: entityType,
          error: 'Type d\'entité non supporté',
          severity: 'ERROR'
        }];
    }
  }

  private validateProprietaireRow(row: any, rowNumber: number): ImportErrorDto[] {
    const errors: ImportErrorDto[] = [];

    // Nom obligatoire
    if (!row.nom || typeof row.nom !== 'string' || row.nom.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'nom',
        value: row.nom,
        error: 'Le nom est obligatoire',
        severity: 'ERROR'
      });
    } else if (row.nom.trim().length < 2) {
      errors.push({
        row: rowNumber,
        field: 'nom',
        value: row.nom,
        error: 'Le nom doit contenir au moins 2 caractères',
        severity: 'ERROR'
      });
    }

    // Validation email si fourni
    if (row.email && typeof row.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email.trim())) {
        errors.push({
          row: rowNumber,
          field: 'email',
          value: row.email,
          error: 'Format d\'email invalide',
          severity: 'WARNING'
        });
      }
    }

    // Validation téléphone si fourni
    if (row.telephone && typeof row.telephone === 'string') {
      const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
      if (!phoneRegex.test(row.telephone.trim())) {
        errors.push({
          row: rowNumber,
          field: 'telephone',
          value: row.telephone,
          error: 'Format de téléphone invalide',
          severity: 'WARNING'
        });
      }
    }

    return errors;
  }

  private validateImmeubleRow(row: any, rowNumber: number): ImportErrorDto[] {
    const errors: ImportErrorDto[] = [];

    // Nom obligatoire
    if (!row.nom || typeof row.nom !== 'string' || row.nom.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'nom',
        value: row.nom,
        error: 'Le nom de l\'immeuble est obligatoire',
        severity: 'ERROR'
      });
    }

    // Adresse obligatoire
    if (!row.adresse || typeof row.adresse !== 'string' || row.adresse.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'adresse',
        value: row.adresse,
        error: 'L\'adresse est obligatoire',
        severity: 'ERROR'
      });
    }

    // Propriétaire obligatoire
    if (!row.proprietaire_nom || typeof row.proprietaire_nom !== 'string' || row.proprietaire_nom.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'proprietaire_nom',
        value: row.proprietaire_nom,
        error: 'Le nom du propriétaire est obligatoire',
        severity: 'ERROR'
      });
    }

    // Validation taux de commission
    if (row.taux_commission !== undefined && row.taux_commission !== null && row.taux_commission !== '') {
      const taux = parseFloat(row.taux_commission.toString().replace('%', ''));
      if (isNaN(taux) || taux < 0 || taux > 100) {
        errors.push({
          row: rowNumber,
          field: 'taux_commission',
          value: row.taux_commission,
          error: 'Le taux de commission doit être entre 0 et 100%',
          severity: 'WARNING'
        });
      }
    }

    return errors;
  }

  private validateLocataireRow(row: any, rowNumber: number): ImportErrorDto[] {
    const errors: ImportErrorDto[] = [];

    // Nom obligatoire
    if (!row.nom || typeof row.nom !== 'string' || row.nom.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'nom',
        value: row.nom,
        error: 'Le nom du locataire est obligatoire',
        severity: 'ERROR'
      });
    }

    // Validation email si fourni
    if (row.email && typeof row.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email.trim())) {
        errors.push({
          row: rowNumber,
          field: 'email',
          value: row.email,
          error: 'Format d\'email invalide',
          severity: 'WARNING'
        });
      }
    }

    // Validation téléphone si fourni
    if (row.telephone && typeof row.telephone === 'string') {
      const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
      if (!phoneRegex.test(row.telephone.trim())) {
        errors.push({
          row: rowNumber,
          field: 'telephone',
          value: row.telephone,
          error: 'Format de téléphone invalide',
          severity: 'WARNING'
        });
      }
    }

    // Validation date de naissance si fournie
    if (row.date_naissance && typeof row.date_naissance === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.date_naissance.trim())) {
        errors.push({
          row: rowNumber,
          field: 'date_naissance',
          value: row.date_naissance,
          error: 'Format de date invalide (attendu: YYYY-MM-DD)',
          severity: 'WARNING'
        });
      } else {
        const date = new Date(row.date_naissance);
        if (isNaN(date.getTime())) {
          errors.push({
            row: rowNumber,
            field: 'date_naissance',
            value: row.date_naissance,
            error: 'Date invalide',
            severity: 'WARNING'
          });
        }
      }
    }

    return errors;
  }

  private validateLotRow(row: any, rowNumber: number): ImportErrorDto[] {
    const errors: ImportErrorDto[] = [];

    // Numéro obligatoire
    if (!row.numero || typeof row.numero !== 'string' || row.numero.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'numero',
        value: row.numero,
        error: 'Le numéro de lot est obligatoire',
        severity: 'ERROR'
      });
    }

    // Immeuble obligatoire
    if (!row.immeuble_nom || typeof row.immeuble_nom !== 'string' || row.immeuble_nom.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'immeuble_nom',
        value: row.immeuble_nom,
        error: 'Le nom de l\'immeuble est obligatoire',
        severity: 'ERROR'
      });
    }

    // Validation type
    if (row.type) {
      const validTypes = ['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE'];
      const type = row.type.toString().toUpperCase();
      if (!validTypes.includes(type)) {
        errors.push({
          row: rowNumber,
          field: 'type',
          value: row.type,
          error: `Type invalide. Types autorisés: ${validTypes.join(', ')}`,
          severity: 'WARNING'
        });
      }
    }

    // Validation loyer mensuel
    if (row.loyer_mensuel !== undefined && row.loyer_mensuel !== null && row.loyer_mensuel !== '') {
      const loyer = parseFloat(row.loyer_mensuel.toString().replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (isNaN(loyer) || loyer < 0) {
        errors.push({
          row: rowNumber,
          field: 'loyer_mensuel',
          value: row.loyer_mensuel,
          error: 'Le loyer mensuel doit être un nombre positif',
          severity: 'WARNING'
        });
      }
    }

    // Validation statut
    if (row.statut) {
      const validStatuts = ['LIBRE', 'OCCUPE'];
      const statut = row.statut.toString().toUpperCase();
      if (!validStatuts.includes(statut)) {
        errors.push({
          row: rowNumber,
          field: 'statut',
          value: row.statut,
          error: `Statut invalide. Statuts autorisés: ${validStatuts.join(', ')}`,
          severity: 'WARNING'
        });
      }
    }

    // Validation étage si fourni
    if (row.etage !== undefined && row.etage !== null && row.etage !== '') {
      const etage = parseInt(row.etage.toString());
      if (isNaN(etage) || etage < -5 || etage > 50) {
        errors.push({
          row: rowNumber,
          field: 'etage',
          value: row.etage,
          error: 'L\'étage doit être un nombre entre -5 et 50',
          severity: 'WARNING'
        });
      }
    }

    return errors;
  }
}