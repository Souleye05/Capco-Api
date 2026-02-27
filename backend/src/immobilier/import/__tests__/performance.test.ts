import { Test, TestingModule } from '@nestjs/testing';
import { ImportExcelService } from '../import-excel.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { ImportConfig } from '../config/import.config';
import { EntityCacheService } from '../services/entity-cache.service';
import { ErrorClassifierService } from '../services/error-classifier.service';
import { BatchProcessorService } from '../services/batch-processor.service';
import { EntityValidatorsService } from '../validators/entity-validators.service';
import { ReferenceGeneratorService } from '../../../common/services/reference-generator.service';
import { AuditService } from '../../../audit/audit.service';
import * as XLSX from 'xlsx';

describe('ImportExcelService Performance Tests', () => {
  let service: ImportExcelService;
  let cacheService: EntityCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportExcelService,
        {
          provide: PrismaService,
          useValue: {
            proprietaires: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation((data) => ({
                id: Math.random().toString(),
                ...data.data
              })),
            },
            $transaction: jest.fn().mockImplementation((callback) => callback({
              proprietaires: {
                findFirst: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockImplementation((data) => ({
                  id: Math.random().toString(),
                  ...data.data
                })),
              }
            })),
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
            batchSize: 50, // Batch plus petit pour les tests
            progressUpdateInterval: 10,
            cacheSize: 100,
            enableParallelProcessing: false,
          },
        },
        EntityCacheService,
        ErrorClassifierService,
        BatchProcessorService,
        EntityValidatorsService,
      ],
    }).compile();

    service = module.get<ImportExcelService>(ImportExcelService);
    cacheService = module.get<EntityCacheService>(EntityCacheService);
  });

  describe('Cache Performance', () => {
    it('should demonstrate cache efficiency', async () => {
      const testData = Array.from({ length: 100 }, (_, i) => ({
        nom: `Proprietaire ${i % 10}`, // 10 noms uniques répétés
        email: `test${i}@example.com`,
        _rowNumber: i + 2
      }));

      // Premier passage - mise en cache
      const startTime1 = Date.now();
      for (const row of testData) {
        await cacheService.getProprietaire(row.nom);
      }
      const duration1 = Date.now() - startTime1;

      // Deuxième passage - utilisation du cache
      const startTime2 = Date.now();
      for (const row of testData) {
        await cacheService.getProprietaire(row.nom);
      }
      const duration2 = Date.now() - startTime2;

      // Le deuxième passage devrait être significativement plus rapide
      expect(duration2).toBeLessThan(duration1 * 0.5);

      const stats = cacheService.getCacheStats();
      expect(stats.proprietaires.totalHits).toBeGreaterThan(0);
    });

    it('should handle cache eviction correctly', async () => {
      const config = service['config'];
      config.cacheSize = 5; // Cache très petit

      // Remplir le cache au-delà de sa capacité
      for (let i = 0; i < 10; i++) {
        cacheService.cacheProprietaire(`User${i}`, { id: i.toString(), nom: `User${i}` });
      }

      const stats = cacheService.getCacheStats();
      expect(stats.proprietaires.size).toBeLessThanOrEqual(5);
    });
  });

  describe('Batch Processing Performance', () => {
    it('should process large datasets efficiently', async () => {
      // Créer un fichier Excel de test avec 500 lignes
      const testData = Array.from({ length: 500 }, (_, i) => ({
        nom: `Proprietaire Test ${i}`,
        email: `test${i}@example.com`,
        telephone: `0123456${String(i).padStart(3, '0')}`,
        adresse: `${i} Rue de Test`
      }));

      // Créer un buffer Excel
      const worksheet = XLSX.utils.json_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const mockFile = {
        buffer,
        originalname: 'test-performance.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
      } as Express.Multer.File;

      const startTime = Date.now();
      const result = await service.importProprietaires(mockFile, 'test-user');
      const duration = Date.now() - startTime;

      // Vérifier que le traitement est terminé en moins de 10 secondes
      expect(duration).toBeLessThan(10000);
      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(500);
      
      // Vérifier les métriques de performance
      expect(result.performanceMetrics?.avgProcessingTimePerRow).toBeLessThan(20); // < 20ms par ligne
    });
  });

  describe('Memory Usage', () => {
    it('should maintain constant memory usage with large files', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Traiter plusieurs batches pour simuler un gros fichier
      for (let batch = 0; batch < 10; batch++) {
        const testData = Array.from({ length: 100 }, (_, i) => ({
          nom: `Batch${batch}_User${i}`,
          email: `batch${batch}_test${i}@example.com`,
          _rowNumber: batch * 100 + i + 2
        }));

        // Simuler le traitement d'un batch
        for (const row of testData) {
          await cacheService.getProprietaire(row.nom);
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // L'augmentation de mémoire ne devrait pas être excessive
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
    });
  });

  describe('Error Classification Performance', () => {
    it('should classify errors efficiently', () => {
      const errorClassifier = new ErrorClassifierService();
      const errors = [
        new Error('Validation failed'),
        { code: 'P2002', message: 'Unique constraint' },
        { code: 'P2003', message: 'Foreign key constraint' },
        new Error('Timeout occurred'),
        new Error('System error'),
      ];

      const startTime = Date.now();
      const classifiedErrors = errors.map((error, index) => 
        errorClassifier.classifyError(error, index + 1, 'test_field', 'test_value')
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10); // Classification très rapide
      expect(classifiedErrors).toHaveLength(5);
      expect(classifiedErrors.every(e => e.errorType)).toBe(true);
    });
  });

  afterEach(() => {
    // Nettoyer le cache après chaque test
    cacheService.clearCache();
  });
});