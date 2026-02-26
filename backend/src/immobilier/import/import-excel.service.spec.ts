import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImportExcelService } from './import-excel.service';
import { PrismaService } from '../../common/services/prisma.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { AuditService } from '../../audit/audit.service';
import { EntityType } from './dto';
import * as XLSX from 'xlsx';

describe('ImportExcelService', () => {
  let service: ImportExcelService;
  let prismaService: PrismaService;
  let referenceGeneratorService: ReferenceGeneratorService;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportExcelService,
        {
          provide: PrismaService,
          useValue: {
            proprietaires: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            immeubles: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            locataires: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            lots: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ReferenceGeneratorService,
          useValue: {
            generateImmeubleReference: jest.fn().mockResolvedValue('IMM-001'),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ImportExcelService>(ImportExcelService);
    prismaService = module.get<PrismaService>(PrismaService);
    referenceGeneratorService = module.get<ReferenceGeneratorService>(ReferenceGeneratorService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTemplate', () => {
    it('should generate template for proprietaires', async () => {
      const buffer = await service.generateTemplate(EntityType.PROPRIETAIRES);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verify template content
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets['Données'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['nom', 'telephone', 'email', 'adresse']);
      expect(data[1]).toEqual(['Dupont Jean', '0123456789', 'jean.dupont@email.com', '123 Rue de la Paix, 75001 Paris']);
    });

    it('should generate template for immeubles', async () => {
      const buffer = await service.generateTemplate(EntityType.IMMEUBLES);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets['Données'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['nom', 'adresse', 'proprietaire_nom', 'taux_commission']);
    });

    it('should generate template for locataires', async () => {
      const buffer = await service.generateTemplate(EntityType.LOCATAIRES);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets['Données'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['nom', 'prenom', 'telephone', 'email', 'date_naissance']);
    });

    it('should generate template for lots', async () => {
      const buffer = await service.generateTemplate(EntityType.LOTS);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets['Données'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['numero', 'immeuble_nom', 'type', 'loyer_mensuel_attendu', 'statut']);
    });
  });

  describe('parseExcelFile', () => {
    it('should parse valid Excel file', async () => {
      // Create a simple Excel file for testing
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['nom', 'telephone', 'email'],
        ['Test User', '0123456789', 'test@example.com']
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await service.parseExcelFile(mockFile);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('nom', 'Test User');
      expect(result[0]).toHaveProperty('telephone', '0123456789');
      expect(result[0]).toHaveProperty('email', 'test@example.com');
      expect(result[0]).toHaveProperty('_rowNumber', 2);
    });

    it('should handle empty rows correctly', async () => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['nom', 'telephone', 'email'],
        ['Test User', '0123456789', 'test@example.com'],
        ['', '', ''], // Empty row
        ['Another User', '0987654321', 'another@example.com']
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await service.parseExcelFile(mockFile);
      expect(result).toHaveLength(2); // Empty row should be filtered out
      expect(result[0].nom).toBe('Test User');
      expect(result[1].nom).toBe('Another User');
    });

    it('should throw error for file without data', async () => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([['nom', 'telephone', 'email']]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(service.parseExcelFile(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should throw error for empty file', async () => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(service.parseExcelFile(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should handle special characters in data', async () => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['nom', 'telephone', 'email'],
        ["Jean-Pierre O'Connor", '0123456789', 'jean-pierre@example.com']
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await service.parseExcelFile(mockFile);
      expect(result[0].nom).toBe("Jean-Pierre O'Connor");
    });
  });

  describe('validateImportData', () => {
    it('should validate proprietaires data correctly', async () => {
      const data = [
        { nom: 'Test User', telephone: '0123456789', email: 'test@example.com', _rowNumber: 2 },
        { nom: '', telephone: '0123456789', email: 'invalid-email', _rowNumber: 3 }
      ];

      const result = await service.validateImportData(data, EntityType.PROPRIETAIRES);
      
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);
      expect(result.errors).toHaveLength(2); // nom manquant + email invalide
      expect(result.isValid).toBe(false);
    });

    it('should validate all valid proprietaires data', async () => {
      const data = [
        { nom: 'Test User 1', telephone: '0123456789', email: 'test1@example.com', _rowNumber: 2 },
        { nom: 'Test User 2', telephone: '0987654321', email: 'test2@example.com', _rowNumber: 3 }
      ];

      const result = await service.validateImportData(data, EntityType.PROPRIETAIRES);
      
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.invalidRows).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.isValid).toBe(true);
    });

    it('should handle optional fields correctly', async () => {
      const data = [
        { nom: 'Test User', _rowNumber: 2 } // Only required field
      ];

      const result = await service.validateImportData(data, EntityType.PROPRIETAIRES);
      
      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should validate email format when provided', async () => {
      const data = [
        { nom: 'Test User', email: 'invalid-email-format', _rowNumber: 2 }
      ];

      const result = await service.validateImportData(data, EntityType.PROPRIETAIRES);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('WARNING');
      expect(result.errors[0].field).toBe('email');
    });
  });

  describe('importProprietaires', () => {
    const createMockFile = (data: any[][]) => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return {
        fieldname: 'file',
        originalname: 'proprietaires.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      } as Express.Multer.File;
    };

    it('should import proprietaires successfully', async () => {
      const mockFile = createMockFile([
        ['nom', 'telephone', 'email', 'adresse'],
        ['John Doe', '0123456789', 'john@example.com', '123 Main St'],
        ['Jane Smith', '0987654321', 'jane@example.com', '456 Oak Ave']
      ]);

      // Mock no existing proprietaires
      (prismaService.proprietaires.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock transaction
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          proprietaires: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn()
              .mockResolvedValueOnce({ id: 'prop-1', nom: 'John Doe' })
              .mockResolvedValueOnce({ id: 'prop-2', nom: 'Jane Smith' })
          }
        };
        return await callback(mockTx);
      });

      const result = await service.importProprietaires(mockFile, 'user-1');

      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.successfulRows).toBe(2);
      expect(result.failedRows).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle duplicate proprietaires', async () => {
      const mockFile = createMockFile([
        ['nom', 'telephone', 'email'],
        ['John Doe', '0123456789', 'john@example.com'],
        ['John Doe', '0123456789', 'john2@example.com'] // Duplicate
      ]);

      // Mock transaction with duplicate detection
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          proprietaires: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(null) // First is new
              .mockResolvedValueOnce({ id: 'existing', nom: 'John Doe' }), // Second is duplicate
            create: jest.fn().mockResolvedValueOnce({ id: 'prop-1', nom: 'John Doe' })
          }
        };
        return await callback(mockTx);
      });

      const result = await service.importProprietaires(mockFile, 'user-1');

      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.successfulRows).toBe(1);
      expect(result.failedRows).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('WARNING');
      expect(result.errors[0].error).toContain('déjà existant');
    });

    it('should handle validation errors', async () => {
      const mockFile = createMockFile([
        ['nom', 'telephone', 'email'],
        ['', '0123456789', 'invalid-email'] // Invalid data
      ]);

      const result = await service.importProprietaires(mockFile, 'user-1');

      expect(result.success).toBe(false);
      expect(result.totalRows).toBe(1);
      expect(result.successfulRows).toBe(0);
      expect(result.failedRows).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should create audit logs for successful imports', async () => {
      const mockFile = createMockFile([
        ['nom', 'telephone', 'email'],
        ['John Doe', '0123456789', 'john@example.com']
      ]);

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          proprietaires: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'prop-1', nom: 'John Doe' })
          }
        };
        return await callback(mockTx);
      });

      await service.importProprietaires(mockFile, 'user-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entityType: 'Proprietaire',
          userId: 'user-1'
        })
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'IMPORT',
          entityType: 'Proprietaire',
          userId: 'user-1'
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockFile = createMockFile([
        ['nom', 'telephone', 'email'],
        ['John Doe', '0123456789', 'john@example.com']
      ]);

      (prismaService.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.importProprietaires(mockFile, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('progress tracking', () => {
    it('should track import progress correctly', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        size: 1000,
        buffer: Buffer.from('test')
      } as Express.Multer.File;

      // Mock parseExcelFile to return test data
      jest.spyOn(service, 'parseExcelFile').mockResolvedValue([
        { nom: 'Test User', _rowNumber: 2 }
      ]);

      // Mock validateImportData
      jest.spyOn(service, 'validateImportData').mockResolvedValue({
        isValid: true,
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        errors: []
      });

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          proprietaires: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'prop-1', nom: 'Test User' })
          }
        };
        return await callback(mockTx);
      });

      const result = await service.importProprietaires(mockFile, 'user-1');

      expect(result.importId).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics?.avgProcessingTimePerRow).toBeGreaterThan(0);
    });

    it('should provide detailed error statistics', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        size: 1000,
        buffer: Buffer.from('test')
      } as Express.Multer.File;

      jest.spyOn(service, 'parseExcelFile').mockResolvedValue([
        { nom: '', email: 'invalid-email', _rowNumber: 2 }
      ]);

      const result = await service.importProprietaires(mockFile, 'user-1');

      expect(result.errorStatistics).toBeDefined();
      expect(result.errorStatistics?.criticalErrors).toBeGreaterThan(0);
      expect(result.errorStatistics?.validationErrors).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large files with timeout protection', async () => {
      // This would be tested with actual large files in integration tests
      // Here we just ensure the timeout mechanism is in place
      const mockFile = {
        fieldname: 'file',
        originalname: 'large.xlsx',
        size: 50000000, // 50MB
        buffer: Buffer.alloc(1000)
      } as Express.Multer.File;

      jest.spyOn(service, 'parseExcelFile').mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([]), 100); // Quick resolve for test
        });
      });

      // Should not timeout in this test
      await expect(service.importProprietaires(mockFile, 'user-1')).resolves.toBeDefined();
    });

    it('should handle special characters in file names', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'propriétaires-été-2024.xlsx',
        size: 1000,
        buffer: Buffer.from('test')
      } as Express.Multer.File;

      jest.spyOn(service, 'parseExcelFile').mockResolvedValue([]);

      const result = await service.importProprietaires(mockFile, 'user-1');

      expect(result.auditInfo?.fileName).toBe('propriétaires-été-2024.xlsx');
    });
  });
});