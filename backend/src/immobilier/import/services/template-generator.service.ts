import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { EntityType } from '../dto';

@Injectable()
export class TemplateGeneratorService {
  private readonly logger = new Logger(TemplateGeneratorService.name);

  async generateTemplate(entityType: EntityType): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();
    
    let headers: string[] = [];
    let exampleData: any[] = [];

    switch (entityType) {
      case EntityType.PROPRIETAIRES:
        headers = ['nom', 'telephone', 'email', 'adresse'];
        exampleData = [
          ['Dupont Jean', '0123456789', 'jean.dupont@email.com', '123 Rue de la Paix, 75001 Paris'],
          ['Martin Marie', '0987654321', 'marie.martin@email.com', '456 Avenue des Champs, 69001 Lyon']
        ];
        break;
      case EntityType.IMMEUBLES:
        headers = ['nom', 'adresse', 'proprietaire_nom', 'taux_commission'];
        exampleData = [
          ['Résidence Les Jardins', '789 Boulevard Haussmann, 75008 Paris', 'Dupont Jean', '5'],
          ['Immeuble Central', '321 Place Bellecour, 69002 Lyon', 'Martin Marie', '4.5']
        ];
        break;
      case EntityType.LOCATAIRES:
        headers = ['nom', 'prenom', 'telephone', 'email', 'date_naissance'];
        exampleData = [
          ['Durand', 'Pierre', '0111111111', 'pierre.durand@email.com', '1985-03-15'],
          ['Moreau', 'Sophie', '0222222222', 'sophie.moreau@email.com', '1990-07-22']
        ];
        break;
      case EntityType.LOTS:
        headers = ['numero', 'immeuble_nom', 'type', 'loyer_mensuel_attendu', 'statut'];
        exampleData = [
          ['A101', 'Résidence Les Jardins', 'APPARTEMENT', '1200', 'LIBRE'],
          ['B205', 'Immeuble Central', 'STUDIO', '800', 'OCCUPE']
        ];
        break;
    }

    // Créer la feuille principale avec les données
    const worksheetData = [headers, ...exampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');

    // Générer le buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    this.logger.log(`Template Excel généré pour ${entityType}`);
    return buffer;
  }

  /**
   * Générer un template multi-feuilles pour importAll
   */
  async generateMultiSheetTemplate(): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Feuille Propriétaires
    const proprietairesData = [
      ['nom', 'telephone', 'email', 'adresse'],
      ['Dupont Jean (exemple)', '0123456789', 'jean.dupont@email.com', '123 Rue de la Paix, 75001 Paris'],
      ['Martin Marie (exemple)', '0987654321', 'marie.martin@email.com', '456 Avenue des Champs, 69001 Lyon']
    ];
    const proprietairesSheet = XLSX.utils.aoa_to_sheet(proprietairesData);
    XLSX.utils.book_append_sheet(workbook, proprietairesSheet, 'Proprietaires');

    // Feuille Immeubles
    const immeublesData = [
      ['nom', 'adresse', 'proprietaire_nom', 'taux_commission', 'notes'],
      ['Résidence Les Jardins (exemple)', '789 Boulevard Haussmann, 75008 Paris', 'Dupont Jean', '5', 'Immeuble moderne'],
      ['Immeuble Central (exemple)', '321 Place Bellecour, 69002 Lyon', 'Martin Marie', '4.5', 'Centre ville']
    ];
    const immeublesSheet = XLSX.utils.aoa_to_sheet(immeublesData);
    XLSX.utils.book_append_sheet(workbook, immeublesSheet, 'Immeubles');

    // Feuille Locataires
    const locatairesData = [
      ['nom', 'telephone', 'email'],
      ['Durand Pierre (exemple)', '0111111111', 'pierre.durand@email.com'],
      ['Moreau Sophie (exemple)', '0222222222', 'sophie.moreau@email.com']
    ];
    const locatairesSheet = XLSX.utils.aoa_to_sheet(locatairesData);
    XLSX.utils.book_append_sheet(workbook, locatairesSheet, 'Locataires');

    // Feuille Lots
    const lotsData = [
      ['numero', 'immeuble_nom', 'type', 'etage', 'loyer_mensuel', 'locataire_nom', 'statut'],
      ['A101 (exemple)', 'Résidence Les Jardins', 'F3', '1', '1200', 'Durand Pierre', 'OCCUPE'],
      ['B205 (exemple)', 'Immeuble Central', 'STUDIO', '2', '800', '', 'LIBRE'],
      ['', '', 'Types autorisés: STUDIO, F1, F2, F3, F4, F5, MAGASIN, BUREAU, AUTRE', '', '', '', ''],
      ['', '', 'Statuts autorisés: LIBRE, OCCUPE', '', '', '', '']
    ];
    const lotsSheet = XLSX.utils.aoa_to_sheet(lotsData);
    XLSX.utils.book_append_sheet(workbook, lotsSheet, 'Lots');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    this.logger.log('Template multi-feuilles généré');
    return buffer;
  }
}