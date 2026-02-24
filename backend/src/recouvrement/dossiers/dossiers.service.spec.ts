import { Test, TestingModule } from '@nestjs/testing';
import { DossiersService } from './dossiers.service';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { ReferenceGeneratorService } from '../../common/services/reference-generator.service';
import { NotFoundException } from '@nestjs/common';
import * as fc from 'fast-check';

describe('DossiersService', () => {
    let service: DossiersService;
    let prisma: PrismaService;

    const mockPrismaService = {
        dossiersRecouvrement: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            aggregate: jest.fn(),
        },
        paiementsRecouvrement: {
            aggregate: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const mockReferenceGenerator = {
        generateDossierRecouvrementReference: jest.fn().mockResolvedValue('DOS-REC-001'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DossiersService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: PaginationService, useValue: mockPaginationService },
                { provide: ReferenceGeneratorService, useValue: mockReferenceGenerator },
            ],
        }).compile();

        service = module.get<DossiersService>(DossiersService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a dossier and optionally an initial honoraire', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        creancierNom: fc.string({ minLength: 1 }),
                        debiteurNom: fc.string({ minLength: 1 }),
                        montantPrincipal: fc.float({ min: 0, noDefaultInfinity: true }),
                        penalitesInterets: fc.option(fc.float({ min: 0, noDefaultInfinity: true })),
                        honoraire: fc.option(fc.record({
                            type: fc.constantFrom('FORFAIT', 'POURCENTAGE', 'MIXTE'),
                            montantPrevu: fc.float({ min: 0, noDefaultInfinity: true }),
                        })),
                    }),
                    fc.uuid(),
                    async (dto, userId) => {
                        const expectedDossier = {
                            id: fc.uuid(),
                            reference: 'DOS-REC-001',
                            ...dto,
                            totalARecouvrer: dto.montantPrincipal + (dto.penalitesInterets || 0),
                            statut: 'EN_COURS',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            paiementsRecouvrements: [],
                            actionsRecouvrements: [],
                        };

                        mockPrismaService.dossiersRecouvrement.create.mockResolvedValue(expectedDossier);
                        mockPrismaService.dossiersRecouvrement.findUnique.mockResolvedValue(expectedDossier);

                        const result = await service.create(dto as any, userId);

                        expect(mockPrismaService.dossiersRecouvrement.create).toHaveBeenCalled();
                        expect(result.reference).toBe('DOS-REC-001');
                        expect(result.montantPrincipal).toBe(dto.montantPrincipal);
                    }
                ),
                { numRuns: 10 }
            );
        });
    });

    describe('findOne', () => {
        it('should throw NotFoundException when dossier does not exist', async () => {
            mockPrismaService.dossiersRecouvrement.findUnique.mockResolvedValue(null);
            await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
        });

        it('should return the dossier when it exists', async () => {
            const dossier = { id: 'uuid', reference: 'REF-1', montantPrincipal: 100, totalARecouvrer: 100 };
            mockPrismaService.dossiersRecouvrement.findUnique.mockResolvedValue(dossier);

            const result = await service.findOne('uuid');
            expect(result.id).toBe('uuid');
            expect(mockPrismaService.dossiersRecouvrement.findUnique).toHaveBeenCalledWith({
                where: { id: 'uuid' },
                include: expect.any(Object),
            });
        });
    });

    describe('update', () => {
        it('should recalculate totalARecouvrer when montantPrincipal changes', async () => {
            const existingDossier = { id: 'uuid', montantPrincipal: 100, penalitesInterets: 20, totalARecouvrer: 120 };
            mockPrismaService.dossiersRecouvrement.findUnique.mockResolvedValue(existingDossier);

            await service.update('uuid', { montantPrincipal: 200 });

            expect(mockPrismaService.dossiersRecouvrement.update).toHaveBeenCalledWith({
                where: { id: 'uuid' },
                data: expect.objectContaining({
                    montantPrincipal: 200,
                    totalARecouvrer: 220, // 200 + 20
                }),
            });
        });
    });
});
