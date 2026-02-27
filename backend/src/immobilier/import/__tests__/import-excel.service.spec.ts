import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImportExcelService } from '../import-excel.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { ReferenceGeneratorService } from '../../../common/services/reference-generator.service';
import { AuditService } from '../../../audit/audit.service';
import { ImportConfig } from '../config/import.config';
import { EntityCacheService } from '../services/entity-cache.service';
import { ErrorClassifierService } from '../services/error-classifier.service';
import { BatchProcessorService } from '../services/batch-processor.service';
import { EntityValidatorsService } from '../validators/entity-validators.service';
import { EntityType } from '../dto';

describe('ImportExcelService', () => {
  let service: ImportExcelService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<EntityCacheService>;
  let batchProcessor: jest.Mocked<BatchProcessorService>;

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
            $transaction: jest.fn(),
          },
        },
        {
          provide: ReferenceGeneratorService,
          useValue: {
            generateImmeubleReference: jest.fn().mockResolvedValue('IMM_001'),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: ImportConfig,
          useValue: {
            timeoutMs: 30000,
            batchSize: 10,
            progressUpdateInterval: 5,
          },
        },
        {
          provide: EntityCacheService,
          useValue: {
            getProprietaire: jest.fn(),
            cacheProprietaire: jest.fn(),
            clearCache: jest.fn(),
          },
        },
        {
          provide: ErrorClassifierService,
          useValue: {
            classifyError: jest.fn(),
          },
        },
        {
          provide: BatchProcessorService,
          useValue: {
            processProprietairesBatch: jest.fn(),
          },
        },
        {
          provide: EntityValidatorsService,
          useValue: {
            validateRow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ImportExcelService>(ImportExcelService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(EntityCacheService);
    batchProcessor = module.get(BatchProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseExcelFile', () => {
    it('should throw BadRequestException for invalid file', async () => {
      const invalidFile = {
        buffer: Buffer.from('invalid'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 100,
      } as Express.Multer.File;

      await expect(service.parseExcelFile(invalidFile)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateImportData', () => {
    it('should validate proprietaires data correctly', async () => {
      const mockData = [
        { nom: 'Test User', email: 'test@example.com', _rowNumber: 2 },
      ];

      const mockValidators = service['validators'];
      mockValidators.validateRow = jest.fn().mockResolvedValue([]);

      const result = await service.validateImportData(mockData, EntityType.PROPRIETAIRES);

      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
    });

    it('should handle validation errors', async () => {
      const mockData = [
        { nom: '', email: 'invalid-email', _rowNumber: 2 },
      ];

      const mockValidators = service['validators'];
      mockValidators.validateRow = jest.fn().mockResolvedValue([
        {
          row: 2,
          field: 'nom',
          value: '',
          error: 'Le nom est obligatoire',
          severity: 'ERROR',
        },
      ]);

      const result = await service.validateImportData(mockData, EntityType.PROPRIETAIRES);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('importProprietaires', () => {
    it('should process import with batch processing', async () => {
      const mockFile = {
        buffer: Buffer.from('mock excel data'),
        originalname: 'test.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      // Mock parseExcelFile
      jest.spyOn(service, 'parseExcelFile').mockResolvedValue([
        { nom: 'Test User 1', _rowNumber: 2 },
        { nom: 'Test User 2', _rowNumber: 3 },
      ]);

      // Mock validateImportData
      jest.spyOn(service, 'validateImportData').mockResolvedValue({
        isValid: true,
        totalRows: 2,
        validRows: 2,
        invalidRows: 0,
        errors: [],
      });

      // Mock batch processor
      batchProcessor.processProprietairesBatch.mockResolvedValue({
        successfulRows: 2,
        errors: [],
        processedRows: 2,
      });

      const result = await service.importProprietaires(mockFile, 'user123');

      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.successfulRows).toBe(2);
      expect(batchProcessor.processProprietairesBatch).toHaveBeenCalled();
    });

    it('should stop import on critical validation errors', async () => {
      const mockFile = {
        buffer: Buffer.from('mock excel data'),
        originalname: 'test.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      jest.spyOn(service, 'parseExcelFile').mockResolvedValue([
        { nom: '', _rowNumber: 2 },
      ]);

      jest.spyOn(service, 'validateImportData').mockResolvedValue({
        isValid: false,
        totalRows: 1,
        validRows: 0,
        invalidRows: 1,
        errors: [
          {
            row: 2,
            field: 'nom',
            value: '',
            error: 'Le nom est obligatoire',
            severity: 'ERROR',
          },
        ],
      });

      const result = await service.importProprietaires(mockFile, 'user123');

      expect(result.success).toBe(false);
      expect(result.successfulRows).toBe(0);
      expect(batchProcessor.processProprietairesBatch).not.toHaveBeenCalled();
    });
  });

  describe('getImportProgress', () => {
    it('should return progress for existing import', () => {
      const mockProgress = service['createImportProgress'](100);
      
      const progress = service.getImportProgress(mockProgress.importId);
      
      expect(progress).toBeDefined();
      expect(progress?.totalRows).toBe(100);
    });

    it('should return null for non-existing import', () => {
      const progress = service.getImportProgress('non-existing-id');
      
      expect(progress).toBeNull();
    });
  });
});