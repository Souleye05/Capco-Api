import { Test, TestingModule } from '@nestjs/testing';
import { AudiencesService } from './audiences.service';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AudiencesService', () => {
    let service: AudiencesService;

    const mockAudience = {
        id: 'audience-uuid-1',
        date: new Date('2026-03-15T12:00:00.000Z'),
        heure: '14:30',
        type: 'MISE_EN_ETAT',
        juridiction: 'TGI Dakar',
        chambre: '1ère Chambre',
        ville: 'Dakar',
        statut: 'A_VENIR',
        notesPreparation: 'Documents prêts',
        est_preparee: true,
        rappel_enrolement: true,
        date_rappel_enrolement: new Date('2026-03-11T12:00:00.000Z'),
        enrolement_effectue: false,
        affaireId: 'affaire-uuid-1',
        createdAt: new Date('2026-01-01'),
        updated_at: new Date('2026-01-01'),
        createdBy: 'user-uuid-1',
        affaire: {
            id: 'affaire-uuid-1',
            reference: 'AFF-2026-0001',
            intitule: 'Dupont c/ Martin',
            parties_affaires: [
                { id: 'p1', nom: 'Dupont', role: 'DEMANDEUR' },
                { id: 'p2', nom: 'Martin', role: 'DEFENDEUR' },
            ],
        },
        resultat: [],
    };

    const mockPrismaService = {
        audiences: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        resultatsAudiences: {
            create: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
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
                AudiencesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: PaginationService, useValue: mockPaginationService },
            ],
        }).compile();

        service = module.get<AudiencesService>(AudiencesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an audience with valid data', async () => {
            const createDto = {
                affaireId: 'affaire-uuid-1',
                date: '2026-03-18', // A Wednesday
                heure: '14:30',
                type: 'MISE_EN_ETAT' as const,
                juridiction: 'TGI Dakar',
                chambre: '1ère',
            };

            mockPrismaService.affaires.findUnique.mockResolvedValue({ id: 'affaire-uuid-1' });
            mockPrismaService.audiences.create.mockResolvedValue(mockAudience);

            const result = await service.create(createDto, 'user-uuid-1');

            expect(result).toBeDefined();
            expect(result.affaireId).toBe('affaire-uuid-1');
        });

        it('should throw NotFoundException when affaire does not exist', async () => {
            mockPrismaService.affaires.findUnique.mockResolvedValue(null);

            const createDto = {
                affaireId: 'non-existent',
                date: '2026-03-18',
                juridiction: 'TGI Dakar',
            };

            await expect(service.create(createDto, 'user-uuid-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findOne', () => {
        it('should return an audience by ID', async () => {
            mockPrismaService.audiences.findUnique.mockResolvedValue(mockAudience);

            const result = await service.findOne('audience-uuid-1');

            expect(result).toBeDefined();
            expect(result.id).toBe('audience-uuid-1');
            expect(result.juridiction).toBe('TGI Dakar');
        });

        it('should throw NotFoundException when audience not found', async () => {
            mockPrismaService.audiences.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        it('should return paginated audiences', async () => {
            mockPaginationService.paginate.mockResolvedValue({
                data: [mockAudience],
                pagination: { total: 1, page: 1, limit: 10, pages: 1 },
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
        });
    });

    describe('update', () => {
        it('should update an audience', async () => {
            const updatedAudience = { ...mockAudience, heure: '16:00' };
            mockPrismaService.audiences.findUnique.mockResolvedValue(mockAudience);
            mockPrismaService.audiences.update.mockResolvedValue(updatedAudience);

            const result = await service.update('audience-uuid-1', { heure: '16:00' });

            expect(result).toBeDefined();
        });

        it('should throw NotFoundException when updating non-existent audience', async () => {
            mockPrismaService.audiences.findUnique.mockResolvedValue(null);

            await expect(
                service.update('non-existent', { heure: '16:00' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete an audience', async () => {
            mockPrismaService.audiences.findUnique.mockResolvedValue(mockAudience);
            mockPrismaService.audiences.delete.mockResolvedValue(mockAudience);

            await service.remove('audience-uuid-1');

            expect(mockPrismaService.audiences.delete).toHaveBeenCalledWith({
                where: { id: 'audience-uuid-1' },
            });
        });

        it('should throw NotFoundException when deleting non-existent audience', async () => {
            mockPrismaService.audiences.findUnique.mockResolvedValue(null);

            await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('createResultat', () => {
        it('should create a result for an audience', async () => {
            const createResultatDto = {
                type: 'RENVOI' as const,
                nouvelleDate: '2026-04-15',
                motifRenvoi: 'Absence avocat',
            };

            mockPrismaService.audiences.findUnique.mockResolvedValue(mockAudience);
            mockPrismaService.resultatsAudiences.create.mockResolvedValue({
                id: 'resultat-1',
                ...createResultatDto,
                audienceId: 'audience-uuid-1',
            });
            mockPrismaService.audiences.update.mockResolvedValue({
                ...mockAudience,
                statut: 'RENSEIGNEE',
            });

            const result = await service.createResultat('audience-uuid-1', createResultatDto, 'user-uuid-1');

            expect(result).toBeDefined();
        });
    });

    describe('marquerEnrolementEffectue', () => {
        it('should mark enrollment as done', async () => {
            const updatedAudience = { ...mockAudience, enrolement_effectue: true };
            mockPrismaService.audiences.findUnique.mockResolvedValue(mockAudience);
            mockPrismaService.audiences.update.mockResolvedValue(updatedAudience);

            const result = await service.marquerEnrolementEffectue('audience-uuid-1');

            expect(result).toBeDefined();
            expect(mockPrismaService.audiences.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'audience-uuid-1' },
                    data: expect.objectContaining({ enrolement_effectue: true }),
                }),
            );
        });
    });

    describe('getStatistics', () => {
        it('should return audience statistics', async () => {
            mockPrismaService.audiences.count
                .mockResolvedValueOnce(20) // total
                .mockResolvedValueOnce(8)  // aVenir
                .mockResolvedValueOnce(10) // tenues (RENSEIGNEE)
                .mockResolvedValueOnce(2); // nonRenseignees

            const result = await service.getStatistics();

            expect(result).toEqual({
                total: 20,
                aVenir: 8,
                tenues: 10,
                nonRenseignees: 2,
            });
        });
    });

    describe('mapToResponseDto', () => {
        it('should map audience data to response DTO', async () => {
            mockPrismaService.audiences.findUnique.mockResolvedValue(mockAudience);

            const result = await service.findOne('audience-uuid-1');

            expect(result.id).toBe('audience-uuid-1');
            expect(result.affaire).toBeDefined();
            expect(result.affaire.reference).toBe('AFF-2026-0001');
            expect(result.statut).toBe('A_VENIR');
            expect(result.rappelEnrolement).toBe(true);
            expect(result.enrolementEffectue).toBe(false);
        });
    });
});
