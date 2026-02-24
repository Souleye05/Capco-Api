import { Test, TestingModule } from '@nestjs/testing';
import { DepensesService } from './depenses.service';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { NotFoundException } from '@nestjs/common';

describe('DepensesService', () => {
    let service: DepensesService;

    const mockDepense = {
        id: 'depense-uuid-1',
        affaireId: 'affaire-uuid-1',
        date: new Date('2026-02-15'),
        typeDepense: 'FRAIS_JUSTICE',
        nature: 'Huissier',
        montant: 25000,
        description: 'Signification assignation',
        justificatif: 'Facture huissier n°123',
        createdAt: new Date('2026-02-15'),
        createdBy: 'user-uuid-1',
        affaires: {
            id: 'affaire-uuid-1',
            reference: 'AFF-2026-0001',
            intitule: 'Dupont c/ Martin',
            parties_affaires: [
                { id: 'p1', nom: 'Dupont', role: 'DEMANDEUR' },
            ],
        },
    };

    const mockPrismaService = {
        depensesAffaires: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
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
                DepensesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: PaginationService, useValue: mockPaginationService },
            ],
        }).compile();

        service = module.get<DepensesService>(DepensesService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a depense when affaire exists', async () => {
            const createDto = {
                affaireId: 'affaire-uuid-1',
                typeDepense: 'FRAIS_JUSTICE',
                nature: 'Huissier',
                montant: 25000,
                description: 'Signification assignation',
            };

            mockPrismaService.affaires.findUnique.mockResolvedValue({ id: 'affaire-uuid-1' });
            mockPrismaService.depensesAffaires.create.mockResolvedValue(mockDepense);

            const result = await service.create(createDto, 'user-uuid-1');

            expect(result).toBeDefined();
            expect(result.affaireId).toBe('affaire-uuid-1');
            expect(result.montant).toBe(25000);
        });

        it('should throw NotFoundException when affaire does not exist', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(null);

            await expect(
                service.create({ affaireId: 'non-existent', typeDepense: 'FRAIS', nature: 'Test' }, 'user-uuid-1'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should use default date when not provided', async () => {
            const createDto = {
                affaireId: 'affaire-uuid-1',
                typeDepense: 'FRAIS_JUSTICE',
                nature: 'Huissier',
            };

            mockPrismaService.affaires.findUnique.mockResolvedValue({ id: 'affaire-uuid-1' });
            mockPrismaService.depensesAffaires.create.mockResolvedValue(mockDepense);

            await service.create(createDto, 'user-uuid-1');

            expect(mockPrismaService.depensesAffaires.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        date: expect.any(Date),
                    }),
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return a depense by ID', async () => {
            mockPrismaService.depensesAffaires.findUnique.mockResolvedValue(mockDepense);

            const result = await service.findOne('depense-uuid-1');

            expect(result).toBeDefined();
            expect(result.id).toBe('depense-uuid-1');
            expect(result.typeDepense).toBe('FRAIS_JUSTICE');
        });

        it('should throw NotFoundException when depense not found', async () => {
            mockPrismaService.depensesAffaires.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        it('should return paginated depenses', async () => {
            mockPaginationService.paginate.mockResolvedValue({
                data: [mockDepense],
                pagination: { total: 1, page: 1, limit: 10, pages: 1 },
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
        });
    });

    describe('findByAffaire', () => {
        it('should return depenses for a given affaire', async () => {
            mockPrismaService.depensesAffaires.findMany.mockResolvedValue([mockDepense]);

            const result = await service.findByAffaire('affaire-uuid-1');

            expect(result).toHaveLength(1);
            expect(result[0].affaireId).toBe('affaire-uuid-1');
        });
    });

    describe('findByType', () => {
        it('should return depenses by type', async () => {
            mockPrismaService.depensesAffaires.findMany.mockResolvedValue([mockDepense]);

            const result = await service.findByType('FRAIS_JUSTICE');

            expect(result).toHaveLength(1);
            expect(result[0].typeDepense).toBe('FRAIS_JUSTICE');
        });
    });

    describe('update', () => {
        it('should update a depense', async () => {
            const updatedDepense = { ...mockDepense, montant: 30000 };
            mockPrismaService.depensesAffaires.findUnique.mockResolvedValue(mockDepense);
            mockPrismaService.depensesAffaires.update.mockResolvedValue(updatedDepense);

            const result = await service.update('depense-uuid-1', { montant: 30000 });

            expect(result).toBeDefined();
        });

        it('should throw NotFoundException when updating non-existent depense', async () => {
            jest.clearAllMocks();
            mockPrismaService.depensesAffaires.findUnique.mockResolvedValue(null);

            await expect(
                service.update('non-existent', { montant: 30000 }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete a depense', async () => {
            mockPrismaService.depensesAffaires.findUnique.mockResolvedValue(mockDepense);
            mockPrismaService.depensesAffaires.delete.mockResolvedValue(mockDepense);

            await service.remove('depense-uuid-1');

            expect(mockPrismaService.depensesAffaires.delete).toHaveBeenCalledWith({
                where: { id: 'depense-uuid-1' },
            });
        });
    });

    describe('getStatistics', () => {
        it('should return correct statistics with type breakdown', async () => {
            mockPrismaService.depensesAffaires.aggregate.mockResolvedValue({
                _sum: { montant: 100000 },
                _count: 4,
            });
            mockPrismaService.depensesAffaires.groupBy.mockResolvedValue([
                { typeDepense: 'FRAIS_JUSTICE', _sum: { montant: 60000 }, _count: 2 },
                { typeDepense: 'FRAIS_DEPLACEMENT', _sum: { montant: 40000 }, _count: 2 },
            ]);

            const result = await service.getStatistics();

            expect(result.totalMontant).toBe(100000);
            expect(result.nombreDepenses).toBe(4);
            expect(result.parType).toHaveLength(2);
            expect(result.parType[0].type).toBe('FRAIS_JUSTICE');
            expect(result.parType[0].montant).toBe(60000);
        });

        it('should handle no depenses gracefully', async () => {
            mockPrismaService.depensesAffaires.aggregate.mockResolvedValue({
                _sum: { montant: null },
                _count: 0,
            });
            mockPrismaService.depensesAffaires.groupBy.mockResolvedValue([]);

            const result = await service.getStatistics();

            expect(result.totalMontant).toBe(0);
            expect(result.nombreDepenses).toBe(0);
            expect(result.parType).toHaveLength(0);
        });
    });

    describe('getRapportPeriode', () => {
        it('should return a period report with type breakdown', async () => {
            const depensesData = [
                { ...mockDepense, typeDepense: 'FRAIS_JUSTICE', montant: 25000 },
                { ...mockDepense, id: 'dep-2', typeDepense: 'FRAIS_DEPLACEMENT', montant: 15000 },
            ];
            mockPrismaService.depensesAffaires.findMany.mockResolvedValue(depensesData);

            const dateDebut = new Date('2026-01-01');
            const dateFin = new Date('2026-03-31');

            const result = await service.getRapportPeriode(dateDebut, dateFin);

            expect(result.periode.dateDebut).toEqual(dateDebut);
            expect(result.periode.dateFin).toEqual(dateFin);
            expect(result.totalMontant).toBe(40000);
            expect(result.nombreDepenses).toBe(2);
            expect(result.parType).toHaveLength(2);
            expect(result.depenses).toHaveLength(2);
        });
    });

    describe('mapToResponseDto', () => {
        it('should include affaire summary with parties', async () => {
            mockPrismaService.depensesAffaires.findUnique.mockResolvedValue(mockDepense);

            const result = await service.findOne('depense-uuid-1');

            expect(result.affaire).toBeDefined();
            expect(result.affaire.reference).toBe('AFF-2026-0001');
            expect(result.affaire.parties).toHaveLength(1);
        });
    });
});
