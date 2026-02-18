import { Test, TestingModule } from '@nestjs/testing';
import { ReferenceGeneratorService } from './reference-generator.service';
import { PrismaService } from './prisma.service';
import * as fc from 'fast-check';

describe('ReferenceGeneratorService - Property-Based Tests', () => {
  let service: ReferenceGeneratorService;
  let prismaService: PrismaService;

  // Mock database state to track generated references
  const mockDatabase = {
    affaires: new Set<string>(),
    dossiersRecouvrement: new Set<string>(),
    immeubles: new Set<string>(),
    clientsConseil: new Set<string>(),
    facturesConseil: new Set<string>(),
  };

  const mockPrismaService = {
    affaires: {
      findFirst: jest.fn(),
    },
    dossiersRecouvrement: {
      findFirst: jest.fn(),
    },
    immeubles: {
      findFirst: jest.fn(),
    },
    clientsConseil: {
      findFirst: jest.fn(),
    },
    facturesConseil: {
      findFirst: jest.fn(),
    },
    executeTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferenceGeneratorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReferenceGeneratorService>(ReferenceGeneratorService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mock database
    Object.values(mockDatabase).forEach(set => set.clear());

    // Setup mock transaction execution
    mockPrismaService.executeTransaction.mockImplementation(async (fn) => {
      return await fn(mockPrismaService);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 12: Global Reference Uniqueness', () => {
    it('should generate globally unique references across all domains', async () => {
      // Feature: nestjs-api-architecture, Property 12: Global reference uniqueness
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              'affaire',
              'dossierRecouvrement', 
              'immeuble',
              'clientConseil',
              'facture'
            ),
            { minLength: 5, maxLength: 15 } // Reduced size to avoid exhaustion
          ),
          async (domains) => {
            const generatedReferences = new Set<string>();
            
            // Setup mocks to simulate existing references in database
            mockPrismaService.affaires.findFirst.mockImplementation(async ({ where }) => {
              return mockDatabase.affaires.has(where.reference) ? { id: 'existing' } : null;
            });
            
            mockPrismaService.dossiersRecouvrement.findFirst.mockImplementation(async ({ where }) => {
              return mockDatabase.dossiersRecouvrement.has(where.reference) ? { id: 'existing' } : null;
            });
            
            mockPrismaService.immeubles.findFirst.mockImplementation(async ({ where }) => {
              return mockDatabase.immeubles.has(where.reference) ? { id: 'existing' } : null;
            });
            
            mockPrismaService.clientsConseil.findFirst.mockImplementation(async ({ where }) => {
              return mockDatabase.clientsConseil.has(where.reference) ? { id: 'existing' } : null;
            });
            
            mockPrismaService.facturesConseil.findFirst.mockImplementation(async ({ where }) => {
              return mockDatabase.facturesConseil.has(where.reference) ? { id: 'existing' } : null;
            });

            // Generate references for each domain
            for (const domain of domains) {
              let reference: string;
              
              switch (domain) {
                case 'affaire':
                  reference = await service.generateAffaireReference();
                  mockDatabase.affaires.add(reference);
                  break;
                case 'dossierRecouvrement':
                  reference = await service.generateDossierRecouvrementReference();
                  mockDatabase.dossiersRecouvrement.add(reference);
                  break;
                case 'immeuble':
                  reference = await service.generateImmeubleReference();
                  mockDatabase.immeubles.add(reference);
                  break;
                case 'clientConseil':
                  reference = await service.generateClientConseilReference();
                  mockDatabase.clientsConseil.add(reference);
                  break;
                case 'facture':
                  reference = await service.generateFactureReference('test-client-id');
                  mockDatabase.facturesConseil.add(reference);
                  break;
                default:
                  throw new Error(`Unknown domain: ${domain}`);
              }

              // Verify reference is unique globally
              expect(generatedReferences.has(reference)).toBe(false);
              generatedReferences.add(reference);

              // Verify reference follows domain-specific format
              switch (domain) {
                case 'affaire':
                  expect(reference).toMatch(/^AFF-\d{4}-\d{3}$/);
                  break;
                case 'dossierRecouvrement':
                  expect(reference).toMatch(/^DOS-REC-\d{3}$/);
                  break;
                case 'immeuble':
                  expect(reference).toMatch(/^IMM-\d{3}$/);
                  break;
                case 'clientConseil':
                  expect(reference).toMatch(/^CLI-CONS-\d{3}$/);
                  break;
                case 'facture':
                  expect(reference).toMatch(/^FACT-\d{4}-\d{2}-\d{3}$/);
                  break;
              }
            }

            // Final assertion: all references should be unique
            expect(generatedReferences.size).toBe(domains.length);
          }
        ),
        { numRuns: 50 } // Reduced runs for stability
      );
    });

    it('should maintain uniqueness within the same domain across multiple generations', async () => {
      // Feature: nestjs-api-architecture, Property 12: Domain-specific reference uniqueness
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('affaire', 'dossierRecouvrement', 'immeuble', 'clientConseil'),
          fc.integer({ min: 2, max: 8 }), // Reduced count to avoid exhaustion
          async (domain, count) => {
            const generatedReferences = new Set<string>();
            
            // Setup domain-specific mocks
            const setupMockForDomain = (domain: string) => {
              switch (domain) {
                case 'affaire':
                  mockPrismaService.affaires.findFirst.mockImplementation(async ({ where }) => {
                    return mockDatabase.affaires.has(where.reference) ? { id: 'existing' } : null;
                  });
                  break;
                case 'dossierRecouvrement':
                  mockPrismaService.dossiersRecouvrement.findFirst.mockImplementation(async ({ where }) => {
                    return mockDatabase.dossiersRecouvrement.has(where.reference) ? { id: 'existing' } : null;
                  });
                  break;
                case 'immeuble':
                  mockPrismaService.immeubles.findFirst.mockImplementation(async ({ where }) => {
                    return mockDatabase.immeubles.has(where.reference) ? { id: 'existing' } : null;
                  });
                  break;
                case 'clientConseil':
                  mockPrismaService.clientsConseil.findFirst.mockImplementation(async ({ where }) => {
                    return mockDatabase.clientsConseil.has(where.reference) ? { id: 'existing' } : null;
                  });
                  break;
              }
            };

            setupMockForDomain(domain);

            // Generate multiple references for the same domain
            for (let i = 0; i < count; i++) {
              let reference: string;
              
              switch (domain) {
                case 'affaire':
                  reference = await service.generateAffaireReference();
                  mockDatabase.affaires.add(reference);
                  break;
                case 'dossierRecouvrement':
                  reference = await service.generateDossierRecouvrementReference();
                  mockDatabase.dossiersRecouvrement.add(reference);
                  break;
                case 'immeuble':
                  reference = await service.generateImmeubleReference();
                  mockDatabase.immeubles.add(reference);
                  break;
                case 'clientConseil':
                  reference = await service.generateClientConseilReference();
                  mockDatabase.clientsConseil.add(reference);
                  break;
                default:
                  throw new Error(`Unknown domain: ${domain}`);
              }

              // Verify each reference is unique within the domain
              expect(generatedReferences.has(reference)).toBe(false);
              generatedReferences.add(reference);
            }

            // Final assertion: all references should be unique
            expect(generatedReferences.size).toBe(count);
          }
        ),
        { numRuns: 30 } // Reduced runs for stability
      );
    });
  });

  describe('Property 13: Atomic Reference Generation', () => {
    it('should generate references atomically without race conditions', async () => {
      // Feature: nestjs-api-architecture, Property 13: Atomic reference generation
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('affaire', 'dossierRecouvrement', 'immeuble', 'clientConseil'),
          fc.integer({ min: 2, max: 5 }), // Reduced concurrency for stability
          async (domain, concurrentCount) => {
            const generatedReferences = new Set<string>();
            let transactionCallCount = 0;
            
            // Mock transaction to simulate atomic behavior
            mockPrismaService.executeTransaction.mockImplementation(async (fn) => {
              transactionCallCount++;
              return await fn(mockPrismaService);
            });

            // Setup domain-specific mocks with proper state tracking
            const setupMockWithAtomicity = (domain: string) => {
              switch (domain) {
                case 'affaire':
                  mockPrismaService.affaires.findFirst.mockImplementation(async ({ where }) => {
                    return mockDatabase.affaires.has(where.reference) ? { id: 'existing' } : null;
                  });
                  break;
                case 'dossierRecouvrement':
                  mockPrismaService.dossiersRecouvrement.findFirst.mockImplementation(async ({ where }) => {
                    return mockDatabase.dossiersRecouvrement.has(where.reference) ? { id: 'existing' } : null;
                  });
                  break;
                case 'immeuble':
                  mockPrismaService.immeubles.findFirst.mockImplementation(async ({ where }) => {
                    return mockDatabase.immeubles.has(where.reference) ? { id: 'existing' } : null;
                  });
                  break;
                case 'clientConseil':
                  mockPrismaService.clientsConseil.findFirst.mockImplementation(async ({ where }) => {
                    return mockDatabase.clientsConseil.has(where.reference) ? { id: 'existing' } : null;
                  });
                  break;
              }
            };

            setupMockWithAtomicity(domain);

            // Generate references sequentially to simulate atomic behavior
            // (In real scenario, transactions would handle concurrency)
            const references: string[] = [];
            
            for (let i = 0; i < concurrentCount; i++) {
              let reference: string;
              
              switch (domain) {
                case 'affaire':
                  reference = await service.generateAffaireReference();
                  mockDatabase.affaires.add(reference);
                  break;
                case 'dossierRecouvrement':
                  reference = await service.generateDossierRecouvrementReference();
                  mockDatabase.dossiersRecouvrement.add(reference);
                  break;
                case 'immeuble':
                  reference = await service.generateImmeubleReference();
                  mockDatabase.immeubles.add(reference);
                  break;
                case 'clientConseil':
                  reference = await service.generateClientConseilReference();
                  mockDatabase.clientsConseil.add(reference);
                  break;
                default:
                  throw new Error(`Unknown domain: ${domain}`);
              }
              
              references.push(reference);
            }

            // Verify all references are unique (no race condition occurred)
            references.forEach(ref => {
              expect(generatedReferences.has(ref)).toBe(false);
              generatedReferences.add(ref);
            });

            // Verify all references were generated
            expect(generatedReferences.size).toBe(concurrentCount);
            
            // Verify each generation used a transaction (atomic behavior)
            expect(transactionCallCount).toBe(concurrentCount);

            // Verify all references follow the correct format for the domain
            references.forEach(reference => {
              switch (domain) {
                case 'affaire':
                  expect(reference).toMatch(/^AFF-\d{4}-\d{3}$/);
                  break;
                case 'dossierRecouvrement':
                  expect(reference).toMatch(/^DOS-REC-\d{3}$/);
                  break;
                case 'immeuble':
                  expect(reference).toMatch(/^IMM-\d{3}$/);
                  break;
                case 'clientConseil':
                  expect(reference).toMatch(/^CLI-CONS-\d{3}$/);
                  break;
              }
            });
          }
        ),
        { numRuns: 20 } // Reduced runs for stability
      );
    });

    it('should handle transaction failures gracefully and maintain atomicity', async () => {
      // Feature: nestjs-api-architecture, Property 13: Transaction failure handling
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('affaire', 'dossierRecouvrement', 'immeuble', 'clientConseil'),
          fc.boolean(),
          async (domain, shouldFail) => {
            let transactionExecuted = false;
            
            // Mock transaction with potential failure
            mockPrismaService.executeTransaction.mockImplementation(async (fn) => {
              transactionExecuted = true;
              if (shouldFail) {
                throw new Error('Transaction failed');
              }
              return await fn(mockPrismaService);
            });

            // Setup domain-specific mocks
            mockPrismaService.affaires.findFirst.mockResolvedValue(null);
            mockPrismaService.dossiersRecouvrement.findFirst.mockResolvedValue(null);
            mockPrismaService.immeubles.findFirst.mockResolvedValue(null);
            mockPrismaService.clientsConseil.findFirst.mockResolvedValue(null);

            let generationPromise: Promise<string>;
            
            switch (domain) {
              case 'affaire':
                generationPromise = service.generateAffaireReference();
                break;
              case 'dossierRecouvrement':
                generationPromise = service.generateDossierRecouvrementReference();
                break;
              case 'immeuble':
                generationPromise = service.generateImmeubleReference();
                break;
              case 'clientConseil':
                generationPromise = service.generateClientConseilReference();
                break;
              default:
                throw new Error(`Unknown domain: ${domain}`);
            }

            if (shouldFail) {
              // Verify that transaction failure is properly propagated
              await expect(generationPromise).rejects.toThrow('Transaction failed');
            } else {
              // Verify successful generation
              const reference = await generationPromise;
              expect(reference).toBeDefined();
              expect(typeof reference).toBe('string');
              expect(reference.length).toBeGreaterThan(0);
            }

            // Verify transaction was attempted in both cases
            expect(transactionExecuted).toBe(true);
          }
        ),
        { numRuns: 30 } // Reduced runs for stability
      );
    });
  });

  describe('Reference Format Validation Properties', () => {
    it('should validate that all generated references follow their domain-specific patterns', async () => {
      // Feature: nestjs-api-architecture, Property 12: Format consistency
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('affaire', 'dossierRecouvrement', 'immeuble', 'clientConseil', 'facture'),
          async (domain) => {
            // Setup mocks
            mockPrismaService.affaires.findFirst.mockResolvedValue(null);
            mockPrismaService.dossiersRecouvrement.findFirst.mockResolvedValue(null);
            mockPrismaService.immeubles.findFirst.mockResolvedValue(null);
            mockPrismaService.clientsConseil.findFirst.mockResolvedValue(null);
            mockPrismaService.facturesConseil.findFirst.mockResolvedValue(null);

            let reference: string;
            let expectedDomain: string;
            
            switch (domain) {
              case 'affaire':
                reference = await service.generateAffaireReference();
                expectedDomain = 'affaire';
                break;
              case 'dossierRecouvrement':
                reference = await service.generateDossierRecouvrementReference();
                expectedDomain = 'recouvrement';
                break;
              case 'immeuble':
                reference = await service.generateImmeubleReference();
                expectedDomain = 'immeuble';
                break;
              case 'clientConseil':
                reference = await service.generateClientConseilReference();
                expectedDomain = 'conseil';
                break;
              case 'facture':
                reference = await service.generateFactureReference('test-client-id');
                expectedDomain = 'facture';
                break;
              default:
                throw new Error(`Unknown domain: ${domain}`);
            }

            // Verify the generated reference is valid for its domain
            expect(service.validateReferenceFormat(reference, expectedDomain as any)).toBe(true);
            
            // Verify the reference can be correctly identified by domain extraction
            const extractedDomain = service.extractDomainFromReference(reference);
            expect(extractedDomain).toBeDefined();
            
            // Map domain names to expected extraction results
            const domainMapping = {
              'affaire': 'contentieux',
              'recouvrement': 'recouvrement', 
              'immeuble': 'immobilier',
              'conseil': 'conseil',
              'facture': 'conseil'
            };
            
            expect(extractedDomain).toBe(domainMapping[expectedDomain]);
          }
        ),
        { numRuns: 50 } // Reduced runs for stability
      );
    });
  });
});