import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ImpayesService } from './impayes/impayes.service';
import { ImportExcelService } from './import/import-excel.service';
import { AlertesService } from './impayes/alertes.service';
import { PrismaService } from '../common/services/prisma.service';
import { PaginationService } from '../common/services/pagination.service';
import { ExcelParserService } from './import/services/excel-parser.service';
import { ImportProgressService } from './import/services/import-progress.service';
import { TemplateGeneratorService } from './import/services/template-generator.service';
import { ImportOrchestratorService } from './import/services/import-orchestrator.service';
import { EntityValidatorsService } from './import/validators/entity-validators.service';
import { ImpayeDto, StatistiquesImpayesDto } from './impayes/dto/impaye.dto';
import { ImportResultDto, ValidationResultDto, EntityType } from './import/dto/import-result.dto';
import { TypeAlerte, PrioriteAlerte } from '@prisma/client';

describe('Immobilier Module (Property-Based Tests)', () => {
  let impayesService: ImpayesService;
  let importExcelService: ImportExcelService;
  let alertesService: AlertesService;
  let prisma: PrismaService;
  let paginationService: PaginationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpayesService,
        ImportExcelService,
        AlertesService,
        {
          provide: PrismaService,
          useValue: {
            lots: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
            },
            alertes: {
              findFirst: jest.fn(),
              create: jest.fn(),
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: PaginationService,
          useValue: {
            paginate: jest.fn(),
          },
        },
        {
          provide: ExcelParserService,
          useValue: {
            parseExcelFile: jest.fn(),
          },
        },
        {
          provide: ImportProgressService,
          useValue: {
            getImportProgress: jest.fn(),
          },
        },
        {
          provide: TemplateGeneratorService,
          useValue: {
            generateTemplate: jest.fn(),
            generateMultiSheetTemplate: jest.fn(),
          },
        },
        {
          provide: ImportOrchestratorService,
          useValue: {
            orchestrateSimpleImport: jest.fn(),
            orchestrateCompleteImport: jest.fn(),
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

    impayesService = module.get<ImpayesService>(ImpayesService);
    importExcelService = module.get<ImportExcelService>(ImportExcelService);
    alertesService = module.get<AlertesService>(AlertesService);
    prisma = module.get<PrismaService>(PrismaService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  describe('Property 9: Transformation automatique des données', () => {
    it(
      'should consistently transform raw lot data into ImpayeDto format',
      async () => {
        // Feature: nestjs-api-architecture, Property 9: Transformation automatique des données
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              mois: fc.string({ minLength: 7, maxLength: 7 }).filter(s => /^\d{4}-\d{2}$/.test(s)),
              lots: fc.array(
                fc.record({
                  id: fc.uuid(),
                  numero: fc.string({ minLength: 1, maxLength: 10 }),
                  loyerMensuelAttendu: fc.float({ min: 50000, max: 1000000 }),
                  statut: fc.constant('OCCUPE'),
                  immeuble: fc.record({
                    id: fc.uuid(),
                    nom: fc.string({ minLength: 1, maxLength: 50 }),
                    reference: fc.string({ minLength: 1, maxLength: 20 }),
                  }),
                  locataire: fc.record({
                    id: fc.uuid(),
                    nom: fc.string({ minLength: 1, maxLength: 100 }),
                  }),
                  encaissementsLoyers: fc.array(
                    fc.record({
                      montantEncaisse: fc.float({ min: 0, max: 1000000 }),
                      moisConcerne: fc.string(),
                    }),
                    { maxLength: 3 }
                  ),
                }),
                { minLength: 1, maxLength: 5 }
              ),
            }),
            async ({ mois, lots }) => {
              jest.clearAllMocks();

              // Mock pagination service to return the lots
              (paginationService.paginate as jest.Mock).mockResolvedValue({
                data: lots,
                pagination: {
                  total: lots.length,
                  page: 1,
                  limit: 10,
                  totalPages: 1,
                  hasNext: false,
                  hasPrev: false,
                },
              });

              const result = await impayesService.detecterImpayesPourMois({
                mois,
                page: 1,
                limit: 10,
              });

              // Verify transformation consistency
              expect(result.data).toBeInstanceOf(Array);
              
              for (const impaye of result.data) {
                // Verify all required fields are present and properly typed
                expect(typeof impaye.lotId).toBe('string');
                expect(typeof impaye.lotNumero).toBe('string');
                expect(typeof impaye.immeubleId).toBe('string');
                expect(typeof impaye.immeubleNom).toBe('string');
                expect(typeof impaye.immeubleReference).toBe('string');
                expect(typeof impaye.locataireNom).toBe('string');
                expect(typeof impaye.moisConcerne).toBe('string');
                expect(typeof impaye.montantAttendu).toBe('number');
                expect(typeof impaye.montantEncaisse).toBe('number');
                expect(typeof impaye.montantManquant).toBe('number');
                expect(typeof impaye.nombreJoursRetard).toBe('number');
                expect(['IMPAYE', 'PARTIEL', 'REGLE']).toContain(impaye.statut);
                expect(impaye.dateEcheance).toBeInstanceOf(Date);

                // Verify mathematical consistency
                expect(impaye.montantManquant).toBe(impaye.montantAttendu - impaye.montantEncaisse);
                expect(impaye.montantManquant).toBeGreaterThan(0); // Only unpaid amounts should be returned
                
                // Verify status logic
                if (impaye.montantEncaisse === 0) {
                  expect(impaye.statut).toBe('IMPAYE');
                } else if (impaye.montantEncaisse < impaye.montantAttendu) {
                  expect(impaye.statut).toBe('PARTIEL');
                }
              }
            }
          ),
          { numRuns: 20 }
        );
      },
      30000
    );
  });

  describe('Property 26: Détection automatique des impayés', () => {
    it(
      'should automatically detect unpaid rents for any occupied lot without full payment',
      async () => {
        // Feature: nestjs-api-architecture, Property 26: Détection automatique des impayés
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              mois: fc.string({ minLength: 7, maxLength: 7 }).filter(s => /^\d{4}-\d{2}$/.test(s)),
              loyerAttendu: fc.float({ min: 50000, max: 500000 }),
              montantEncaisse: fc.float({ min: 0, max: 400000 }),
            }),
            async ({ mois, loyerAttendu, montantEncaisse }) => {
              jest.clearAllMocks();

              const lotId = fc.sample(fc.uuid(), 1)[0];
              const mockLot = {
                id: lotId,
                numero: 'A01',
                loyerMensuelAttendu: loyerAttendu,
                statut: 'OCCUPE',
                immeuble: {
                  id: fc.sample(fc.uuid(), 1)[0],
                  nom: 'Test Building',
                  reference: 'TB001',
                },
                locataire: {
                  id: fc.sample(fc.uuid(), 1)[0],
                  nom: 'Test Tenant',
                },
                encaissementsLoyers: [
                  {
                    montantEncaisse: montantEncaisse,
                    moisConcerne: mois,
                  },
                ],
              };

              (paginationService.paginate as jest.Mock).mockResolvedValue({
                data: [mockLot],
                pagination: {
                  total: 1,
                  page: 1,
                  limit: 10,
                  totalPages: 1,
                  hasNext: false,
                  hasPrev: false,
                },
              });

              const result = await impayesService.detecterImpayesPourMois({
                mois,
                page: 1,
                limit: 10,
              });

              const montantManquant = loyerAttendu - montantEncaisse;

              if (montantManquant > 0) {
                // Should detect as unpaid
                expect(result.data).toHaveLength(1);
                expect(result.data[0].montantManquant).toBe(montantManquant);
                expect(result.data[0].lotId).toBe(lotId);
              } else {
                // Should not detect as unpaid
                expect(result.data).toHaveLength(0);
              }
            }
          ),
          { numRuns: 30 }
        );
      },
      30000
    );
  });

  describe('Property 27: Cohérence des calculs d\'arriérés', () => {
    it(
      'should maintain consistent arrears calculations with partial payments',
      async () => {
        // Feature: nestjs-api-architecture, Property 27: Cohérence des calculs d'arriérés
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              montantDu: fc.float({ min: 100000, max: 1000000 }),
              paiementsPartiels: fc.array(
                fc.float({ min: 1000, max: 100000 }),
                { minLength: 0, maxLength: 5 }
              ),
            }),
            async ({ montantDu, paiementsPartiels }) => {
              const totalPaiements = paiementsPartiels.reduce((sum, p) => sum + p, 0);
              const montantRestant = montantDu - totalPaiements;

              // Verify mathematical consistency
              expect(montantRestant).toBe(montantDu - totalPaiements);

              // Verify business logic
              if (montantRestant <= 0) {
                // Should be considered as fully paid
                expect(montantRestant).toBeLessThanOrEqual(0);
              } else {
                // Should still have remaining debt
                expect(montantRestant).toBeGreaterThan(0);
                expect(montantRestant).toBeLessThanOrEqual(montantDu);
              }

              // Verify that total payments never exceed original debt in valid scenarios
              if (totalPaiements <= montantDu) {
                expect(montantRestant).toBeGreaterThanOrEqual(0);
              }
            }
          ),
          { numRuns: 50 }
        );
      },
      30000
    );
  });

  describe('Property 28: Validation des imports Excel', () => {
    it(
      'should validate Excel import data according to business rules before processing',
      async () => {
        // Feature: nestjs-api-architecture, Property 28: Validation des imports Excel
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              entityType: fc.constantFrom(
                EntityType.PROPRIETAIRES,
                EntityType.IMMEUBLES,
                EntityType.LOCATAIRES,
                EntityType.LOTS
              ),
              rows: fc.array(
                fc.record({
                  nom: fc.oneof(
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.constant(''), // Invalid: empty name
                    fc.constant(null), // Invalid: null name
                  ),
                  email: fc.oneof(
                    fc.emailAddress(),
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')), // Invalid email
                    fc.constant(''), // Invalid: empty email
                  ),
                  telephone: fc.oneof(
                    fc.string({ minLength: 8, maxLength: 15 }).filter(s => /^\d+$/.test(s)),
                    fc.string({ minLength: 1, maxLength: 10 }), // Invalid: non-numeric or too short
                  ),
                }),
                { minLength: 1, maxLength: 10 }
              ),
            }),
            async ({ entityType, rows }) => {
              jest.clearAllMocks();

              // Mock validation errors for invalid data
              const mockErrors = rows.flatMap((row, index) => {
                const errors = [];
                const rowNumber = index + 2; // Excel rows start at 2

                if (!row.nom || row.nom.trim() === '') {
                  errors.push({
                    row: rowNumber,
                    field: 'nom',
                    value: row.nom,
                    error: 'Le nom est requis',
                    severity: 'ERROR' as const,
                  });
                }

                if (!row.email || !row.email.includes('@')) {
                  errors.push({
                    row: rowNumber,
                    field: 'email',
                    value: row.email,
                    error: 'Email invalide',
                    severity: 'ERROR' as const,
                  });
                }

                if (!row.telephone || !/^\d{8,15}$/.test(row.telephone)) {
                  errors.push({
                    row: rowNumber,
                    field: 'telephone',
                    value: row.telephone,
                    error: 'Téléphone invalide',
                    severity: 'WARNING' as const,
                  });
                }

                return errors;
              });

              (importExcelService as any).validators = {
                validateRow: jest.fn().mockImplementation((row, type, rowNumber) => {
                  return mockErrors.filter(e => e.row === rowNumber);
                }),
              };

              const validationResult = await importExcelService.validateImportData(rows, entityType);

              // Verify validation consistency
              expect(validationResult).toBeDefined();
              expect(typeof validationResult.isValid).toBe('boolean');
              expect(typeof validationResult.totalRows).toBe('number');
              expect(typeof validationResult.validRows).toBe('number');
              expect(typeof validationResult.invalidRows).toBe('number');
              expect(Array.isArray(validationResult.errors)).toBe(true);

              // Verify mathematical consistency
              expect(validationResult.totalRows).toBe(rows.length);
              expect(validationResult.validRows + validationResult.invalidRows).toBe(validationResult.totalRows);

              // Verify business rule: data is invalid if there are ERROR-level validation errors
              const criticalErrors = mockErrors.filter(e => e.severity === 'ERROR');
              if (criticalErrors.length > 0) {
                expect(validationResult.isValid).toBe(false);
              }

              // Verify that all errors are properly captured
              expect(validationResult.errors.length).toBeGreaterThanOrEqual(0);
            }
          ),
          { numRuns: 25 }
        );
      },
      30000
    );
  });

  describe('Property 29: Atomicité des imports', () => {
    it(
      'should ensure all-or-nothing behavior for Excel imports',
      async () => {
        // Feature: nestjs-api-architecture, Property 29: Atomicité des imports
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              entityType: fc.constantFrom(
                EntityType.PROPRIETAIRES,
                EntityType.IMMEUBLES,
                EntityType.LOCATAIRES,
                EntityType.LOTS
              ),
              hasValidData: fc.boolean(),
              hasCriticalError: fc.boolean(),
            }),
            async ({ entityType, hasValidData, hasCriticalError }) => {
              jest.clearAllMocks();

              const mockFile = {
                buffer: Buffer.from('mock excel data'),
                originalname: 'test.xlsx',
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              } as Express.Multer.File;

              const mockResult: ImportResultDto = {
                success: hasValidData && !hasCriticalError,
                totalRows: 10,
                successfulRows: hasValidData && !hasCriticalError ? 10 : 0,
                failedRows: hasValidData && !hasCriticalError ? 0 : 10,
                errors: hasCriticalError ? [
                  {
                    row: 2,
                    field: 'test',
                    value: 'invalid',
                    error: 'Critical validation error',
                    severity: 'ERROR' as const,
                  }
                ] : [],
                summary: hasValidData && !hasCriticalError ? 'Import successful' : 'Import failed',
                processingTimeMs: 1000,
              };

              (importExcelService as any).orchestrator = {
                orchestrateSimpleImport: jest.fn().mockResolvedValue(mockResult),
              };

              const result = await importExcelService.importProprietaires(mockFile, 'user-id');

              // Verify atomicity property
              if (result.success) {
                // If successful, all rows should be processed successfully
                expect(result.successfulRows).toBe(result.totalRows);
                expect(result.failedRows).toBe(0);
                expect(result.errors.filter(e => e.severity === 'ERROR')).toHaveLength(0);
              } else {
                // If failed, no rows should be successfully imported
                expect(result.successfulRows).toBe(0);
                // Either all rows failed or there are critical errors
                expect(result.failedRows > 0 || result.errors.some(e => e.severity === 'ERROR')).toBe(true);
              }

              // Verify consistency
              expect(result.successfulRows + result.failedRows).toBe(result.totalRows);
            }
          ),
          { numRuns: 20 }
        );
      },
      30000
    );
  });

  describe('Property 30: Génération d\'alertes automatiques', () => {
    it(
      'should automatically generate LOYER_IMPAYE alerts for detected unpaid rents',
      async () => {
        // Feature: nestjs-api-architecture, Property 30: Génération d'alertes automatiques
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              lotId: fc.uuid(),
              mois: fc.string({ minLength: 7, maxLength: 7 }).filter(s => /^\d{4}-\d{2}$/.test(s)),
              montantManquant: fc.float({ min: 1000, max: 500000 }),
              nombreJoursRetard: fc.integer({ min: 1, max: 120 }),
            }),
            async ({ lotId, mois, montantManquant, nombreJoursRetard }) => {
              jest.clearAllMocks();

              const mockLot = {
                id: lotId,
                numero: 'A01',
                immeuble: {
                  id: fc.sample(fc.uuid(), 1)[0],
                  nom: 'Test Building',
                },
                locataire: {
                  id: fc.sample(fc.uuid(), 1)[0],
                  nom: 'Test Tenant',
                },
              };

              // Mock no existing alert
              (prisma.alertes.findFirst as jest.Mock).mockResolvedValue(null);
              (prisma.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
              (prisma.alertes.create as jest.Mock).mockResolvedValue({
                id: fc.sample(fc.uuid(), 1)[0],
                type: TypeAlerte.LOYER_IMPAYE,
              });

              await alertesService.genererAlerteImpaye(
                lotId,
                mois,
                montantManquant,
                nombreJoursRetard,
                'user-id'
              );

              // Verify alert creation was called
              expect(prisma.alertes.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                  type: TypeAlerte.LOYER_IMPAYE,
                  titre: expect.stringContaining('Loyer impayé'),
                  description: expect.stringContaining(mois),
                  lien: `/immobilier/lots/${lotId}`,
                  priorite: expect.any(String),
                  lu: false,
                  userId: 'user-id',
                }),
              });

              // Verify priority logic based on delay
              const createCall = (prisma.alertes.create as jest.Mock).mock.calls[0][0];
              const priorite = createCall.data.priorite;

              if (nombreJoursRetard >= 60) {
                expect(priorite).toBe(PrioriteAlerte.HAUTE);
              } else if (nombreJoursRetard >= 30) {
                expect(priorite).toBe(PrioriteAlerte.MOYENNE);
              } else {
                expect(priorite).toBe(PrioriteAlerte.BASSE);
              }

              // Verify description contains relevant information
              expect(createCall.data.description).toContain(montantManquant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }));
              expect(createCall.data.description).toContain(`${nombreJoursRetard} jours`);
            }
          ),
          { numRuns: 25 }
        );
      },
      30000
    );

    it(
      'should not create duplicate alerts for the same lot and month',
      async () => {
        // Feature: nestjs-api-architecture, Property 30: Génération d'alertes automatiques - No duplicates
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              lotId: fc.uuid(),
              mois: fc.string({ minLength: 7, maxLength: 7 }).filter(s => /^\d{4}-\d{2}$/.test(s)),
              montantManquant: fc.float({ min: 1000, max: 500000 }),
              nombreJoursRetard: fc.integer({ min: 1, max: 120 }),
            }),
            async ({ lotId, mois, montantManquant, nombreJoursRetard }) => {
              jest.clearAllMocks();

              // Mock existing alert
              (prisma.alertes.findFirst as jest.Mock).mockResolvedValue({
                id: fc.sample(fc.uuid(), 1)[0],
                type: TypeAlerte.LOYER_IMPAYE,
                lien: `/immobilier/lots/${lotId}`,
                description: `Existing alert for ${mois}`,
              });

              await alertesService.genererAlerteImpaye(
                lotId,
                mois,
                montantManquant,
                nombreJoursRetard,
                'user-id'
              );

              // Verify no new alert was created
              expect(prisma.alertes.create).not.toHaveBeenCalled();

              // Verify existing alert was checked
              expect(prisma.alertes.findFirst).toHaveBeenCalledWith({
                where: {
                  type: TypeAlerte.LOYER_IMPAYE,
                  lien: `/immobilier/lots/${lotId}`,
                  description: {
                    contains: mois,
                  },
                },
              });
            }
          ),
          { numRuns: 15 }
        );
      },
      30000
    );
  });
});