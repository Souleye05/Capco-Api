import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ImpayesService } from '../impayes/impayes.service';
import { ImportExcelService } from '../import/import-excel.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { AuditService } from '../../audit/audit.service';
import { PaginationService } from '../../common/services/pagination.service';
import { AlertesService } from '../impayes/alertes.service';
import * as XLSX from 'xlsx';

describe('Immobilier Performance Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let impayesService: ImpayesService;
  let importExcelService: ImportExcelService;

  // Performance thresholds (in milliseconds)
  const PERFORMANCE_THRESHOLDS = {
    UNPAID_DETECTION_SMALL: 500,    // < 100 lots
    UNPAID_DETECTION_MEDIUM: 1500,  // < 500 lots
    UNPAID_DETECTION_LARGE: 3000,   // < 1000 lots
    STATISTICS_CALCULATION: 2000,
    EXCEL_IMPORT_SMALL: 1000,       // < 100 rows
    EXCEL_IMPORT_MEDIUM: 5000,      // < 500 rows
    EXCEL_IMPORT_LARGE: 15000,      // < 1000 rows
    QUERY_RESPONSE: 200,             // Simple queries
    PAGINATION_RESPONSE: 300         // Paginated queries
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        ImpayesService,
        ImportExcelService,
        ReferenceGeneratorService,
        AuditService,
        PaginationService,
        AlertesService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    impayesService = moduleFixture.get<ImpayesService>(ImpayesService);
    importExcelService = moduleFixture.get<ImportExcelService>(ImportExcelService);
  });

  afterAll(async () => {
    await cleanupPerformanceData();
    await app.close();
  });
  async function cleanupPerformanceData() {
    // Clean up all test data created during performance tests
    await prismaService.encaissementsLoyers.deleteMany({
      where: { createdBy: 'perf-test' }
    });
    await prismaService.lots.deleteMany({
      where: { createdBy: 'perf-test' }
    });
    await prismaService.locataires.deleteMany({
      where: { createdBy: 'perf-test' }
    });
    await prismaService.immeubles.deleteMany({
      where: { createdBy: 'perf-test' }
    });
    await prismaService.proprietaires.deleteMany({
      where: { createdBy: 'perf-test' }
    });
  }

  async function createPerformanceTestData(
    numProprietaires: number,
    numImmeubles: number,
    numLocataires: number,
    numLots: number
  ) {
    console.log(`Creating performance test data: ${numProprietaires} proprietaires, ${numImmeubles} immeubles, ${numLocataires} locataires, ${numLots} lots`);
    
    const startTime = Date.now();

    // Create proprietaires
    const proprietaires = [];
    for (let i = 0; i < numProprietaires; i++) {
      proprietaires.push({
        nom: `Perf Owner ${i}`,
        telephone: `01${String(i).padStart(8, '0')}`,
        email: `perfowner${i}@test.com`,
        createdBy: 'perf-test'
      });
    }
    const createdProprietaires = await prismaService.proprietaires.createMany({
      data: proprietaires
    });

    // Get created proprietaires IDs
    const proprietaireIds = await prismaService.proprietaires.findMany({
      where: { createdBy: 'perf-test' },
      select: { id: true }
    });

    // Create immeubles
    const immeubles = [];
    for (let i = 0; i < numImmeubles; i++) {
      immeubles.push({
        nom: `Perf Building ${i}`,
        adresse: `${i} Performance Street`,
        reference: `PERF-${String(i).padStart(3, '0')}`,
        proprietaireId: proprietaireIds[i % proprietaireIds.length].id,
        tauxCommission: 5,
        createdBy: 'perf-test'
      });
    }
    await prismaService.immeubles.createMany({ data: immeubles });

    const immeubleIds = await prismaService.immeubles.findMany({
      where: { createdBy: 'perf-test' },
      select: { id: true }
    });

    // Create locataires
    const locataires = [];
    for (let i = 0; i < numLocataires; i++) {
      locataires.push({
        nom: `Perf Tenant ${i}`,
        prenom: 'John',
        telephone: `09${String(i).padStart(8, '0')}`,
        email: `perftenant${i}@test.com`,
        createdBy: 'perf-test'
      });
    }
    await prismaService.locataires.createMany({ data: locataires });

    const locataireIds = await prismaService.locataires.findMany({
      where: { createdBy: 'perf-test' },
      select: { id: true }
    });

    // Create lots
    const lots = [];
    for (let i = 0; i < numLots; i++) {
      lots.push({
        numero: `PERF${String(i).padStart(3, '0')}`,
        immeubleId: immeubleIds[i % immeubleIds.length].id,
        locataireId: locataireIds[i % locataireIds.length].id,
        type: 'APPARTEMENT',
        loyerMensuelAttendu: 50000 + (i * 1000), // Varying rent amounts
        statut: 'OCCUPE',
        createdBy: 'perf-test'
      });
    }
    await prismaService.lots.createMany({ data: lots });

    const setupTime = Date.now() - startTime;
    console.log(`Performance test data created in ${setupTime}ms`);

    return {
      proprietaireIds: proprietaireIds.map(p => p.id),
      immeubleIds: immeubleIds.map(i => i.id),
      locataireIds: locataireIds.map(l => l.id),
      setupTime
    };
  }

  describe('Unpaid Rent Detection Performance', () => {
    it('should detect unpaid rents for small dataset (< 100 lots) within threshold', async () => {
      await createPerformanceTestData(10, 5, 50, 80);

      const startTime = Date.now();
      
      const result = await impayesService.detecterImpayesPourMois({
        mois: '2026-02',
        page: 1,
        limit: 100
      });

      const executionTime = Date.now() - startTime;
      
      console.log(`Unpaid detection (80 lots): ${executionTime}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.UNPAID_DETECTION_SMALL);
      expect(result.data).toHaveLength(80); // All lots should be unpaid
      
      await cleanupPerformanceData();
    });

    it('should detect unpaid rents for medium dataset (< 500 lots) within threshold', async () => {
      await createPerformanceTestData(25, 15, 200, 400);

      const startTime = Date.now();
      
      const result = await impayesService.detecterImpayesPourMois({
        mois: '2026-02',
        page: 1,
        limit: 500
      });

      const executionTime = Date.now() - startTime;
      
      console.log(`Unpaid detection (400 lots): ${executionTime}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.UNPAID_DETECTION_MEDIUM);
      expect(result.data).toHaveLength(400);
      
      await cleanupPerformanceData();
    });

    it('should detect unpaid rents for large dataset (< 1000 lots) within threshold', async () => {
      await createPerformanceTestData(50, 25, 500, 800);

      const startTime = Date.now();
      
      const result = await impayesService.detecterImpayesPourMois({
        mois: '2026-02',
        page: 1,
        limit: 1000
      });

      const executionTime = Date.now() - startTime;
      
      console.log(`Unpaid detection (800 lots): ${executionTime}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.UNPAID_DETECTION_LARGE);
      expect(result.data).toHaveLength(800);
      
      await cleanupPerformanceData();
    });
  });
  describe('Statistics Calculation Performance', () => {
    it('should calculate statistics for large dataset within threshold', async () => {
      const testData = await createPerformanceTestData(30, 20, 300, 600);

      // Create some partial payments to make statistics more realistic
      const lotIds = await prismaService.lots.findMany({
        where: { createdBy: 'perf-test' },
        select: { id: true },
        take: 100
      });

      const encaissements = [];
      for (let i = 0; i < 100; i++) {
        encaissements.push({
          lotId: lotIds[i].id,
          moisConcerne: '2026-02',
          montantEncaisse: 25000 + (i * 500), // Varying partial payments
          dateEncaissement: new Date('2026-02-10'),
          modePaiement: 'CASH',
          createdBy: 'perf-test'
        });
      }
      await prismaService.encaissementsLoyers.createMany({ data: encaissements });

      const startTime = Date.now();
      
      const statistics = await impayesService.getStatistiquesImpayes();

      const executionTime = Date.now() - startTime;
      
      console.log(`Statistics calculation (600 lots): ${executionTime}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.STATISTICS_CALCULATION);
      
      expect(statistics).toMatchObject({
        totalMontantImpaye: expect.any(Number),
        nombreLotsImpayes: expect.any(Number),
        tauxImpayes: expect.any(Number),
        repartitionParImmeuble: expect.any(Array),
        evolutionMensuelle: expect.any(Array)
      });

      expect(statistics.repartitionParImmeuble.length).toBeGreaterThan(0);
      
      await cleanupPerformanceData();
    });

    it('should handle pagination efficiently for large result sets', async () => {
      await createPerformanceTestData(20, 15, 250, 500);

      // Test multiple page requests
      const pageTests = [
        { page: 1, limit: 50 },
        { page: 5, limit: 50 },
        { page: 10, limit: 50 }
      ];

      for (const pageTest of pageTests) {
        const startTime = Date.now();
        
        const result = await impayesService.detecterImpayesPourMois({
          mois: '2026-02',
          page: pageTest.page,
          limit: pageTest.limit
        });

        const executionTime = Date.now() - startTime;
        
        console.log(`Pagination (page ${pageTest.page}, limit ${pageTest.limit}): ${executionTime}ms`);
        expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGINATION_RESPONSE);
        expect(result.data.length).toBeLessThanOrEqual(pageTest.limit);
      }
      
      await cleanupPerformanceData();
    });
  });

  describe('Excel Import Performance', () => {
    function createLargeExcelFile(numRows: number): Buffer {
      const data = [['nom', 'telephone', 'email', 'adresse']];
      
      for (let i = 0; i < numRows; i++) {
        data.push([
          `Import Owner ${i}`,
          `01${String(i).padStart(8, '0')}`,
          `import${i}@test.com`,
          `${i} Import Street`
        ]);
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    it('should import small Excel file (< 100 rows) within threshold', async () => {
      const buffer = createLargeExcelFile(80);
      
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'small-import.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const startTime = Date.now();
      
      const result = await importExcelService.importProprietaires(mockFile, 'perf-test');

      const executionTime = Date.now() - startTime;
      
      console.log(`Excel import (80 rows): ${executionTime}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXCEL_IMPORT_SMALL);
      expect(result.success).toBe(true);
      expect(result.successfulRows).toBe(80);

      // Cleanup
      await prismaService.proprietaires.deleteMany({
        where: { createdBy: 'perf-test' }
      });
    });

    it('should import medium Excel file (< 500 rows) within threshold', async () => {
      const buffer = createLargeExcelFile(400);
      
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'medium-import.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const startTime = Date.now();
      
      const result = await importExcelService.importProprietaires(mockFile, 'perf-test');

      const executionTime = Date.now() - startTime;
      
      console.log(`Excel import (400 rows): ${executionTime}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXCEL_IMPORT_MEDIUM);
      expect(result.success).toBe(true);
      expect(result.successfulRows).toBe(400);

      // Cleanup
      await prismaService.proprietaires.deleteMany({
        where: { createdBy: 'perf-test' }
      });
    });

    it('should import large Excel file (< 1000 rows) within threshold', async () => {
      const buffer = createLargeExcelFile(800);
      
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'large-import.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const startTime = Date.now();
      
      const result = await importExcelService.importProprietaires(mockFile, 'perf-test');

      const executionTime = Date.now() - startTime;
      
      console.log(`Excel import (800 rows): ${executionTime}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXCEL_IMPORT_LARGE);
      expect(result.success).toBe(true);
      expect(result.successfulRows).toBe(800);

      // Verify performance metrics
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics?.avgProcessingTimePerRow).toBeLessThan(20); // < 20ms per row

      // Cleanup
      await prismaService.proprietaires.deleteMany({
        where: { createdBy: 'perf-test' }
      });
    });
  });
  describe('Query Optimization Performance', () => {
    it('should handle complex filtering queries efficiently', async () => {
      const testData = await createPerformanceTestData(20, 10, 200, 300);

      // Test various filtering scenarios
      const filterTests = [
        { immeubleId: testData.immeubleIds[0] },
        { locataireId: testData.locataireIds[0] },
        { immeubleId: testData.immeubleIds[0], mois: '2026-02' },
        { search: 'Perf' }
      ];

      for (const filters of filterTests) {
        const startTime = Date.now();
        
        const result = await impayesService.detecterImpayesPourMois({
          mois: '2026-02',
          page: 1,
          limit: 50,
          ...filters
        });

        const executionTime = Date.now() - startTime;
        
        console.log(`Filtered query (${JSON.stringify(filters)}): ${executionTime}ms`);
        expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_RESPONSE);
      }
      
      await cleanupPerformanceData();
    });

    it('should handle concurrent requests efficiently', async () => {
      await createPerformanceTestData(15, 8, 150, 200);

      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, () => {
        return impayesService.detecterImpayesPourMois({
          mois: '2026-02',
          page: 1,
          limit: 50
        });
      });

      const startTime = Date.now();
      
      const results = await Promise.all(requests);

      const totalExecutionTime = Date.now() - startTime;
      const avgExecutionTime = totalExecutionTime / concurrentRequests;
      
      console.log(`Concurrent requests (${concurrentRequests}): total ${totalExecutionTime}ms, avg ${avgExecutionTime}ms`);
      
      // Each request should complete reasonably fast even under concurrent load
      expect(avgExecutionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_RESPONSE * 2);
      
      // All requests should return the same data
      results.forEach(result => {
        expect(result.data).toHaveLength(50); // Limited by pagination
        expect(result.pagination.total).toBe(200); // Total unpaid lots
      });
      
      await cleanupPerformanceData();
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should handle large datasets without excessive memory usage', async () => {
      const initialMemory = process.memoryUsage();
      
      await createPerformanceTestData(40, 20, 400, 600);

      // Perform memory-intensive operations
      const operations = [
        () => impayesService.detecterImpayesPourMois({ mois: '2026-02', page: 1, limit: 1000 }),
        () => impayesService.getStatistiquesImpayes(),
        () => impayesService.detecterImpayesPourMois({ mois: '2026-01', page: 1, limit: 1000 }),
        () => impayesService.getStatistiquesImpayes()
      ];

      for (const operation of operations) {
        await operation();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      
      console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)} MB`);
      
      // Memory increase should be reasonable (< 100MB for this test)
      expect(memoryIncreaseMB).toBeLessThan(100);
      
      await cleanupPerformanceData();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });

    it('should clean up resources properly after operations', async () => {
      const testData = await createPerformanceTestData(10, 5, 50, 80);

      // Perform operations that create temporary resources
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await impayesService.detecterImpayesPourMois({
          mois: '2026-02',
          page: i + 1,
          limit: 20
        });
        results.push(result);
      }

      // Verify all operations completed successfully
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.data).toBeDefined();
        expect(result.pagination).toBeDefined();
      });

      await cleanupPerformanceData();
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      const numRuns = 5;
      const executionTimes: number[] = [];

      for (let run = 0; run < numRuns; run++) {
        await createPerformanceTestData(10, 5, 50, 100);

        const startTime = Date.now();
        
        await impayesService.detecterImpayesPourMois({
          mois: '2026-02',
          page: 1,
          limit: 100
        });

        const executionTime = Date.now() - startTime;
        executionTimes.push(executionTime);

        await cleanupPerformanceData();
      }

      const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / numRuns;
      const maxTime = Math.max(...executionTimes);
      const minTime = Math.min(...executionTimes);
      const variance = maxTime - minTime;

      console.log(`Performance consistency: avg ${avgTime}ms, min ${minTime}ms, max ${maxTime}ms, variance ${variance}ms`);

      // Performance should be consistent (variance < 50% of average)
      expect(variance).toBeLessThan(avgTime * 0.5);
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.UNPAID_DETECTION_SMALL);
    });

    it('should provide performance metrics for monitoring', async () => {
      await createPerformanceTestData(15, 8, 100, 150);

      const startTime = Date.now();
      
      const result = await impayesService.detecterImpayesPourMois({
        mois: '2026-02',
        page: 1,
        limit: 150
      });

      const executionTime = Date.now() - startTime;

      // Log performance metrics for monitoring
      const metrics = {
        operation: 'detecterImpayesPourMois',
        datasetSize: 150,
        executionTime,
        throughput: 150 / (executionTime / 1000), // records per second
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };

      console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));

      expect(metrics.throughput).toBeGreaterThan(50); // At least 50 records/second
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.UNPAID_DETECTION_MEDIUM);

      await cleanupPerformanceData();
    });
  });
});