import { Test, TestingModule } from '@nestjs/testing';
import { HonorairesService } from './honoraires.service';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { NotFoundException } from '@nestjs/common';

describe('HonorairesService', () => {
    let service: HonorairesService;

    const mockHonoraire = {
        id: 'honoraire-uuid-1',
        affaireId: 'affaire-uuid-1',
        montantFacture: 150000,
        montantEncaisse: 50000,
        dateFacturation: new Date('2026-02-01'),
        notes: 'Honoraires de plaidoirie',
        createdAt: new Date('2026-01-01'),
        createdBy: 'user-uuid-1',
        affaires: {
            id: 'affaire-uuid-1',
            reference: 'AFF-2026-0001',
            intitule: 'Dupont c/ Martin',
            parties_affaires: [
                { id: 'p1', nom: 'Dupont', role: 'DEMANDEUR' },
            ],
        },
        paiementsHonorairesContentieuxes: [
            { id: 'pay-1', date: new Date('2026-02-10'), montant: 30000, modePaiement: 'VIREMENT', notes: 'Premier versement' },
            { id: 'pay-2', date: new Date('2026-02-20'), montant: 20000, modePaiement: 'CHEQUE', notes: 'Second versement' },
        ],
    };

    const mockPrismaService = {
        honorairesContentieux: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
        },
        affaires: {
            findUnique: jest.fn(),
        },
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HonorairesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: PaginationService, useValue: mockPaginationService },
            ],
        }).compile();

        service = module.get<HonorairesService>(HonorairesService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an honoraire when affaire exists', async () => {
            const createDto = {
                affaireId: 'affaire-uuid-1',
                montantFacture: 150000,
                montantEncaisse: 50000,
                dateFacturation: '2026-02-01',
                notes: 'Honoraires de plaidoirie',
            };

            mockPrismaService.affaires.findUnique.mockResolvedValue({ id: 'affaire-uuid-1' });
            mockPrismaService.honorairesContentieux.create.mockResolvedValue(mockHonoraire);

            const result = await service.create(createDto, 'user-uuid-1');

            expect(result).toBeDefined();
            expect(result.affaireId).toBe('affaire-uuid-1');
            expect(result.montantFacture).toBe(150000);
        });

        it('should throw NotFoundException when affaire does not exist', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(null);

            const createDto = {
                affaireId: 'non-existent',
                montantFacture: 150000,
            };

            await expect(service.create(createDto, 'user-uuid-1')).rejects.toThrow(NotFoundException);
        });

        it('should default montantEncaisse to 0 if not provided', async () => {
            const createDto = {
                affaireId: 'affaire-uuid-1',
                montantFacture: 150000,
            };

            mockPrismaService.affaires.findUnique.mockResolvedValue({ id: 'affaire-uuid-1' });
            mockPrismaService.honorairesContentieux.create.mockResolvedValue({
                ...mockHonoraire,
                montantEncaisse: 0,
            });

            const result = await service.create(createDto, 'user-uuid-1');

            expect(result.montantEncaisse).toBe(0);
        });
    });

    describe('findOne', () => {
        it('should return an honoraire by ID', async () => {
            mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(mockHonoraire);

            const result = await service.findOne('honoraire-uuid-1');

            expect(result).toBeDefined();
            expect(result.id).toBe('honoraire-uuid-1');
            expect(result.affaire.reference).toBe('AFF-2026-0001');
        });

        it('should throw NotFoundException when honoraire not found', async () => {
            mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        it('should return paginated honoraires', async () => {
            mockPaginationService.paginate.mockResolvedValue({
                data: [mockHonoraire],
                pagination: { total: 1, page: 1, limit: 10, pages: 1 },
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
        });
    });

    describe('findByAffaire', () => {
        it('should return honoraires for a given affaire', async () => {
            mockPrismaService.honorairesContentieux.findMany.mockResolvedValue([mockHonoraire]);

            const result = await service.findByAffaire('affaire-uuid-1');

            expect(result).toHaveLength(1);
            expect(result[0].affaireId).toBe('affaire-uuid-1');
        });

        it('should return empty array when no honoraires found', async () => {
            mockPrismaService.honorairesContentieux.findMany.mockResolvedValue([]);

            const result = await service.findByAffaire('affaire-no-honoraires');

            expect(result).toHaveLength(0);
        });
    });

    describe('update', () => {
        it('should update an honoraire', async () => {
            const updatedHonoraire = { ...mockHonoraire, montantEncaisse: 100000 };
            mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(mockHonoraire);
            mockPrismaService.honorairesContentieux.update.mockResolvedValue(updatedHonoraire);

            const result = await service.update('honoraire-uuid-1', { montantEncaisse: 100000 });

            expect(result).toBeDefined();
        });

        it('should throw NotFoundException when updating non-existent honoraire', async () => {
            jest.clearAllMocks();
            mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(null);

            await expect(
                service.update('non-existent', { montantEncaisse: 100000 }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete an honoraire', async () => {
            mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(mockHonoraire);
            mockPrismaService.honorairesContentieux.delete.mockResolvedValue(mockHonoraire);

            await service.remove('honoraire-uuid-1');

            expect(mockPrismaService.honorairesContentieux.delete).toHaveBeenCalledWith({
                where: { id: 'honoraire-uuid-1' },
            });
        });
    });

    describe('getStatistics', () => {
        it('should return correct statistics', async () => {
            mockPrismaService.honorairesContentieux.aggregate.mockResolvedValue({
                _sum: {
                    montantFacture: 500000,
                    montantEncaisse: 300000,
                },
                _count: 5,
            });

            const result = await service.getStatistics();

            expect(result).toEqual({
                totalFacture: 500000,
                totalEncaisse: 300000,
                totalRestant: 200000,
                nombreHonoraires: 5,
            });
        });

        it('should handle null sums gracefully', async () => {
            mockPrismaService.honorairesContentieux.aggregate.mockResolvedValue({
                _sum: {
                    montantFacture: null,
                    montantEncaisse: null,
                },
                _count: 0,
            });

            const result = await service.getStatistics();

            expect(result).toEqual({
                totalFacture: 0,
                totalEncaisse: 0,
                totalRestant: 0,
                nombreHonoraires: 0,
            });
        });
    });

    describe('mapToResponseDto', () => {
        it('should calculate montantRestant correctly from payments', async () => {
            mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(mockHonoraire);

            const result = await service.findOne('honoraire-uuid-1');

            // montantFacture (150000) - sum of payments (30000 + 20000  = 50000) = 100000
            expect(result.montantRestant).toBe(100000);
        });

        it('should include payment details', async () => {
            mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(mockHonoraire);

            const result = await service.findOne('honoraire-uuid-1');

            expect(result.paiements).toHaveLength(2);
            expect(result.paiements[0].montant).toBe(30000);
            expect(result.paiements[0].modePaiement).toBe('VIREMENT');
        });

        it('should include affaire summary with parties', async () => {
            mockPrismaService.honorairesContentieux.findUnique.mockResolvedValue(mockHonoraire);

            const result = await service.findOne('honoraire-uuid-1');

            expect(result.affaire).toBeDefined();
            expect(result.affaire.reference).toBe('AFF-2026-0001');
            expect(result.affaire.parties).toHaveLength(1);
        });
    });
});
