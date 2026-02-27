import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { FileValidationUtil } from '../utils/file-validation.util';

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  /**
   * Parse un fichier Excel et retourne les données structurées
   */
  async parseExcelFile(file: Express.Multer.File): Promise<any[]> {
    try {
      // Valider le fichier
      FileValidationUtil.validateExcelFile(file);

      // Lire le fichier Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      
      // Prendre la première feuille
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('Le fichier Excel ne contient aucune feuille');
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON avec les en-têtes de la première ligne
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false
      });

      if (data.length === 0) {
        throw new BadRequestException('Le fichier Excel est vide');
      }

      // Extraire les en-têtes (première ligne)
      const headers = data[0] as string[];
      if (!headers || headers.length === 0) {
        throw new BadRequestException('Aucun en-tête trouvé dans le fichier Excel');
      }

      // Convertir les données en objets avec les en-têtes comme clés
      const rows = data.slice(1).map((row: any[], index) => {
        const obj: any = { _rowNumber: index + 2 }; // +2 car ligne 1 = headers, index 0 = ligne 2
        headers.forEach((header, colIndex) => {
          if (header) {
            obj[header.toLowerCase().trim()] = row[colIndex] || null;
          }
        });
        return obj;
      });

      // Filtrer les lignes vides
      const filteredRows = rows.filter(row => {
        const values = Object.values(row).filter(v => v !== null && v !== undefined && v !== '');
        return values.length > 1; // Au moins une valeur en plus de _rowNumber
      });

      this.logger.log(`Fichier Excel parsé: ${filteredRows.length} lignes de données trouvées`);
      return filteredRows;

    } catch (error) {
      this.logger.error('Erreur lors du parsing du fichier Excel:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la lecture du fichier Excel: ${error.message}`);
    }
  }

  /**
   * Parse un fichier Excel multi-feuilles pour importAll
   */
  parseMultiSheetExcel(file: Express.Multer.File): {
    proprietaires: any[];
    locataires: any[];
    immeubles: any[];
    lots: any[];
  } {
    FileValidationUtil.validateExcelFile(file);
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    const findSheet = (keywords: string[]) => {
      return sheetNames.find(name => 
        keywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase()))
      );
    };
    
    const proprietairesSheetName = findSheet(['propriétaire', 'proprietaire', 'proprio']);
    const locatairesSheetName = findSheet(['locataire']);
    const immeublesSheetName = findSheet(['immeuble']);
    const lotsSheetName = findSheet(['lot']);

    const getSheetData = (sheetName: string | undefined) => {
      if (!sheetName) return [];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      if (data.length <= 1) return [];
      
      const headers = data[0] as string[];
      return data.slice(1).map((row: any[], index) => {
        const obj: any = { _rowNumber: index + 2 };
        headers.forEach((header, colIndex) => {
          if (header) obj[header.toLowerCase().trim()] = row[colIndex] || null;
        });
        return obj;
      }).filter(row => Object.values(row).filter(v => v !== null && v !== undefined && v !== '').length > 1);
    };

    return {
      proprietaires: getSheetData(proprietairesSheetName),
      locataires: getSheetData(locatairesSheetName),
      immeubles: getSheetData(immeublesSheetName),
      lots: getSheetData(lotsSheetName)
    };
  }
}