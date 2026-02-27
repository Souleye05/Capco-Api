const fs = require('fs');

// 1. Update import-excel.service.ts
const servicePath = 'c:\\Workspaces\\CAPCOS\\backend\\src\\immobilier\\import\\import-excel.service.ts';
let serviceCode = fs.readFileSync(servicePath, 'utf8');

const importAllCode = `
  async importAll(file: Express.Multer.File, userId?: string): Promise<ImportResultDto> {
    const startTime = Date.now();
    this.logger.log(\`Début de l'import complet - Fichier: \${file.originalname}\`);

    try {
      const FileValidationUtil = require('./utils/file-validation.util').FileValidationUtil;
      FileValidationUtil.validateExcelFile(file);
      const XLSX = require('xlsx');
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

      const getSheetData = (sheetName) => {
        if (!sheetName) return [];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
        if (data.length <= 1) return [];
        const headers = data[0];
        return data.slice(1).map((row, index) => {
          const obj = { _rowNumber: index + 2 };
          headers.forEach((header, colIndex) => {
            if (header) obj[header.toLowerCase().trim()] = row[colIndex] || null;
          });
          return obj;
        }).filter(row => Object.values(row).filter(v => v !== null && v !== undefined && v !== '').length > 1);
      };

      const proprietairesData = getSheetData(proprietairesSheetName);
      const locatairesData = getSheetData(locatairesSheetName);
      const immeublesData = getSheetData(immeublesSheetName);
      const lotsData = getSheetData(lotsSheetName);

      const totalRows = proprietairesData.length + locatairesData.length + immeublesData.length + lotsData.length;
      if (totalRows === 0) throw new Error('Aucune donnée valide trouvée dans le fichier.');

      const progress = this.createImportProgress(totalRows);
      const errors = [];
      let successfulRows = 0;
      let processedRows = 0;

      const result = await this.processWithTimeout(progress.importId, async () => {
        const createdProprietaires = new Map();
        const createdLocataires = new Map();
        const createdImmeubles = new Map();

        const parseNumber = (value) => {
          if (value === undefined || value === null || value === '') return 0;
          if (typeof value === 'number') return value;
          const num = parseFloat(value.toString().replace(/[^0-9.,]/g, '').replace(',', '.'));
          return isNaN(num) ? 0 : num;
        };
        const parseCommission = (value) => {
          if (value === undefined || value === null || value === '') return 5;
          if (typeof value === 'number') return value;
          const num = parseFloat(value.toString().replace('%', '').trim());
          return isNaN(num) ? 5 : num;
        };

        // 1. Propriétaires
        for (const row of proprietairesData) {
          try {
            if (!row.nom || row.nom.includes('(exemple)')) { processedRows++; continue; }
            const nom = row.nom.toString().trim();
            if (createdProprietaires.has(nom)) { processedRows++; continue; }
            const existing = await this.prisma.proprietaires.findFirst({ where: { nom } });
            if (existing) {
              createdProprietaires.set(nom, existing.id);
            } else {
              const created = await this.prisma.proprietaires.create({
                data: { nom, telephone: row.telephone?.toString() || null, email: row.email || null, adresse: row.adresse || null, createdBy: userId || 'import-system' }
              });
              createdProprietaires.set(nom, created.id);
              successfulRows++;
            }
          } catch (e) { errors.push({ row: row._rowNumber, field: 'general', value: null, error: e.message, severity: 'ERROR' }); }
          processedRows++;
          this.updateImportProgress(progress.importId, { processedRows, successfulRows });
        }

        // 2. Locataires
        for (const row of locatairesData) {
          try {
            if (!row.nom || row.nom.includes('(exemple)') || row.nom.trim() === '') { processedRows++; continue; }
            const nom = row.nom.toString().trim();
            if (createdLocataires.has(nom)) { processedRows++; continue; }
            const existing = await this.prisma.locataires.findFirst({ where: { nom } });
            if (existing) {
              createdLocataires.set(nom, existing.id);
            } else {
              const created = await this.prisma.locataires.create({
                data: { nom, telephone: row.telephone?.toString() || null, email: row.email || null, createdBy: userId || 'import-system' }
              });
              createdLocataires.set(nom, created.id);
              successfulRows++;
            }
          } catch (e) { errors.push({ row: row._rowNumber, field: 'general', value: null, error: e.message, severity: 'ERROR' }); }
          processedRows++;
          this.updateImportProgress(progress.importId, { processedRows, successfulRows });
        }

        // 3. Immeubles
        for (const row of immeublesData) {
          try {
            if (!row.nom || row.nom.includes('(exemple)')) { processedRows++; continue; }
            const nom = row.nom.toString().trim();
            if (createdImmeubles.has(nom)) { processedRows++; continue; }
            const proprietaireNom = row.proprietaire_nom?.toString().trim();
            let proprietaireId = createdProprietaires.get(proprietaireNom || '');
            if (!proprietaireId && proprietaireNom) {
              const existing = await this.prisma.proprietaires.findFirst({ where: { nom: proprietaireNom } });
              if (existing) proprietaireId = existing.id;
              else {
                const created = await this.prisma.proprietaires.create({ data: { nom: proprietaireNom, createdBy: userId || 'import-system' } });
                proprietaireId = created.id;
                createdProprietaires.set(proprietaireNom, created.id);
              }
            }
            if (!proprietaireId) { errors.push({ row: row._rowNumber, field: 'proprietaire_nom', value: proprietaireNom, error: 'Propriétaire introuvable', severity: 'WARNING' }); processedRows++; continue; }
            const existingImmeuble = await this.prisma.immeubles.findFirst({ where: { nom } });
            if (existingImmeuble) { createdImmeubles.set(nom, existingImmeuble.id); } 
            else {
              const reference = await this.referenceGenerator.generateImmeubleReference();
              const created = await this.prisma.immeubles.create({
                data: { nom, adresse: row.adresse || nom, proprietaireId, tauxCommissionCapco: parseCommission(row.taux_commission), notes: row.notes || null, reference, createdBy: userId || 'import-system' }
              });
              createdImmeubles.set(nom, created.id);
              successfulRows++;
            }
          } catch (e) { errors.push({ row: row._rowNumber, field: 'general', value: null, error: e.message, severity: 'ERROR' }); }
          processedRows++;
          this.updateImportProgress(progress.importId, { processedRows, successfulRows });
        }

        // 4. Lots
        for (const row of lotsData) {
          try {
            if (!row.numero || row.numero.includes('(exemple)') || row.numero.toString().trim() === '') { processedRows++; continue; }
            const numStr = row.numero.toString().toLowerCase();
            if (numStr.includes('types autorisés') || numStr.includes('statuts autorisés')) { processedRows++; continue; }
            const immeubleNom = row.immeuble_nom?.toString().trim();
            let immeubleId = createdImmeubles.get(immeubleNom || '');
            if (!immeubleId && immeubleNom) {
              const existing = await this.prisma.immeubles.findFirst({ where: { nom: immeubleNom } });
              if (existing) { immeubleId = existing.id; createdImmeubles.set(immeubleNom, existing.id); }
            }
            if (!immeubleId) { errors.push({ row: row._rowNumber, field: 'immeuble_nom', value: immeubleNom, error: 'Immeuble introuvable', severity: 'WARNING' }); processedRows++; continue; }
            
            const locataireNom = row.locataire_nom?.toString().trim();
            let locataireId = null;
            if (locataireNom) {
              locataireId = createdLocataires.get(locataireNom);
              if (!locataireId) {
                const existing = await this.prisma.locataires.findFirst({ where: { nom: locataireNom } });
                if (existing) locataireId = existing.id;
                else {
                  const created = await this.prisma.locataires.create({ data: { nom: locataireNom, createdBy: userId || 'import-system' } });
                  locataireId = created.id;
                  createdLocataires.set(locataireNom, created.id);
                }
              }
            }

            const existingLot = await this.prisma.lots.findFirst({ where: { numero: row.numero.toString().trim(), immeubleId } });
            if (!existingLot) {
              await this.prisma.lots.create({
                data: {
                  numero: row.numero.toString().trim(),
                  immeubleId,
                  type: (['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE'].includes(row.type?.toString().toUpperCase()) ? row.type?.toString().toUpperCase() : 'AUTRE') as any,
                  etage: row.etage?.toString() || null,
                  loyerMensuelAttendu: parseNumber(row.loyer_mensuel),
                  locataireId: locataireId || null,
                  statut: (row.statut?.toString().toUpperCase() === 'OCCUPE' ? 'OCCUPE' : 'LIBRE') as any,
                  createdBy: userId || 'import-system'
                }
              });
              successfulRows++;
            }
          } catch (e) { errors.push({ row: row._rowNumber, field: 'general', value: null, error: e.message, severity: 'ERROR' }); }
          processedRows++;
          this.updateImportProgress(progress.importId, { processedRows, successfulRows });
        }

        return this.createImportResult(startTime, totalRows, successfulRows, errors, progress.importId, file, userId);
      });

      return result;

    } catch (e) {
      this.logger.error('Erreur import all', e);
      throw new require('@nestjs/common').BadRequestException(\`Erreur: \${e.message}\`);
    }
  }
`;

