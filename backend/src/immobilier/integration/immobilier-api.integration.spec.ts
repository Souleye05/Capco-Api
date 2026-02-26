import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../common/services/prisma.service';
import { ImmobilierModule } from '../immobilier.module';
import { CommonModule } from '../../common/common.module';
import { AuditModule } from '../../audit/audit.module';
import { TypeAlerte, StatutArrierage, ModePaiement } from '@prisma/client';
import * as XLSX from 'xlsx';

describe('Immobilier API Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test data
  let testProprietaire: any;
  let testImmeuble: any;
  let testLocataire: any;
  let testLot: any;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CommonModule,
        AuditModule,
        ImmobilierModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Setup test data and auth
    await setupTestData();
    authToken = 'Bearer test-token'; // In real tests, this would be a valid JWT
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up dynamic data before each test
    await prismaService.alertes.deleteMany({
      where: { type: TypeAlerte.LOYER_IMPAYE }
    });
    await prismaService.paiementsPartielsArrierages.deleteMany();
    await prismaService.arrieragesLoyers.deleteMany();
    await prismaService.encaissementsLoyers.deleteMany();
  });

  async function setupTestData() {
    testProprietaire = await prismaService.proprietaires.create({
      data: {
        nom: 'API Test Owner',
        telephone: '0123456789',
        email: 'apiowner@test.com',
        createdBy: 'test-user'
      }
    });

    testImmeuble = await prismaService.immeubles.create({
      data: {
        nom: 'API Test Building',
        adresse: '123 API Street',
        reference: 'API-001',
        proprietaireId: testProprietaire.id,
        tauxCommissionCapco: 5,
        createdBy: 'test-user'
      }
    });

    testLocataire = await prismaService.locataires.create({
      data: {
        nom: 'API Test Tenant',
        telephone: '0987654321',
        email: 'apitenant@test.com',
        createdBy: 'test-user'
      }
    });

    testLot = await prismaService.lots.create({
      data: {
        numero: 'API101',
        immeubleId: testImmeuble.id,
        locataireId: testLocataire.id,
        type: 'F3',
        loyerMensuelAttendu: 75000,
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

  describe('Unpaid Rent API Workflow', () => {
    it('GET /immobilier/impayes - should return unpaid rents with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/immobilier/impayes')
        .query({
          mois: '2026-02',
          page: 1,
          limit: 20
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            lotId: testLot.id,
            lotNumero: 'API101',
            immeubleNom: 'API Test Building',
            locataireNom: 'API Test Tenant',
            montantAttendu: 75000,
            montantEncaisse: 0,
            montantManquant: 75000,
            statut: 'IMPAYE'
          })
        ]),
        pagination: expect.objectContaining({
          total: expect.any(Number),
          page: 1,
          limit: 20
        })
      });
    });

    it('GET /immobilier/impayes/statistics - should return comprehensive statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/immobilier/impayes/statistics')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        totalMontantImpaye: 75000,
        nombreLotsImpayes: 1,
        tauxImpayes: 100,
        repartitionParImmeuble: expect.arrayContaining([
          expect.objectContaining({
            immeubleId: testImmeuble.id,
            immeubleNom: 'API Test Building',
            montant: 75000,
            nombreLots: 1
          })
        ]),
        evolutionMensuelle: expect.any(Array)
      });
    });

    it('POST /immobilier/impayes/alerts/:lotId/:mois - should generate alert', async () => {
      const response = await request(app.getHttpServer())
        .post(`/immobilier/impayes/alerts/${testLot.id}/2026-02`)
        .set('Authorization', authToken)
        .expect(201);

      // Verify alert was created
      const alerts = await prismaService.alertes.findMany({
        where: { type: TypeAlerte.LOYER_IMPAYE }
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: TypeAlerte.LOYER_IMPAYE,
        titre: expect.stringContaining('API Test Building'),
        description: expect.stringContaining('API Test Tenant')
      });
    });

    it('GET /immobilier/impayes with filters - should filter by immeuble', async () => {
      const response = await request(app.getHttpServer())
        .get('/immobilier/impayes')
        .query({
          mois: '2026-02',
          immeubleId: testImmeuble.id,
          page: 1,
          limit: 20
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].immeubleId).toBe(testImmeuble.id);
    });

    it('should handle partial payments correctly in API', async () => {
      // Create partial payment
      await prismaService.encaissementsLoyers.create({
        data: {
          lotId: testLot.id,
          moisConcerne: '2026-02',
          montantEncaisse: 45000,
          dateEncaissement: new Date('2026-02-10'),
          modePaiement: 'CASH',
          createdBy: 'test-user'
        }
      });

      const response = await request(app.getHttpServer())
        .get('/immobilier/impayes')
        .query({ mois: '2026-02' })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data[0]).toMatchObject({
        montantAttendu: 75000,
        montantEncaisse: 45000,
        montantManquant: 30000,
        statut: 'PARTIEL'
      });
    });
  });

  describe('Arrears Management API Workflow', () => {
    it('POST /immobilier/arrierages - should create new arrears', async () => {
      const createDto = {
        lotId: testLot.id,
        periodeDebut: '2025-01-01',
        periodeFin: '2025-03-31',
        montantDu: 225000,
        description: 'Q1 2025 arrears via API'
      };

      const response = await request(app.getHttpServer())
        .post('/immobilier/arrierages')
        .send(createDto)
        .set('Authorization', authToken)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        lotId: testLot.id,
        lotNumero: 'API101',
        immeubleNom: 'API Test Building',
        locataireNom: 'API Test Tenant',
        montantDu: 225000,
        montantPaye: 0,
        montantRestant: 225000,
        statut: StatutArrierage.EN_COURS,
        description: 'Q1 2025 arrears via API',
        paiementsPartiels: []
      });
    });

    it('GET /immobilier/arrierages - should return paginated arrears', async () => {
      // Create test arrears
      const arrierage = await prismaService.arrieragesLoyers.create({
        data: {
          lotId: testLot.id,
          periodeDebut: new Date('2025-01-01'),
          periodeFin: new Date('2025-03-31'),
          montantDu: 225000,
          montantPaye: 0,
          montantRestant: 225000,
          statut: StatutArrierage.EN_COURS,
          description: 'Test arrears',
          createdBy: 'test-user'
        }
      });

      const response = await request(app.getHttpServer())
        .get('/immobilier/arrierages')
        .query({ page: 1, limit: 20 })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: arrierage.id,
            lotId: testLot.id,
            montantDu: 225000,
            statut: StatutArrierage.EN_COURS
          })
        ]),
        pagination: expect.objectContaining({
          total: expect.any(Number),
          page: 1,
          limit: 20
        })
      });
    });

    it('POST /immobilier/arrierages/:id/paiements - should register partial payment', async () => {
      // Create test arrears
      const arrierage = await prismaService.arrieragesLoyers.create({
        data: {
          lotId: testLot.id,
          periodeDebut: new Date('2025-01-01'),
          periodeFin: new Date('2025-03-31'),
          montantDu: 225000,
          montantPaye: 0,
          montantRestant: 225000,
          statut: StatutArrierage.EN_COURS,
          createdBy: 'test-user'
        }
      });

      const paiementDto = {
        date: '2026-01-15',
        montant: 75000,
        mode: ModePaiement.CASH,
        reference: 'API-PAY-001',
        commentaire: 'API partial payment'
      };

      const response = await request(app.getHttpServer())
        .post(`/immobilier/arrierages/${arrierage.id}/paiements`)
        .send(paiementDto)
        .set('Authorization', authToken)
        .expect(201);

      expect(response.body).toMatchObject({
        id: arrierage.id,
        montantPaye: 75000,
        montantRestant: 150000,
        statut: StatutArrierage.EN_COURS,
        paiementsPartiels: expect.arrayContaining([
          expect.objectContaining({
            montant: 75000,
            mode: ModePaiement.CASH,
            reference: 'API-PAY-001',
            commentaire: 'API partial payment'
          })
        ])
      });
    });

    it('GET /immobilier/arrierages/statistics - should return arrears statistics', async () => {
      // Create test arrears
      await prismaService.arrieragesLoyers.create({
        data: {
          lotId: testLot.id,
          periodeDebut: new Date('2025-01-01'),
          periodeFin: new Date('2025-03-31'),
          montantDu: 225000,
          montantPaye: 75000,
          montantRestant: 150000,
          statut: StatutArrierage.EN_COURS,
          createdBy: 'test-user'
        }
      });

      const response = await request(app.getHttpServer())
        .get('/immobilier/arrierages/statistics')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        totalMontantArrierage: 150000,
        nombreArrieragesEnCours: 1,
        nombreArrieragesSoldes: 0,
        totalMontantPaye: 75000,
        repartitionParImmeuble: expect.any(Array),
        ancienneteMoyenne: expect.any(Number)
      });
    });

    it('should handle validation errors in arrears creation', async () => {
      const invalidDto = {
        lotId: 'invalid-uuid',
        periodeDebut: '2025-03-31', // After end date
        periodeFin: '2025-01-01',
        montantDu: -1000 // Negative amount
      };

      const response = await request(app.getHttpServer())
        .post('/immobilier/arrierages')
        .send(invalidDto)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.any(String)
      });
    });
  });

  describe('Excel Import API Workflow', () => {
    it('POST /immobilier/import/proprietaires - should import proprietaires from Excel', async () => {
      // Create Excel file
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['nom', 'telephone', 'email', 'adresse'],
        ['API Import Owner 1', '0111111111', 'apiimport1@test.com', '111 API St'],
        ['API Import Owner 2', '0222222222', 'apiimport2@test.com', '222 API Ave']
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const response = await request(app.getHttpServer())
        .post('/immobilier/import/proprietaires')
        .attach('file', buffer, 'proprietaires.xlsx')
        .set('Authorization', authToken)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        totalRows: 2,
        successfulRows: 2,
        failedRows: 0,
        errors: [],
        summary: expect.stringContaining('2/2 lignes traitées avec succès'),
        processingTimeMs: expect.any(Number),
        importId: expect.any(String)
      });

      // Verify proprietaires were created
      const importedProprietaires = await prismaService.proprietaires.findMany({
        where: {
          nom: {
            startsWith: 'API Import Owner'
          }
        }
      });

      expect(importedProprietaires).toHaveLength(2);

      // Cleanup
      await prismaService.proprietaires.deleteMany({
        where: {
          nom: {
            startsWith: 'API Import Owner'
          }
        }
      });
    });

    it('GET /immobilier/import/templates/:entityType - should download Excel template', async () => {
      const response = await request(app.getHttpServer())
        .get('/immobilier/import/templates/proprietaires')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.body).toBeInstanceOf(Buffer);

      // Verify template content
      const workbook = XLSX.read(response.body, { type: 'buffer' });
      const worksheet = workbook.Sheets['Données'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      expect(data[0]).toEqual(['nom', 'telephone', 'email', 'adresse']);
      expect(data[1]).toEqual(['Dupont Jean', '0123456789', 'jean.dupont@email.com', '123 Rue de la Paix, 75001 Paris']);
    });

    it('POST /immobilier/import/validate/:entityType - should validate import data', async () => {
      // Create Excel file with validation errors
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['nom', 'telephone', 'email'],
        ['Valid Owner', '0123456789', 'valid@test.com'],
        ['', '0987654321', 'invalid-email'] // Invalid row
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const response = await request(app.getHttpServer())
        .post('/immobilier/import/validate/proprietaires')
        .attach('file', buffer, 'validation.xlsx')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        isValid: false,
        totalRows: 2,
        validRows: 1,
        invalidRows: 1,
        errors: expect.arrayContaining([
          expect.objectContaining({
            row: 3,
            field: expect.any(String),
            error: expect.any(String),
            severity: expect.any(String)
          })
        ])
      });
    });

    it('should handle file upload errors gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/immobilier/import/proprietaires')
        .send({ invalidData: 'not a file' })
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.any(String)
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid UUIDs gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/immobilier/impayes')
        .query({
          mois: '2026-02',
          immeubleId: 'invalid-uuid'
        })
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('UUID')
      });
    });

    it('should handle invalid date formats', async () => {
      const response = await request(app.getHttpServer())
        .get('/immobilier/impayes')
        .query({
          mois: 'invalid-date'
        })
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('format')
      });
    });

    it('should handle non-existent resources', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app.getHttpServer())
        .get(`/immobilier/arrierages/${nonExistentId}`)
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('non trouvé')
      });
    });

    it('should handle pagination edge cases', async () => {
      // Test with very large page number
      const response = await request(app.getHttpServer())
        .get('/immobilier/impayes')
        .query({
          mois: '2026-02',
          page: 999999,
          limit: 20
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.page).toBe(999999);
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get('/immobilier/impayes/statistics')
          .set('Authorization', authToken)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          totalMontantImpaye: expect.any(Number),
          nombreLotsImpayes: expect.any(Number),
          tauxImpayes: expect.any(Number)
        });
      });
    });

    it('should handle large result sets with proper pagination', async () => {
      // This test would be more meaningful with a larger dataset
      // Here we just verify the pagination structure is correct
      const response = await request(app.getHttpServer())
        .get('/immobilier/impayes')
        .query({
          mois: '2026-02',
          page: 1,
          limit: 1
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: false
      });
    });
  });
});