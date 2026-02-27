import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import * as fc from 'fast-check';
import { ConseilModule } from './conseil.module';
import { PrismaService } from '../common/services/prisma.service';
import { ReferenceGeneratorService } from '../common/services/reference-generator.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from '../common/filters/prisma-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { AppRole } from '../types/prisma-enums';

/**
 * Property-Based Tests for Conseil Module
 * **Property 11: Cohérence des réponses API (API Response Consistency)**
 * **Validates: Requirements 5.6**
 * 
 * Optimisations appliquées:
 * - Correction des types d'enum pour les DTOs
 * - Amélioration des mocks avec types stricts
 * - Validation des structures de réponse cohérentes
 */
describe('Conseil Module - Property-Based Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let referenceGeneratorService: ReferenceGeneratorService;
  let authToken: string;

  // Mock services
  const mockPrismaService = {
    clientsConseil: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    tachesConseil: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    facturesConseil: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    paiementsConseil: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };
  const mockReferenceGeneratorService = {
    generateClientConseilReference: jest.fn().mockResolvedValue('CLI-CONS-001'),
    generateFactureReference: jest.fn().mockResolvedValue('FACT-001'),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConseilModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(ReferenceGeneratorService)
      .useValue(mockReferenceGeneratorService)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideInterceptor(AuditLogInterceptor)
      .useValue({
        intercept: jest.fn((context, next) => next.handle()),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'NODE_ENV') return 'test';
          return undefined;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global pipes and filters
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    app.useGlobalFilters(
      new AllExceptionsFilter(app.get(ConfigService)),
      new PrismaExceptionFilter()
    );

    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    referenceGeneratorService = moduleFixture.get<ReferenceGeneratorService>(ReferenceGeneratorService);
    
    // Mock auth token
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Property 11.1: Consistent JSON Response Structure', () => {
    /**
     * Property: All endpoints should return responses with consistent JSON structure
     * including proper status codes, content-type headers, and response format
     */
    it('should return consistent JSON structure for all successful operations', async () => {
      const endpointGenerator = fc.oneof(
        // Clients Conseil endpoints
        fc.record({
          method: fc.constant('GET'),
          path: fc.constant('/conseil/clients'),
          expectedStatus: fc.constant(HttpStatus.OK),
          mockResponse: fc.constant({
            data: [],
            meta: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          }),
        }),
        fc.record({
          method: fc.constant('POST'),
          path: fc.constant('/conseil/clients'),
          expectedStatus: fc.constant(HttpStatus.CREATED),
          body: fc.record({
            nom: fc.string({ minLength: 2, maxLength: 50 }),
            email: fc.emailAddress(),
            telephone: fc.string({ minLength: 10, maxLength: 15 }),
            adresse: fc.string({ minLength: 5, maxLength: 100 }),
            honoraireMensuel: fc.float({ min: 100, max: 10000 }),
            // Correction des enums pour correspondre aux DTOs
            statut: fc.constantFrom('ACTIF', 'SUSPENDU', 'RESILIE'),
            type: fc.constantFrom('physique', 'morale'),
          }),
          mockResponse: fc.record({
            id: fc.uuid(),
            reference: fc.constant('CLI-CONS-001'),
            nom: fc.string({ minLength: 2, maxLength: 50 }),
            email: fc.emailAddress(),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString()),
          }),
        }),
        // Tâches Conseil endpoints
        fc.record({
          method: fc.constant('GET'),
          path: fc.constant('/conseil/taches'),
          expectedStatus: fc.constant(HttpStatus.OK),
          mockResponse: fc.constant({
            data: [],
            meta: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          }),
        }),
        // Factures Conseil endpoints
        fc.record({
          method: fc.constant('GET'),
          path: fc.constant('/conseil/factures'),
          expectedStatus: fc.constant(HttpStatus.OK),
          mockResponse: fc.constant({
            data: [],
            meta: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          }),
        }),
        // Paiements Conseil endpoints
        fc.record({
          method: fc.constant('GET'),
          path: fc.constant('/conseil/paiements'),
          expectedStatus: fc.constant(HttpStatus.OK),
          mockResponse: fc.constant({
            data: [],
            meta: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          }),
        })
      );
      await fc.assert(
        fc.asyncProperty(
          endpointGenerator,
          async (endpoint) => {
            // Feature: nestjs-api-architecture, Property 11: API Response Consistency
            
            // Setup mocks based on endpoint
            if (endpoint.path === '/conseil/clients') {
              if (endpoint.method === 'GET') {
                mockPrismaService.clientsConseil.findMany.mockResolvedValue([]);
                mockPrismaService.clientsConseil.count.mockResolvedValue(0);
              } else if (endpoint.method === 'POST') {
                mockPrismaService.clientsConseil.create.mockResolvedValue(endpoint.mockResponse);
              }
            } else if (endpoint.path === '/conseil/taches') {
              mockPrismaService.tachesConseil.findMany.mockResolvedValue([]);
              mockPrismaService.tachesConseil.count.mockResolvedValue(0);
            } else if (endpoint.path === '/conseil/factures') {
              mockPrismaService.facturesConseil.findMany.mockResolvedValue([]);
              mockPrismaService.facturesConseil.count.mockResolvedValue(0);
            } else if (endpoint.path === '/conseil/paiements') {
              mockPrismaService.paiementsConseil.findMany.mockResolvedValue([]);
              mockPrismaService.paiementsConseil.count.mockResolvedValue(0);
            }

            // Make request
            let response;
            if (endpoint.method === 'GET') {
              response = await request(app.getHttpServer())
                .get(endpoint.path)
                .set('Authorization', authToken)
                .expect(endpoint.expectedStatus);
            } else if (endpoint.method === 'POST') {
              response = await request(app.getHttpServer())
                .post(endpoint.path)
                .set('Authorization', authToken)
                .send(endpoint.body)
                .expect(endpoint.expectedStatus);
            }

            // Verify response structure consistency
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeDefined();
            expect(typeof response.body).toBe('object');

            // Verify status code consistency
            expect(response.status).toBe(endpoint.expectedStatus);
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(300);

            // For paginated responses (GET endpoints)
            if (endpoint.method === 'GET' && (endpoint.path as string).includes('/conseil/') && 
                !(endpoint.path as string).includes('/dashboard') && !(endpoint.path as string).includes('/health')) {
              expect(response.body).toHaveProperty('data');
              expect(response.body).toHaveProperty('meta');
              expect(response.body.meta).toHaveProperty('total');
              expect(response.body.meta).toHaveProperty('page');
              expect(response.body.meta).toHaveProperty('limit');
              expect(response.body.meta).toHaveProperty('totalPages');
              expect(response.body.meta).toHaveProperty('hasNext');
              expect(response.body.meta).toHaveProperty('hasPrev');
              expect(Array.isArray(response.body.data)).toBe(true);
            }

            // For creation responses (POST endpoints)
            if (endpoint.method === 'POST') {
              expect(response.body).toHaveProperty('id');
              expect(response.body).toHaveProperty('createdAt');
              expect(response.body).toHaveProperty('updatedAt');
              expect(typeof response.body.id).toBe('string');
              expect(typeof response.body.createdAt).toBe('string');
              expect(typeof response.body.updatedAt).toBe('string');
            }
          }
        ),
        { numRuns: 100, timeout: 15000 }
      );
    }, 20000);
  });
  describe('Property 11.2: HTTP Status Code Consistency', () => {
    /**
     * Property: All endpoints should return appropriate HTTP status codes
     * based on the operation type and outcome
     */
    it('should return consistent HTTP status codes for different operation types', async () => {
      const operationGenerator = fc.oneof(
        // Successful operations
        fc.record({
          type: fc.constant('success'),
          operation: fc.constantFrom('GET', 'POST', 'PATCH', 'DELETE'),
          endpoint: fc.constantFrom(
            '/conseil/clients',
            '/conseil/taches',
            '/conseil/factures',
            '/conseil/paiements'
          ),
          expectedStatusRange: fc.record({
            min: fc.constant(200),
            max: fc.constant(299),
          }),
        }),
        // Client errors
        fc.record({
          type: fc.constant('client_error'),
          operation: fc.constantFrom('POST', 'PATCH'),
          endpoint: fc.constantFrom('/conseil/clients', '/conseil/taches'),
          invalidData: fc.record({
            nom: fc.option(fc.string({ maxLength: 1 })), // Too short
            email: fc.option(fc.string({ minLength: 1, maxLength: 10 })), // Invalid email
            telephone: fc.option(fc.string({ maxLength: 5 })), // Too short
          }),
          expectedStatusRange: fc.record({
            min: fc.constant(400),
            max: fc.constant(499),
          }),
        }),
        // Not found errors
        fc.record({
          type: fc.constant('not_found'),
          operation: fc.constantFrom('GET', 'PATCH', 'DELETE'),
          endpoint: fc.constantFrom(
            '/conseil/clients/00000000-0000-0000-0000-000000000000',
            '/conseil/taches/00000000-0000-0000-0000-000000000000'
          ),
          expectedStatus: fc.constant(HttpStatus.NOT_FOUND),
        })
      );

      await fc.assert(
        fc.asyncProperty(
          operationGenerator,
          async (testCase) => {
            // Feature: nestjs-api-architecture, Property 11: HTTP Status Code Consistency

            let response;
            
            if (testCase.type === 'success') {
              // Setup successful mocks
              const mockData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                reference: 'CLI-CONS-001',
                nom: 'Test Client',
                email: 'test@example.com',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              if (testCase.endpoint.includes('clients')) {
                mockPrismaService.clientsConseil.findMany.mockResolvedValue([]);
                mockPrismaService.clientsConseil.count.mockResolvedValue(0);
                mockPrismaService.clientsConseil.create.mockResolvedValue(mockData);
                mockPrismaService.clientsConseil.update.mockResolvedValue(mockData);
                mockPrismaService.clientsConseil.delete.mockResolvedValue(mockData);
              }

              // Make request based on operation
              if (testCase.operation === 'GET') {
                response = await request(app.getHttpServer())
                  .get(testCase.endpoint)
                  .set('Authorization', authToken);
              } else if (testCase.operation === 'POST') {
                response = await request(app.getHttpServer())
                  .post(testCase.endpoint)
                  .set('Authorization', authToken)
                  .send({
                    nom: 'Valid Client',
                    email: 'valid@example.com',
                    telephone: '1234567890',
                    adresse: 'Valid Address',
                    honoraireMensuel: 1000,
                    statut: 'ACTIF',
                    type: 'physique',
                  });
              }

              expect(response.status).toBeGreaterThanOrEqual(testCase.expectedStatusRange.min);
              expect(response.status).toBeLessThanOrEqual(testCase.expectedStatusRange.max);
            }

            if (testCase.type === 'client_error') {
              // Test with invalid data
              response = await request(app.getHttpServer())
                .post(testCase.endpoint)
                .set('Authorization', authToken)
                .send(testCase.invalidData);

              expect(response.status).toBeGreaterThanOrEqual(testCase.expectedStatusRange.min);
              expect(response.status).toBeLessThanOrEqual(testCase.expectedStatusRange.max);
              expect(response.body).toHaveProperty('message');
              expect(response.body).toHaveProperty('statusCode');
            }

            if (testCase.type === 'not_found') {
              // Setup not found mock
              const notFoundError = new Error('Record not found');
              mockPrismaService.clientsConseil.findUnique.mockRejectedValue(notFoundError);
              mockPrismaService.tachesConseil.findUnique.mockRejectedValue(notFoundError);

              if (testCase.operation === 'GET') {
                response = await request(app.getHttpServer())
                  .get(testCase.endpoint)
                  .set('Authorization', authToken);
              }

              expect(response.status).toBe(testCase.expectedStatus);
              expect(response.body).toHaveProperty('statusCode', testCase.expectedStatus);
            }
          }
        ),
        { numRuns: 100, timeout: 15000 }
      );
    }, 20000);
  });
  describe('Property 11.3: Response Header Consistency', () => {
    /**
     * Property: All API responses should include consistent headers
     * including Content-Type, and appropriate caching headers
     */
    it('should return consistent response headers across all endpoints', async () => {
      const headerTestGenerator = fc.record({
        endpoint: fc.constantFrom(
          '/conseil/dashboard',
          '/conseil/health',
          '/conseil/clients',
          '/conseil/taches',
          '/conseil/factures',
          '/conseil/paiements'
        ),
        method: fc.constantFrom('GET', 'POST'),
        expectJson: fc.constant(true),
      });

      await fc.assert(
        fc.asyncProperty(
          headerTestGenerator,
          async (testCase) => {
            // Feature: nestjs-api-architecture, Property 11: Response Header Consistency

            // Setup mocks
            mockPrismaService.clientsConseil.findMany.mockResolvedValue([]);
            mockPrismaService.clientsConseil.count.mockResolvedValue(0);
            mockPrismaService.tachesConseil.findMany.mockResolvedValue([]);
            mockPrismaService.tachesConseil.count.mockResolvedValue(0);
            mockPrismaService.facturesConseil.findMany.mockResolvedValue([]);
            mockPrismaService.facturesConseil.count.mockResolvedValue(0);
            mockPrismaService.paiementsConseil.findMany.mockResolvedValue([]);
            mockPrismaService.paiementsConseil.count.mockResolvedValue(0);

            let response;
            
            if (testCase.method === 'GET') {
              response = await request(app.getHttpServer())
                .get(testCase.endpoint)
                .set('Authorization', authToken);
            } else if (testCase.method === 'POST' && testCase.endpoint === '/conseil/clients') {
              mockPrismaService.clientsConseil.create.mockResolvedValue({
                id: '123e4567-e89b-12d3-a456-426614174000',
                reference: 'CLI-CONS-001',
                nom: 'Test Client',
                email: 'test@example.com',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });

              response = await request(app.getHttpServer())
                .post(testCase.endpoint)
                .set('Authorization', authToken)
                .send({
                  nom: 'Test Client',
                  email: 'test@example.com',
                  telephone: '1234567890',
                  adresse: 'Test Address',
                  honoraireMensuel: 1000,
                  statut: 'ACTIF',
                  type: 'physique',
                });
            }

            if (response) {
              // Verify Content-Type header consistency
              if (testCase.expectJson) {
                expect(response.headers['content-type']).toMatch(/application\/json/);
              }

              // Verify response has proper structure
              expect(response.body).toBeDefined();
              expect(typeof response.body).toBe('object');

              // Verify status code is appropriate
              expect(response.status).toBeGreaterThanOrEqual(200);
              expect(response.status).toBeLessThan(500);
            }
          }
        ),
        { numRuns: 100, timeout: 15000 }
      );
    }, 20000);
  });
  describe('Property 11.4: Error Response Format Consistency', () => {
    /**
     * Property: All error responses should follow a consistent format
     * with proper error codes, messages, and structure
     */
    it('should return consistent error response format for all error conditions', async () => {
      const errorTestGenerator = fc.oneof(
        // Validation errors
        fc.record({
          type: fc.constant('validation'),
          endpoint: fc.constantFrom('/conseil/clients', '/conseil/taches'),
          method: fc.constant('POST'),
          invalidData: fc.record({
            nom: fc.option(fc.string({ maxLength: 1 })), // Too short
            email: fc.option(fc.constant('invalid-email')), // Invalid format
            telephone: fc.option(fc.string({ maxLength: 5 })), // Too short
            honoraireMensuel: fc.option(fc.constant(-100)), // Negative value
          }),
          expectedStatus: fc.constantFrom(HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY),
        }),
        // Not found errors
        fc.record({
          type: fc.constant('not_found'),
          endpoint: fc.uuid().map(id => `/conseil/clients/${id}`),
          method: fc.constant('GET'),
          expectedStatus: fc.constant(HttpStatus.NOT_FOUND),
        }),
        // Unauthorized errors (simulated by removing auth header)
        fc.record({
          type: fc.constant('unauthorized'),
          endpoint: fc.constantFrom('/conseil/clients', '/conseil/taches'),
          method: fc.constantFrom('GET', 'POST'),
          expectedStatus: fc.constant(HttpStatus.UNAUTHORIZED),
        })
      );

      await fc.assert(
        fc.asyncProperty(
          errorTestGenerator,
          async (testCase) => {
            // Feature: nestjs-api-architecture, Property 11: Error Response Format Consistency

            let response;

            if (testCase.type === 'validation') {
              response = await request(app.getHttpServer())
                .post(testCase.endpoint)
                .set('Authorization', authToken)
                .send(testCase.invalidData)
                .expect(res => {
                  expect(res.status).toBeGreaterThanOrEqual(400);
                  expect(res.status).toBeLessThan(500);
                });
            } else if (testCase.type === 'not_found') {
              // Mock not found error
              mockPrismaService.clientsConseil.findUnique.mockRejectedValue(
                new Error('Record not found')
              );

              response = await request(app.getHttpServer())
                .get(testCase.endpoint)
                .set('Authorization', authToken);
            } else if (testCase.type === 'unauthorized') {
              // Override auth guard to return false
              mockAuthGuard.canActivate.mockReturnValueOnce(false);

              if (testCase.method === 'GET') {
                response = await request(app.getHttpServer())
                  .get(testCase.endpoint);
              } else if (testCase.method === 'POST') {
                response = await request(app.getHttpServer())
                  .post(testCase.endpoint)
                  .send({});
              }
            }

            if (response) {
              // Verify error response structure consistency
              expect(response.body).toBeDefined();
              expect(typeof response.body).toBe('object');
              expect(response.body).toHaveProperty('statusCode');
              expect(response.body).toHaveProperty('message');
              expect(response.body).toHaveProperty('timestamp');

              // Verify status code consistency
              expect(response.status).toBeGreaterThanOrEqual(400);
              expect(response.status).toBeLessThan(600);
              expect(response.body.statusCode).toBe(response.status);

              // Verify message is present and meaningful
              expect(response.body.message).toBeDefined();
              expect(typeof response.body.message === 'string' || Array.isArray(response.body.message)).toBe(true);

              // Verify timestamp format
              expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

              // Verify Content-Type is JSON even for errors
              expect(response.headers['content-type']).toMatch(/application\/json/);
            }
          }
        ),
        { numRuns: 100, timeout: 15000 }
      );
    }, 20000);
  });
  describe('Property 11.5: CRUD Operations Response Consistency', () => {
    /**
     * Property: All CRUD operations should return consistent response formats
     * for each entity type (clients, tâches, factures, paiements)
     */
    it('should return consistent response formats across all CRUD operations', async () => {
      const crudTestGenerator = fc.record({
        entity: fc.constantFrom('clients', 'taches', 'factures', 'paiements'),
        operation: fc.constantFrom('CREATE', 'READ', 'UPDATE', 'DELETE'),
        entityId: fc.uuid(),
      });

      await fc.assert(
        fc.asyncProperty(
          crudTestGenerator,
          async (testCase) => {
            // Feature: nestjs-api-architecture, Property 11: CRUD Operations Response Consistency

            const basePath = `/conseil/${testCase.entity}`;
            const mockEntityData = {
              id: testCase.entityId,
              reference: 'REF-001',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Setup entity-specific mocks
            const entityService = mockPrismaService[`${testCase.entity}Conseil`] || mockPrismaService.clientsConseil;
            entityService.create.mockResolvedValue(mockEntityData);
            entityService.findMany.mockResolvedValue([mockEntityData]);
            entityService.findUnique.mockResolvedValue(mockEntityData);
            entityService.update.mockResolvedValue(mockEntityData);
            entityService.delete.mockResolvedValue(mockEntityData);
            entityService.count.mockResolvedValue(1);

            let response;
            let expectedStatus: number;

            switch (testCase.operation) {
              case 'CREATE':
                expectedStatus = HttpStatus.CREATED;
                response = await request(app.getHttpServer())
                  .post(basePath)
                  .set('Authorization', authToken)
                  .send(generateValidEntityData(testCase.entity));
                break;

              case 'READ':
                expectedStatus = HttpStatus.OK;
                response = await request(app.getHttpServer())
                  .get(basePath)
                  .set('Authorization', authToken);
                break;

              case 'UPDATE':
                expectedStatus = HttpStatus.OK;
                response = await request(app.getHttpServer())
                  .patch(`${basePath}/${testCase.entityId}`)
                  .set('Authorization', authToken)
                  .send({ nom: 'Updated Name' });
                break;

              case 'DELETE':
                expectedStatus = HttpStatus.OK;
                response = await request(app.getHttpServer())
                  .delete(`${basePath}/${testCase.entityId}`)
                  .set('Authorization', authToken);
                break;
            }

            if (response) {
              // Verify status code consistency
              expect(response.status).toBe(expectedStatus);

              // Verify Content-Type consistency
              expect(response.headers['content-type']).toMatch(/application\/json/);

              // Verify response structure based on operation
              if (testCase.operation === 'READ') {
                // List operations should return paginated format
                expect(response.body).toHaveProperty('data');
                expect(response.body).toHaveProperty('meta');
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.meta).toHaveProperty('total');
                expect(response.body.meta).toHaveProperty('page');
                expect(response.body.meta).toHaveProperty('limit');
              } else if (testCase.operation === 'CREATE' || testCase.operation === 'UPDATE') {
                // Create/Update operations should return entity object
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('createdAt');
                expect(response.body).toHaveProperty('updatedAt');
                expect(typeof response.body.id).toBe('string');
              } else if (testCase.operation === 'DELETE') {
                // Delete operations might return empty body or success message
                expect(response.body).toBeDefined();
              }
            }
          }
        ),
        { numRuns: 100, timeout: 15000 }
      );
    }, 20000);
  });

  // Helper function to generate valid entity data
  function generateValidEntityData(entityType: string): any {
    // Correction des données de test avec les bons types d'enum
    const baseData = {
      clients: {
        nom: 'Test Client',
        email: 'test@example.com',
        telephone: '1234567890',
        adresse: 'Test Address',
        honoraireMensuel: 1000,
        statut: 'ACTIF',
        type: 'physique', // Correction: utiliser 'physique' au lieu de 'PERSONNE_PHYSIQUE'
      },
      taches: {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Task',
        type: 'CONSULTATION',
        dureeMinutes: 60,
        moisConcerne: '2024-01',
      },
      factures: {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        montant: 1000,
        moisConcerne: '2024-01',
        statut: 'BROUILLON',
      },
      paiements: {
        factureId: '123e4567-e89b-12d3-a456-426614174000',
        montant: 500,
        datePaiement: new Date().toISOString(),
        mode: 'VIREMENT',
      },
    };

    return baseData[entityType] || baseData.clients;
  }
});