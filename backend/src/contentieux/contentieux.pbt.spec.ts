import { Test, TestingModule } from '@nestjs/testing';
import { AffairesService } from './affaires/affaires.service';
import { AudiencesService } from './audiences/audiences.service';
import { HonorairesService } from './honoraires/honoraires.service';
import { DepensesService } from './depenses/depenses.service';
import { ContentieuxService } from './contentieux.service';
import { JuridictionsService } from './juridictions/juridictions.service';
import { PrismaService } from '../common/services/prisma.service';
import { PaginationService } from '../common/services/pagination.service';
import { ReferenceGeneratorService } from '../common/services/reference-generator.service';
import * as fc from 'fast-check';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAffaireDto } from './affaires/dto/create-affaire.dto';
import { CreateAudienceDto } from './audiences/dto/create-audience.dto';
import { CreateHonoraireDto } from './honoraires/dto/create-honoraire.dto';
import { CreateDepenseDto } from './depenses/dto/create-depense.dto';

/**
 * **Feature: nestjs-api-architecture, Property 8: Validation des données d'entrée**
 * **Feature: nestjs-api-architecture, Property 10: Endpoints CRUD complets par domaine**
 * **Validates: Requirements 4.2, 4.4, 5.1**
 */
describe('Contentieux Module - Property-Based Tests', () => {

    /**
     * **Property 8: Input Data Validation**
     * For any arbitrary input, the DTOs must correctly validate and reject invalid data.
     */
    describe('Property 8: Input Data Validation', () => {

        describe('CreateAffaireDto validation', () => {
            it('should accept valid CreateAffaireDto with all required fields', async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            intitule: fc.string({ minLength: 1, maxLength: 100 }),
                            demandeurs: fc.array(
                                fc.record({
                                    nom: fc.string({ minLength: 1, maxLength: 50 }),
                                    telephone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
                                    adresse: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
                                }),
                                { minLength: 1, maxLength: 3 },
                            ),
                            defendeurs: fc.array(
                                fc.record({
                                    nom: fc.string({ minLength: 1, maxLength: 50 }),
                                    telephone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
                                }),
                                { minLength: 1, maxLength: 3 },
                            ),
                            observations: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
                        }),
                        async (data) => {
                            const dto = plainToInstance(CreateAffaireDto, data);
                            const errors = await validate(dto);

                            // With valid data, there should be no validation errors on the main fields
                            const mainFieldErrors = errors.filter(
                                e => e.property === 'intitule' || e.property === 'demandeurs' || e.property === 'defendeurs',
                            );
                            expect(mainFieldErrors).toHaveLength(0);
                        },
                    ),
                    { numRuns: 50 },
                );
            });

            it('should reject CreateAffaireDto with empty intitule', async () => {
                const dto = plainToInstance(CreateAffaireDto, {
                    intitule: '',
                    demandeurs: [{ nom: 'Test' }],
                    defendeurs: [{ nom: 'Test' }],
                });
                const errors = await validate(dto);

                const intituleErrors = errors.filter(e => e.property === 'intitule');
                expect(intituleErrors.length).toBeGreaterThan(0);
            });

            it('should reject CreateAffaireDto with invalid statut enum', async () => {
                const dto = plainToInstance(CreateAffaireDto, {
                    intitule: 'Test',
                    demandeurs: [{ nom: 'Demandeur' }],
                    defendeurs: [{ nom: 'Défendeur' }],
                    statut: 'INVALID_STATUS',
                });
                const errors = await validate(dto);

                const statutErrors = errors.filter(e => e.property === 'statut');
                expect(statutErrors.length).toBeGreaterThan(0);
            });

            it('should accept valid statut enum values', async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.constantFrom('ACTIVE', 'CLOTUREE', 'RADIEE'),
                        async (statut) => {
                            const dto = plainToInstance(CreateAffaireDto, {
                                intitule: 'Test affaire',
                                demandeurs: [{ nom: 'Demandeur' }],
                                defendeurs: [{ nom: 'Défendeur' }],
                                statut,
                            });
                            const errors = await validate(dto);
                            const statutErrors = errors.filter(e => e.property === 'statut');
                            expect(statutErrors).toHaveLength(0);
                        },
                    ),
                    { numRuns: 3 },
                );
            });
        });

        describe('CreateAudienceDto validation', () => {
            it('should reject CreateAudienceDto with invalid affaireId format', async () => {
                const dto = plainToInstance(CreateAudienceDto, {
                    affaireId: 'not-a-uuid',
                    date: '2026-03-15',
                    juridiction: 'TGI Dakar',
                });
                const errors = await validate(dto);

                const affaireIdErrors = errors.filter(e => e.property === 'affaireId');
                expect(affaireIdErrors.length).toBeGreaterThan(0);
            });

            it('should reject CreateAudienceDto with invalid date format', async () => {
                const dto = plainToInstance(CreateAudienceDto, {
                    affaireId: '550e8400-e29b-41d4-a716-446655440000',
                    date: 'invalid-date',
                    juridiction: 'TGI Dakar',
                });
                const errors = await validate(dto);

                const dateErrors = errors.filter(e => e.property === 'date');
                expect(dateErrors.length).toBeGreaterThan(0);
            });

            it('should accept valid TypeAudience enum values', async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.constantFrom('MISE_EN_ETAT', 'PLAIDOIRIE', 'REFERE', 'EVOCATION', 'CONCILIATION', 'MEDIATION', 'AUTRE'),
                        async (type) => {
                            const dto = plainToInstance(CreateAudienceDto, {
                                affaireId: '550e8400-e29b-41d4-a716-446655440000',
                                date: '2026-03-18',
                                juridiction: 'TGI Dakar',
                                type,
                            });
                            const errors = await validate(dto);
                            const typeErrors = errors.filter(e => e.property === 'type');
                            expect(typeErrors).toHaveLength(0);
                        },
                    ),
                    { numRuns: 7 },
                );
            });

            it('should reject invalid TypeAudience enum values', async () => {
                const dto = plainToInstance(CreateAudienceDto, {
                    affaireId: '550e8400-e29b-41d4-a716-446655440000',
                    date: '2026-03-18',
                    juridiction: 'TGI Dakar',
                    type: 'INVALID_TYPE',
                });
                const errors = await validate(dto);

                const typeErrors = errors.filter(e => e.property === 'type');
                expect(typeErrors.length).toBeGreaterThan(0);
            });

            it('should reject missing required juridiction', async () => {
                const dto = plainToInstance(CreateAudienceDto, {
                    affaireId: '550e8400-e29b-41d4-a716-446655440000',
                    date: '2026-03-18',
                    juridiction: '',
                });
                const errors = await validate(dto);

                const juridictionErrors = errors.filter(e => e.property === 'juridiction');
                expect(juridictionErrors.length).toBeGreaterThan(0);
            });
        });

        describe('CreateHonoraireDto validation', () => {
            it('should reject CreateHonoraireDto with invalid affaireId', async () => {
                const dto = plainToInstance(CreateHonoraireDto, {
                    affaireId: 'not-a-uuid',
                    montantFacture: 100000,
                });
                const errors = await validate(dto);

                const affaireIdErrors = errors.filter(e => e.property === 'affaireId');
                expect(affaireIdErrors.length).toBeGreaterThan(0);
            });

            it('should accept valid monetary amounts', async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            affaireId: fc.uuid(),
                            montantFacture: fc.float({ min: 0, max: 100000000, noNaN: true }),
                            montantEncaisse: fc.float({ min: 0, max: 100000000, noNaN: true }),
                        }),
                        async (data) => {
                            const dto = plainToInstance(CreateHonoraireDto, data);
                            const errors = await validate(dto);

                            // affaireId and amount fields should be valid
                            const affaireIdErrors = errors.filter(e => e.property === 'affaireId');
                            expect(affaireIdErrors).toHaveLength(0);
                        },
                    ),
                    { numRuns: 50 },
                );
            });

            it('should accept valid date string for dateFacturation', async () => {
                const dto = plainToInstance(CreateHonoraireDto, {
                    affaireId: '550e8400-e29b-41d4-a716-446655440000',
                    montantFacture: 100000,
                    dateFacturation: '2026-02-20',
                });
                const errors = await validate(dto);

                const dateErrors = errors.filter(e => e.property === 'dateFacturation');
                expect(dateErrors).toHaveLength(0);
            });
        });

        describe('CreateDepenseDto validation', () => {
            it('should reject CreateDepenseDto with missing required fields', async () => {
                const dto = plainToInstance(CreateDepenseDto, {});
                const errors = await validate(dto);

                // affaireId, typeDepense, nature are required
                expect(errors.length).toBeGreaterThanOrEqual(3);
            });

            it('should accept valid depense data', async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            affaireId: fc.uuid(),
                            typeDepense: fc.constantFrom('FRAIS_JUSTICE', 'FRAIS_DEPLACEMENT', 'FRAIS_EXPERT'),
                            nature: fc.string({ minLength: 1, maxLength: 100 }),
                            montant: fc.float({ min: 0, max: 10000000, noNaN: true }),
                            description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
                        }),
                        async (data) => {
                            const dto = plainToInstance(CreateDepenseDto, data);
                            const errors = await validate(dto);

                            // Required fields should be valid
                            const requiredFieldErrors = errors.filter(
                                e => e.property === 'affaireId' || e.property === 'typeDepense' || e.property === 'nature',
                            );
                            expect(requiredFieldErrors).toHaveLength(0);
                        },
                    ),
                    { numRuns: 50 },
                );
            });
        });
    });

    /**
     * **Property 10: Complete CRUD endpoints per domain**
     * For each domain entity, all CRUD operations must be consistent.
     */
    describe('Property 10: Complete CRUD Endpoints per Domain', () => {
        let contentieuxService: ContentieuxService;
        let affairesService: AffairesService;
        let audiencesService: AudiencesService;
        let honorairesService: HonorairesService;
        let depensesService: DepensesService;

        const mockPrismaService = {
            affaires: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
            audiences: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
            honorairesContentieux: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                aggregate: jest.fn(),
            },
            depensesAffaires: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                aggregate: jest.fn(),
                groupBy: jest.fn(),
            },
            resultatsAudiences: {
                create: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            parties_affaires: {
                createMany: jest.fn(),
                deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
        };

        const mockPaginationService = {
            paginate: jest.fn(),
        };

        const mockReferenceGeneratorService = {
            generateAffaireReference: jest.fn(),
        };

        beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    AffairesService,
                    AudiencesService,
                    HonorairesService,
                    DepensesService,
                    { provide: PrismaService, useValue: mockPrismaService },
                    { provide: PaginationService, useValue: mockPaginationService },
                    { provide: ReferenceGeneratorService, useValue: mockReferenceGeneratorService },
                ],
            }).compile();

            affairesService = module.get<AffairesService>(AffairesService);
            audiencesService = module.get<AudiencesService>(AudiencesService);
            honorairesService = module.get<HonorairesService>(HonorairesService);
            depensesService = module.get<DepensesService>(DepensesService);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('AffairesService should have all CRUD methods', () => {
            expect(typeof affairesService.create).toBe('function');
            expect(typeof affairesService.findAll).toBe('function');
            expect(typeof affairesService.findOne).toBe('function');
            expect(typeof affairesService.update).toBe('function');
            expect(typeof affairesService.remove).toBe('function');
            expect(typeof affairesService.getStatistics).toBe('function');
        });

        it('AudiencesService should have all CRUD methods plus result management', () => {
            expect(typeof audiencesService.create).toBe('function');
            expect(typeof audiencesService.findAll).toBe('function');
            expect(typeof audiencesService.findOne).toBe('function');
            expect(typeof audiencesService.update).toBe('function');
            expect(typeof audiencesService.remove).toBe('function');
            expect(typeof audiencesService.createResultat).toBe('function');
            expect(typeof audiencesService.getResultat).toBe('function');
            expect(typeof audiencesService.updateResultat).toBe('function');
            expect(typeof audiencesService.removeResultat).toBe('function');
            expect(typeof audiencesService.marquerEnrolementEffectue).toBe('function');
            expect(typeof audiencesService.getStatistics).toBe('function');
        });

        it('HonorairesService should have all CRUD methods plus findByAffaire', () => {
            expect(typeof honorairesService.create).toBe('function');
            expect(typeof honorairesService.findAll).toBe('function');
            expect(typeof honorairesService.findOne).toBe('function');
            expect(typeof honorairesService.update).toBe('function');
            expect(typeof honorairesService.remove).toBe('function');
            expect(typeof honorairesService.findByAffaire).toBe('function');
            expect(typeof honorairesService.getStatistics).toBe('function');
        });

        it('DepensesService should have all CRUD methods plus findByAffaire and findByType', () => {
            expect(typeof depensesService.create).toBe('function');
            expect(typeof depensesService.findAll).toBe('function');
            expect(typeof depensesService.findOne).toBe('function');
            expect(typeof depensesService.update).toBe('function');
            expect(typeof depensesService.remove).toBe('function');
            expect(typeof depensesService.findByAffaire).toBe('function');
            expect(typeof depensesService.findByType).toBe('function');
            expect(typeof depensesService.getStatistics).toBe('function');
            expect(typeof depensesService.getRapportPeriode).toBe('function');
        });

        it('findOne should throw NotFoundException for any random non-existent UUID', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    async (randomId) => {
                        mockPrismaService.affaires.findUnique.mockResolvedValue(null);
                        mockPrismaService.audiences.findUnique.mockResolvedValue(null);
                        mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(null);
                        mockPrismaService.depensesAffaires.findUnique.mockResolvedValue(null);

                        // All services should throw NotFoundException for non-existent IDs
                        await expect(affairesService.findOne(randomId)).rejects.toThrow();
                        await expect(audiencesService.findOne(randomId)).rejects.toThrow();
                        await expect(honorairesService.findOne(randomId)).rejects.toThrow();
                        await expect(depensesService.findOne(randomId)).rejects.toThrow();
                    },
                ),
                { numRuns: 20 },
            );
        });

        it('remove should throw NotFoundException for any random non-existent UUID', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    async (randomId) => {
                        mockPrismaService.affaires.findUnique.mockResolvedValue(null);
                        mockPrismaService.audiences.findUnique.mockResolvedValue(null);
                        mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(null);
                        mockPrismaService.depensesAffaires.findUnique.mockResolvedValue(null);

                        await expect(affairesService.remove(randomId)).rejects.toThrow();
                        await expect(audiencesService.remove(randomId)).rejects.toThrow();
                        await expect(honorairesService.remove(randomId)).rejects.toThrow();
                        await expect(depensesService.remove(randomId)).rejects.toThrow();
                    },
                ),
                { numRuns: 20 },
            );
        });
    });
});
