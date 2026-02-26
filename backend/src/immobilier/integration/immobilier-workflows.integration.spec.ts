import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ImpayesService } from '../impayes/impayes.service';
import { AlertesService } from '../impayes/alertes.service';
import { ArrieragesService } from '../impayes/arrierages.service';
import { ImportExcelService } from '../import/import-excel.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { AuditService } from '../../audit/audit.service';
import { PaginationService } from '../../common/services/pagination.service';
import { TypeAlerte, PrioriteAlerte, StatutArrierage, ModePaiement } from '@prisma/client';
import * as XLSX from 'xlsx';

describe('Immobilier Workflows Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let impayesService: ImpayesService;
  let alertesService: AlertesService;
  let arrieragesService: ArrieragesService;
  let importExcelService: ImportExcelService;

  // Test data
  let testProprietaire: any;
  let testImmeuble: any;
  let testLocataire: any;
  let testLot: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        ImpayesService,
        AlertesService,
        ArrieragesService,
        ImportExcelService,
        ReferenceGeneratorService,
        AuditService,
        PaginationService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    impayesService = moduleFixture.get<ImpayesService>(ImpayesService);
    alertesService = moduleFixture.get<AlertesService>(AlertesService);
    arrieragesService = moduleFixture.get<ArrieragesService>(ArrieragesService);
    importExcelService = moduleFixture.get<ImportExcelService>(ImportExcelService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up alerts and arrears before each test
    await prismaService.alertes.deleteMany({
      where: { type: TypeAlerte.LOYER_IMPAYE }
    });
    await prismaService.paiementsPartielsArrierages.deleteMany();
    await prismaService.arrieragesLoyers.deleteMany();
    await prismaService.encaissementsLoyers.deleteMany();
  });

  async function setupTestData() {
    // Create test proprietaire
    testProprietaire = await prismaService.proprietaires.create({
      data: {
        nom: 'Test Owner',
        telephone: '0123456789',
        email: 'owner@test.com',
        createdBy: 'test-user'
      }
    });

    // Create test immeuble
    testImmeuble = await prismaService.immeubles.create({
      data: {
        nom: 'Test Building',
        adresse: '123 Test Street',
        reference: 'TEST-001',
        proprietaireId: testProprietaire.id,
        tauxCommissionCapco: 5,
        createdBy: 'test-user'
      }
    });

    // Create test locataire
    testLocataire = await prismaService.locataires.create({
      data: {
        nom: 'Test Tenant',
        telephone: '0987654321',
        email: 'tenant@test.com',
        createdBy: 'test-user'
      }
    });

    // Create test lot
    testLot = await prismaService.lots.create({
      data: {
        numero: 'A101',
        immeubleId: testImmeuble.id,
        locataireId: testLocataire.id,
        type: 'F3',
        loyerMensuelAttendu: 50000,
        statut: 'OCCUPE',
        createdBy: 'test-user'
      }
    });
  }

  async function cleanupTestData() {
    await prismaService.encaissementsLoyers.deleteMany();
    await prismaService.alertes.deleteMany();
    await prismaService.paiementsPartielsArrierages.deleteMany();
    await prismaService.arrieragesLoyers.deleteMany();
    await prismaService.lots.deleteMany();
    await prismaService.locataires.deleteMany();
    await prismaService.immeubles.deleteMany();
    await prismaService.proprietaires.deleteMany();
  }

  describe('Complete Unpaid Rent Detection and Alert Workflow', () => {
    it('should detect unpaid rent and generate appropriate alerts', async () => {
      // Step 1: Detect unpaid rent for current month
      const currentMonth = '2026-02';
      const impayesResult = await impayesService.detecterImpayesPourMois({
        mois: currentMonth,
        page: 1,
        limit: 20
      });

      expect(impayesResult.data).toHaveLength(1);
      expect(impayesResult.data[0]).toMatchObject({
        lotId: testLot.id,
        montantAttendu: 50000,
        montantEncaisse: 0,
        montantManquant: 50000,
        statut: 'IMPAYE'
      });

      // Step 2: Generate alert for the unpaid rent
      await impayesService.genererAlerteImpaye(testLot.id, currentMonth, 'test-user');

      // Step 3: Verify alert was created
      const alerts = await prismaService.alertes.findMany({
        where: { type: TypeAlerte.LOYER_IMPAYE }
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: TypeAlerte.LOYER_IMPAYE,
        titre: expect.stringContaining('A101'),
        description: expect.stringContaining('50 000 XOF'),
        lien: `/immobilier/lots/${testLot.id}`,
        priorite: expect.any(String),
        lu: false
      });

      // Step 4: Get statistics and verify they include our unpaid rent
      const statistics = await impayesService.getStatistiquesImpayes();

      expect(statistics).toMatchObject({
        totalMontantImpaye: 50000,
        nombreLotsImpayes: 1,
        tauxImpayes: 100, // 1 unpaid out of 1 occupied lot
        repartitionParImmeuble: expect.arrayContaining([
          expect.objectContaining({
            immeubleId: testImmeuble.id,
            immeubleNom: 'Test Building',
            montant: 50000,
            nombreLots: 1
          })
        ])
      });
    });

    it('should handle partial payments correctly', async () => {
      // Step 1: Create partial payment
      await prismaService.encaissementsLoyers.create({
        data: {
          lotId: testLot.id,
          moisConcerne: '2026-02',
          montantEncaisse: 30000,
          dateEncaissement: new Date('2026-02-10'),
          modePaiement: 'CASH',
          createdBy: 'test-user'
        }
      });

      // Step 2: Detect unpaid rent
      const impayesResult = await impayesService.detecterImpayesPourMois({
        mois: '2026-02',
        page: 1,
        limit: 20
      });

      expect(impayesResult.data).toHaveLength(1);
      expect(impayesResult.data[0]).toMatchObject({
        montantAttendu: 50000,
        montantEncaisse: 30000,
        montantManquant: 20000,
        statut: 'PARTIEL'
      });

      // Step 3: Generate alert for partial payment
      await impayesService.genererAlerteImpaye(testLot.id, '2026-02', 'test-user');

      // Step 4: Verify alert reflects partial payment
      const alerts = await prismaService.alertes.findMany({
        where: { type: TypeAlerte.LOYER_IMPAYE }
      });

      expect(alerts[0].description).toContain('20 000 XOF');
    });

    it('should not create duplicate alerts for same lot and month', async () => {
      // Step 1: Generate first alert
      await impayesService.genererAlerteImpaye(testLot.id, '2026-02', 'test-user');

      // Step 2: Try to generate second alert for same lot and month
      await impayesService.genererAlerteImpaye(testLot.id, '2026-02', 'test-user');

      // Step 3: Verify only one alert exists
      const alerts = await prismaService.alertes.findMany({
        where: { type: TypeAlerte.LOYER_IMPAYE }
      });

      expect(alerts).toHaveLength(1);
    });
  });

  describe('Complete Arrears Management Workflow', () => {
    it('should create arrears, register partial payments, and track to completion', async () => {
      // Step 1: Create arrears for historical debt
      const createArrierageDto = {
        lotId: testLot.id,
        periodeDebut: '2025-01-01',
        periodeFin: '2025-03-31',
        montantDu: 150000,
        description: 'Q1 2025 arrears'
      };

      const arrierage = await arrieragesService.create(createArrierageDto, 'test-user');

      expect(arrierage).toMatchObject({
        lotId: testLot.id,
        montantDu: 150000,
        montantPaye: 0,
        montantRestant: 150000,
        statut: StatutArrierage.EN_COURS
      });

      // Step 2: Register first partial payment
      const firstPayment = {
        date: '2026-01-15',
        montant: 50000,
        mode: ModePaiement.CASH,
        reference: 'PAY-001',
        commentaire: 'First partial payment'
      };

      const updatedArrierage1 = await arrieragesService.enregistrerPaiementPartiel(
        arrierage.id,
        firstPayment,
        'test-user'
      );

      expect(updatedArrierage1).toMatchObject({
        montantPaye: 50000,
        montantRestant: 100000,
        statut: StatutArrierage.EN_COURS
      });

      expect(updatedArrierage1.paiementsPartiels).toHaveLength(1);
      expect(updatedArrierage1.paiementsPartiels[0]).toMatchObject({
        montant: 50000,
        mode: ModePaiement.CASH,
        reference: 'PAY-001'
      });

      // Step 3: Register second partial payment
      const secondPayment = {
        date: '2026-02-15',
        montant: 75000,
        mode: ModePaiement.CHEQUE,
        reference: 'CHQ-123456'
      };

      const updatedArrierage2 = await arrieragesService.enregistrerPaiementPartiel(
        arrierage.id,
        secondPayment,
        'test-user'
      );

      expect(updatedArrierage2).toMatchObject({
        montantPaye: 125000,
        montantRestant: 25000,
        statut: StatutArrierage.EN_COURS
      });

      // Step 4: Register final payment to complete arrears
      const finalPayment = {
        date: '2026-03-15',
        montant: 25000,
        mode: ModePaiement.VIREMENT,
        reference: 'VIR-789'
      };

      const completedArrierage = await arrieragesService.enregistrerPaiementPartiel(
        arrierage.id,
        finalPayment,
        'test-user'
      );

      expect(completedArrierage).toMatchObject({
        montantPaye: 150000,
        montantRestant: 0,
        statut: StatutArrierage.SOLDE
      });

      expect(completedArrierage.paiementsPartiels).toHaveLength(3);

      // Step 5: Verify statistics reflect completed arrears
      const statistics = await arrieragesService.getStatistiquesArrierages();

      expect(statistics).toMatchObject({
        totalMontantArrierage: 0, // No remaining arrears
        nombreArrieragesEnCours: 0,
        nombreArrieragesSoldes: 1,
        totalMontantPaye: 150000
      });

      // Step 6: Verify recovery rate is 100%
      const recoveryRate = await arrieragesService.calculerTauxRecouvrement();
      expect(recoveryRate).toBe(100);
    });

    it('should prevent overpayment of arrears', async () => {
      // Step 1: Create arrears
      const createArrierageDto = {
        lotId: testLot.id,
        periodeDebut: '2025-01-01',
        periodeFin: '2025-01-31',
        montantDu: 50000
      };

      const arrierage = await arrieragesService.create(createArrierageDto, 'test-user');

      // Step 2: Try to pay more than remaining amount
      const overpayment = {
        date: '2026-01-15',
        montant: 75000, // More than the 50000 due
        mode: ModePaiement.CASH
      };

      await expect(
        arrieragesService.enregistrerPaiementPartiel(arrierage.id, overpayment, 'test-user')
      ).rejects.toThrow('ne peut pas dépasser le montant restant');
    });

    it('should prevent payments on already settled arrears', async () => {
      // Step 1: Create and fully pay arrears
      const createArrierageDto = {
        lotId: testLot.id,
        periodeDebut: '2025-01-01',
        periodeFin: '2025-01-31',
        montantDu: 50000
      };

      const arrierage = await arrieragesService.create(createArrierageDto, 'test-user');

      const fullPayment = {
        date: '2026-01-15',
        montant: 50000,
        mode: ModePaiement.CASH
      };

      await arrieragesService.enregistrerPaiementPartiel(arrierage.id, fullPayment, 'test-user');

      // Step 2: Try to add another payment to settled arrears
      const additionalPayment = {
        date: '2026-01-20',
        montant: 10000,
        mode: ModePaiement.CASH
      };

      await expect(
        arrieragesService.enregistrerPaiementPartiel(arrierage.id, additionalPayment, 'test-user')
      ).rejects.toThrow('arriéré déjà soldé');
    });
  });

  describe('Complete Excel Import Workflow', () => {
    it('should import proprietaires with full validation and audit trail', async () => {
      // Step 1: Create Excel file with test data
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['nom', 'telephone', 'email', 'adresse'],
        ['Import Owner 1', '0111111111', 'owner1@import.com', '111 Import St'],
        ['Import Owner 2', '0222222222', 'owner2@import.com', '222 Import Ave'],
        ['', '0333333333', 'invalid-email', '333 Invalid St'], // Invalid row
        ['Import Owner 3', '0444444444', 'owner3@import.com', '444 Import Blvd']
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'proprietaires-import.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      // Step 2: Import proprietaires
      const result = await importExcelService.importProprietaires(mockFile, 'test-user');

      // Step 3: Verify import results
      expect(result.success).toBe(false); // Due to validation errors
      expect(result.totalRows).toBe(4);
      expect(result.successfulRows).toBe(3); // 3 valid rows
      expect(result.failedRows).toBe(1); // 1 invalid row
      expect(result.errors.length).toBeGreaterThan(0);

      // Step 4: Verify proprietaires were created in database
      const importedProprietaires = await prismaService.proprietaires.findMany({
        where: {
          nom: {
            startsWith: 'Import Owner'
          }
        }
      });

      expect(importedProprietaires).toHaveLength(3);
      expect(importedProprietaires.map(p => p.nom)).toEqual(
        expect.arrayContaining([
          'Import Owner 1',
          'Import Owner 2',
          'Import Owner 3'
        ])
      );

      // Step 5: Verify audit logs were created
      // Note: In a real integration test, we would verify audit logs
      // Here we just ensure the audit service was called
      expect(result.auditInfo).toBeDefined();
      expect(result.auditInfo?.fileName).toBe('proprietaires-import.xlsx');

      // Cleanup
      await prismaService.proprietaires.deleteMany({
        where: {
          nom: {
            startsWith: 'Import Owner'
          }
        }
      });
    });

    it('should handle duplicate detection during import', async () => {
      // Step 1: Create existing proprietaire
      const existingProprietaire = await prismaService.proprietaires.create({
        data: {
          nom: 'Existing Owner',
          telephone: '0555555555',
          email: 'existing@test.com',
          createdBy: 'test-user'
        }
      });

      // Step 2: Create Excel file with duplicate
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['nom', 'telephone', 'email'],
        ['New Owner', '0666666666', 'new@test.com'],
        ['Existing Owner', '0555555555', 'existing@test.com'] // Duplicate
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'duplicates.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer: buffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      // Step 3: Import with duplicates
      const result = await importExcelService.importProprietaires(mockFile, 'test-user');

      // Step 4: Verify duplicate handling
      expect(result.successfulRows).toBe(1); // Only new owner
      expect(result.failedRows).toBe(1); // Duplicate rejected
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('WARNING');
      expect(result.errors[0].error).toContain('déjà existant');

      // Cleanup
      await prismaService.proprietaires.deleteMany({
        where: {
          OR: [
            { nom: 'New Owner' },
            { id: existingProprietaire.id }
          ]
        }
      });
    });
  });

  describe('Complex Statistics and Reporting Workflow', () => {
    it('should generate comprehensive statistics across multiple buildings and tenants', async () => {
      // Step 1: Create additional test data
      const secondImmeuble = await prismaService.immeubles.create({
        data: {
          nom: 'Second Building',
          adresse: '456 Second Street',
          reference: 'TEST-002',
          proprietaireId: testProprietaire.id,
          tauxCommissionCapco: 4,
          createdBy: 'test-user'
        }
      });

      const secondLocataire = await prismaService.locataires.create({
        data: {
          nom: 'Second Tenant',
          telephone: '0111222333',
          email: 'second@test.com',
          createdBy: 'test-user'
        }
      });

      const secondLot = await prismaService.lots.create({
        data: {
          numero: 'B201',
          immeubleId: secondImmeuble.id,
          locataireId: secondLocataire.id,
          type: 'STUDIO',
          loyerMensuelAttendu: 30000,
          statut: 'OCCUPE',
          createdBy: 'test-user'
        }
      });

      // Step 2: Create mixed payment scenarios
      // First lot: partial payment
      await prismaService.encaissementsLoyers.create({
        data: {
          lotId: testLot.id,
          moisConcerne: '2026-02',
          montantEncaisse: 25000,
          dateEncaissement: new Date('2026-02-10'),
          modePaiement: 'CASH',
          createdBy: 'test-user'
        }
      });

      // Second lot: no payment (full unpaid)
      // No encaissement record = full unpaid

      // Step 3: Create arrears for both lots
      await arrieragesService.create({
        lotId: testLot.id,
        periodeDebut: '2025-10-01',
        periodeFin: '2025-12-31',
        montantDu: 150000,
        description: 'Q4 2025 arrears - Lot A101'
      }, 'test-user');

      await arrieragesService.create({
        lotId: secondLot.id,
        periodeDebut: '2025-11-01',
        periodeFin: '2025-12-31',
        montantDu: 60000,
        description: 'Nov-Dec 2025 arrears - Lot B201'
      }, 'test-user');

      // Step 4: Get comprehensive unpaid rent statistics
      const impayesStats = await impayesService.getStatistiquesImpayes();

      expect(impayesStats).toMatchObject({
        totalMontantImpaye: 55000, // 25000 (testLot) + 30000 (secondLot)
        nombreLotsImpayes: 2,
        tauxImpayes: 100, // 2 unpaid out of 2 occupied lots
        repartitionParImmeuble: expect.arrayContaining([
          expect.objectContaining({
            immeubleNom: 'Test Building',
            montant: 25000,
            nombreLots: 1
          }),
          expect.objectContaining({
            immeubleNom: 'Second Building',
            montant: 30000,
            nombreLots: 1
          })
        ])
      });

      // Step 5: Get comprehensive arrears statistics
      const arrieragesStats = await arrieragesService.getStatistiquesArrierages();

      expect(arrieragesStats).toMatchObject({
        totalMontantArrierage: 210000, // 150000 + 60000
        nombreArrieragesEnCours: 2,
        nombreArrieragesSoldes: 0,
        totalMontantPaye: 0
      });

      // Step 6: Get arrears breakdown by tenant
      const repartitionParLocataire = await arrieragesService.getRepartitionParLocataire();

      expect(repartitionParLocataire).toHaveLength(2);
      expect(repartitionParLocataire).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            locataireNom: 'Test Tenant',
            montantTotal: 150000,
            nombreArrierages: 1
          }),
          expect.objectContaining({
            locataireNom: 'Second Tenant',
            montantTotal: 60000,
            nombreArrierages: 1
          })
        ])
      );

      // Cleanup additional test data
      await prismaService.lots.delete({ where: { id: secondLot.id } });
      await prismaService.locataires.delete({ where: { id: secondLocataire.id } });
      await prismaService.immeubles.delete({ where: { id: secondImmeuble.id } });
    });
  });

  describe('Alert Priority and Escalation Workflow', () => {
    it('should generate alerts with correct priorities based on days late', async () => {
      // Mock different dates to simulate different delay scenarios
      const originalDate = Date.now;

      try {
        // Test BASSE priority (< 30 days)
        Date.now = jest.fn(() => new Date('2026-02-20').getTime()); // 15 days late
        await impayesService.genererAlerteImpaye(testLot.id, '2026-02', 'test-user');

        let alerts = await prismaService.alertes.findMany({
          where: { type: TypeAlerte.LOYER_IMPAYE }
        });

        expect(alerts[0].priorite).toBe(PrioriteAlerte.BASSE);

        // Clear alerts
        await prismaService.alertes.deleteMany({
          where: { type: TypeAlerte.LOYER_IMPAYE }
        });

        // Test MOYENNE priority (30-59 days)
        Date.now = jest.fn(() => new Date('2026-03-10').getTime()); // 33 days late
        await impayesService.genererAlerteImpaye(testLot.id, '2026-02', 'test-user');

        alerts = await prismaService.alertes.findMany({
          where: { type: TypeAlerte.LOYER_IMPAYE }
        });

        expect(alerts[0].priorite).toBe(PrioriteAlerte.MOYENNE);

        // Clear alerts
        await prismaService.alertes.deleteMany({
          where: { type: TypeAlerte.LOYER_IMPAYE }
        });

        // Test HAUTE priority (60+ days)
        Date.now = jest.fn(() => new Date('2026-04-10').getTime()); // 64 days late
        await impayesService.genererAlerteImpaye(testLot.id, '2026-02', 'test-user');

        alerts = await prismaService.alertes.findMany({
          where: { type: TypeAlerte.LOYER_IMPAYE }
        });

        expect(alerts[0].priorite).toBe(PrioriteAlerte.HAUTE);

      } finally {
        // Restore original Date.now
        Date.now = originalDate;
      }
    });
  });
});