serviceCode = serviceCode.replace(
    /async importImmeubles[\s\S]*?async generateTemplate/g,
    importAllCode + '\n  async generateTemplate'
);
fs.writeFileSync(servicePath, serviceCode, 'utf8');

// 2. Update import-excel.controller.ts
const controllerPath = 'c:\\Workspaces\\CAPCOS\\backend\\src\\immobilier\\import\\import-excel.controller.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf8');

const importAllCtrl = `
  @Post('all')
  @UseInterceptors(FileInterceptor('file', FileValidationUtil.createMulterOptions()))
  @ApiOperation({ summary: 'Importer tout via le backend' })
  @ApiConsumes('multipart/form-data')
  @Roles('admin', 'collaborateur')
  async importAll(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<ImportResultDto> {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return await this.importService.importAll(file, userId);
  }
  
  @Get('progress/:importId')
`;
controllerCode = controllerCode.replace(/@Get\('progress\/:importId'\)/, importAllCtrl);
fs.writeFileSync(controllerPath, controllerCode, 'utf8');

// 3. Update client.ts in frontend
const clientPath = 'c:\\Workspaces\\CAPCOS\\frontend\\src\\integrations\\nestjs\\client.ts';
let clientCode = fs.readFileSync(clientPath, 'utf8');

const importExcelApi = `
  async importExcelData(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Custom fetch because we are handling multipart/form-data
    const token = this.getToken();
    const headers: any = {};
    if (token) headers['Authorization'] = \`Bearer \${token}\`;

    try {
      const response = await fetch(\`\${this.baseUrl}/immobilier/import/all\`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || 'Erreur API', data: null };
      return { success: data.success !== false, message: data.summary || 'Import terminé avec succès', data };
    } catch (e) {
      return { success: false, message: 'Erreur réseau ou fichier invalide', data: null };
    }
  }

  // Tableau de bord immobilier
`;
clientCode = clientCode.replace(/\/\/ Tableau de bord immobilier/, importExcelApi);
fs.writeFileSync(clientPath, clientCode, 'utf8');

// 4. Update ImportExcelDialog.tsx
const dialogPath = 'c:\\Workspaces\\CAPCOS\\frontend\\src\\components\\dialogs\\ImportExcelDialog.tsx';
let dialogCode = fs.readFileSync(dialogPath, 'utf8');

dialogCode = dialogCode.replace(/import { importExcelData } from '@\/utils\/importExcelData';/g, `import { nestjsApi } from '@/integrations/nestjs/client';`);
dialogCode = dialogCode.replace(
    /const result = await importExcelData\(file\);/,
    `const result = await nestjsApi.importExcelData(file);`
);

fs.writeFileSync(dialogPath, dialogCode, 'utf8');
console.log("Mise à jour terminée !");
