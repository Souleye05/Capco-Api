import { Test, TestingModule } from '@nestjs/testing';
import { AffairesService } from './affaires.service';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AffairesService', () => {
    let service: AffairesService;
    let prismaService: PrismaService;
    let paginationService: PaginationService;
    let referenceGeneratorService: ReferenceGeneratorService;

    const mockAffaire = {
        id: 'affaire-uuid-1',
        reference: 'AFF-2026-0001',
        intitule: 'Dupont c/ Martin - Expulsion',
        statut: 'ACTIVE',
        observations: 'Test observation',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        createdBy: 'user-uuid-1',
        parties_affaires: [
            { id: 'p1', nom: 'Dupont', role: 'DEMANDEUR', telephone: '0612345678', adresse: '123 Rue Test' },
            { id: 'p2', nom: 'Martin', role: 'DEFENDEUR', telephone: '0687654321', adresse: '456 Rue Autre' },
        ],
        audiences: [
            { id: 'aud-1', date: new Date('2026-03-15'), type: 'MISE_EN_ETAT', juridiction: 'TGI Dakar', chambre: '1ère', ville: 'Dakar', statut: 'A_VENIR' },
        ],
        honorairesContentieuxes: [
            { montantFacture: 150000 },
        ],
        depensesAffaireses: [
            { montant: 25000 },
        ],
    };

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
        generateAffaireReference: jest.fn().mockResolvedValue('AFF-2026-0001'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AffairesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: PaginationService, useValue: mockPaginationService },
                { provide: ReferenceGeneratorService, useValue: mockReferenceGeneratorService },
            ],
        }).compile();

        service = module.get<AffairesService>(AffairesService);
        prismaService = module.get<PrismaService>(PrismaService);
        paginationService = module.get<PaginationService>(PaginationService);
        referenceGeneratorService = module.get<ReferenceGeneratorService>(ReferenceGeneratorService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an affaire with generated reference and parties', async () => {
            const createDto = {
                intitule: 'Dupont c/ Martin - Expulsion',
                demandeurs: [{ nom: 'Dupont', telephone: '0612345678' }],
                defendeurs: [{ nom: 'Martin', telephone: '0687654321' }],
                observations: 'Test',
            };

            const createdAffaire = { id: 'new-id', reference: 'AFF-2026-0001' };
            mockPrismaService.$transaction.mockImplementation(async (fn) => {
                return fn({
                    affaires: { create: jest.fn().mockResolvedValue(createdAffaire) },
                    parties_affaires: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
                });
            });
            mockPrismaService.affaires.findUnique.mockResolvedValue({ ...mockAffaire, id: 'new-id' });

            const result = await service.create(createDto, 'user-uuid-1');

            expect(mockReferenceGeneratorService.generateAffaireReference).toHaveBeenCalled();
            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.reference).toBe('AFF-2026-0001');
        });

        it('should throw BadRequestException for invalid userId', async () => {
            const createDto = {
                intitule: 'Test',
                demandeurs: [{ nom: 'Dupont' }],
                defendeurs: [{ nom: 'Martin' }],
            };

            await expect(service.create(createDto, 123 as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findOne', () => {
        it('should return an affaire by ID', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(mockAffaire);

            const result = await service.findOne('affaire-uuid-1');

            expect(result).toBeDefined();
            expect(result.id).toBe('affaire-uuid-1');
            expect(result.reference).toBe('AFF-2026-0001');
            expect(result.demandeurs).toHaveLength(1);
            expect(result.defendeurs).toHaveLength(1);
            expect(result.totalHonoraires).toBe(150000);
            expect(result.totalDepenses).toBe(25000);
        });

        it('should throw NotFoundException when affaire not found', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByReference', () => {
        it('should return an affaire by reference', async () => {
            mockPrismaService.affaires.findFirst.mockResolvedValue(mockAffaire);

            const result = await service.findByReference('AFF-2026-0001');

            expect(result).toBeDefined();
            expect(result.reference).toBe('AFF-2026-0001');
        });

        it('should throw NotFoundException when reference not found', async () => {
            mockPrismaService.affaires.findFirst.mockResolvedValue(null);

            await expect(service.findByReference('AFF-9999-9999')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        it('should return paginated affaires', async () => {
            mockPaginationService.paginate.mockResolvedValue({
                data: [mockAffaire],
                pagination: { total: 1, page: 1, limit: 10, pages: 1 },
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
        });

        it('should filter by statut', async () => {
            mockPaginationService.paginate.mockResolvedValue({
                data: [mockAffaire],
                pagination: { total: 1, page: 1, limit: 10, pages: 1 },
            });

            await service.findAll({ page: 1, limit: 10, statut: 'ACTIVE' as any });

            expect(mockPaginationService.paginate).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ statut: 'ACTIVE' }),
                expect.objectContaining({
                    where: { statut: 'ACTIVE' },
                }),
            );
        });
    });

    describe('update', () => {
        it('should update an affaire', async () => {
            const updatedAffaire = { ...mockAffaire, intitule: 'Nouveau titre' };
            mockPrismaService.affaires.findUnique.mockResolvedValue(mockAffaire);
            mockPrismaService.$transaction.mockImplementation(async (fn) => {
                return fn({
                    affaires: { update: jest.fn().mockResolvedValue(updatedAffaire) },
                    parties_affaires: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
                        createMany: jest.fn().mockResolvedValue({ count: 2 }),
                    },
                });
            });
            // Second call to findOne after update
            mockPrismaService.affaires.findUnique.mockResolvedValue(updatedAffaire);

            const result = await service.update('affaire-uuid-1', { intitule: 'Nouveau titre' });

            expect(result).toBeDefined();
        });

        it('should throw NotFoundException when updating non-existent affaire', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(null);

            await expect(
                service.update('non-existent', { intitule: 'Test' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete an affaire', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(mockAffaire);
            mockPrismaService.affaires.delete.mockResolvedValue(mockAffaire);

            await service.remove('affaire-uuid-1');

            expect(mockPrismaService.affaires.delete).toHaveBeenCalledWith({
                where: { id: 'affaire-uuid-1' },
            });
        });

        it('should throw NotFoundException when deleting non-existent affaire', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(null);

            await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getStatistics', () => {
        it('should return correct statistics', async () => {
            mockPrismaService.affaires.count
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(6)  // actives
                .mockResolvedValueOnce(3)  // cloturees
                .mockResolvedValueOnce(1); // radiees

            const result = await service.getStatistics();

            expect(result).toEqual({
                total: 10,
                actives: 6,
                cloturees: 3,
                radiees: 1,
            });
        });
    });

    describe('mapToResponseDto', () => {
        it('should correctly separate demandeurs and defendeurs from parties', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(mockAffaire);

            const result = await service.findOne('affaire-uuid-1');

            expect(result.demandeurs).toEqual([
                { nom: 'Dupont', role: 'DEMANDEUR', telephone: '0612345678', adresse: '123 Rue Test' },
            ]);
            expect(result.defendeurs).toEqual([
                { nom: 'Martin', role: 'DEFENDEUR', telephone: '0687654321', adresse: '456 Rue Autre' },
            ]);
        });

        it('should include derniere audience when available', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(mockAffaire);

            const result = await service.findOne('affaire-uuid-1');

            expect(result.derniereAudience).toBeDefined();
            expect(result.derniereAudience!.juridiction).toBe('TGI Dakar');
        });

        it('should handle missing parties gracefully', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue({
                ...mockAffaire,
                parties_affaires: undefined,
            });

            const result = await service.findOne('affaire-uuid-1');

            expect(result.demandeurs).toEqual([]);
            expect(result.defendeurs).toEqual([]);
        });

        it('should calculate totals correctly', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue({
                ...mockAffaire,
                honorairesContentieuxes: [
                    { montantFacture: 100000 },
                    { montantFacture: 50000 },
                ],
                depensesAffaireses: [
                    { montant: 15000 },
                    { montant: 10000 },
                ],
            });

            const result = await service.findOne('affaire-uuid-1');

            expect(result.totalHonoraires).toBe(150000);
            expect(result.totalDepenses).toBe(25000);
        });
    });
});
