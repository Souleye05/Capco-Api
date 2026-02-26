import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ArrieragesService } from './arrierages.service';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { StatutArrierage, ModePaiement } from '@prisma/client';

describe('ArrieragesService', () => {
    let service: ArrieragesService;
    let prisma: PrismaService;
    let paginationService: PaginationService;

    const mockLot = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        numero: 'A101',
        immeuble: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            nom: 'Résidence Test',
            reference: 'REF-001'
        },
        locataire: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            nom: 'John Doe'
        }
    };

    const mockArrierage = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        lotId: '123e4567-e89b-12d3-a456-426614174000',
        periodeDebut: new Date('2024-01-01'),
        periodeFin: new Date('2024-03-31'),
        montantDu: 150000,
        montantPaye: 50000,
        montantRestant: 100000,
        statut: StatutArrierage.EN_COURS,
        description: 'Arriéré Q1 2024',
        createdAt: new Date(),
        createdBy: '123e4567-e89b-12d3-a456-426614174004',
        lot: mockLot,
        paiementsPartiels: []
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArrieragesService,
                {
                    provide: PrismaService,
                    useValue: {
                        lots: {
                            findUnique: jest.fn(),
                        },
                        arrieragesLoyers: {
                            create: jest.fn(),
                            findFirst: jest.fn(),
                            findUnique: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                            findMany: jest.fn(),
                        },
                        paiementsPartielsArrierages: {
                            create: jest.fn(),
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
            ],
        }).compile();

        service = module.get<ArrieragesService>(ArrieragesService);
        prisma = module.get<PrismaService>(PrismaService);
        paginationService = module.get<PaginationService>(PaginationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createArrierageDto = {
            lotId: '123e4567-e89b-12d3-a456-426614174000',
            periodeDebut: '2024-01-01',
            periodeFin: '2024-03-31',
            montantDu: 150000,
            description: 'Arriéré Q1 2024'
        };

        it('should create an arriéré successfully', async () => {
            (prisma.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
            (prisma.arrieragesLoyers.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.arrieragesLoyers.create as jest.Mock).mockResolvedValue(mockArrierage);

            const result = await service.create(createArrierageDto, '123e4567-e89b-12d3-a456-426614174004');

            expect(result).toBeDefined();
            expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174003');
            expect(result.montantDu).toBe(150000);
            expect(result.statut).toBe(StatutArrierage.EN_COURS);
        });

        it('should throw NotFoundException if lot does not exist', async () => {
            (prisma.lots.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.create(createArrierageDto, '123e4567-e89b-12d3-a456-426614174004'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if dates are invalid', async () => {
            const invalidDto = {
                ...createArrierageDto,
                periodeDebut: '2024-03-31',
                periodeFin: '2024-01-01'
            };

            (prisma.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);

            await expect(service.create(invalidDto, '123e4567-e89b-12d3-a456-426614174004'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if overlapping arriéré exists', async () => {
            (prisma.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
            (prisma.arrieragesLoyers.findFirst as jest.Mock).mockResolvedValue(mockArrierage);

            await expect(service.create(createArrierageDto, '123e4567-e89b-12d3-a456-426614174004'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return paginated arriérés', async () => {
            const query = { page: 1, limit: 10 };
            const mockPaginatedResult = {
                data: [mockArrierage],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false
                }
            };

            (paginationService.paginate as jest.Mock).mockResolvedValue(mockPaginatedResult);

            const result = await service.findAll(query);

            expect(result).toBeDefined();
            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('123e4567-e89b-12d3-a456-426614174003');
        });

        it('should validate UUID parameters', async () => {
            const query = { immeubleId: 'invalid-uuid' };

            await expect(service.findAll(query))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('enregistrerPaiementPartiel', () => {
        const createPaiementDto = {
            date: '2024-01-15',
            montant: 25000,
            mode: ModePaiement.CASH,
            reference: 'PAY-001',
            commentaire: 'Paiement partiel'
        };

        it('should register partial payment successfully', async () => {
            const updatedArrierage = {
                ...mockArrierage,
                montantPaye: 75000,
                montantRestant: 75000
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    arrieragesLoyers: {
                        findUnique: jest.fn().mockResolvedValue(mockArrierage),
                        update: jest.fn().mockResolvedValue(updatedArrierage)
                    },
                    paiementsPartielsArrierages: {
                        create: jest.fn().mockResolvedValue({})
                    }
                };
                return await callback(mockTx);
            });

            const result = await service.enregistrerPaiementPartiel(
                '123e4567-e89b-12d3-a456-426614174003',
                createPaiementDto,
                '123e4567-e89b-12d3-a456-426614174004'
            );

            expect(result).toBeDefined();
            expect(result.montantPaye).toBe(75000);
            expect(result.montantRestant).toBe(75000);
        });

        it('should mark arriéré as SOLDE when fully paid', async () => {
            const fullPaymentDto = {
                ...createPaiementDto,
                montant: 100000 // Full remaining amount
            };

            const soldeArrierage = {
                ...mockArrierage,
                montantPaye: 150000,
                montantRestant: 0,
                statut: StatutArrierage.SOLDE
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    arrieragesLoyers: {
                        findUnique: jest.fn().mockResolvedValue(mockArrierage),
                        update: jest.fn().mockResolvedValue(soldeArrierage)
                    },
                    paiementsPartielsArrierages: {
                        create: jest.fn().mockResolvedValue({})
                    }
                };
                return await callback(mockTx);
            });

            const result = await service.enregistrerPaiementPartiel(
                '123e4567-e89b-12d3-a456-426614174003',
                fullPaymentDto,
                '123e4567-e89b-12d3-a456-426614174004'
            );

            expect(result.statut).toBe(StatutArrierage.SOLDE);
            expect(result.montantRestant).toBe(0);
        });

        it('should throw NotFoundException if arriéré does not exist', async () => {
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    arrieragesLoyers: {
                        findUnique: jest.fn().mockResolvedValue(null)
                    }
                };
                return await callback(mockTx);
            });

            await expect(service.enregistrerPaiementPartiel(
                '123e4567-e89b-12d3-a456-426614174003',
                createPaiementDto,
                '123e4567-e89b-12d3-a456-426614174004'
            )).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if arriéré is already soldé', async () => {
            const soldeArrierage = { ...mockArrierage, statut: StatutArrierage.SOLDE };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    arrieragesLoyers: {
                        findUnique: jest.fn().mockResolvedValue(soldeArrierage)
                    }
                };
                return await callback(mockTx);
            });

            await expect(service.enregistrerPaiementPartiel(
                '123e4567-e89b-12d3-a456-426614174003',
                createPaiementDto,
                '123e4567-e89b-12d3-a456-426614174004'
            )).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if payment exceeds remaining amount', async () => {
            const largePaiementDto = { ...createPaiementDto, montant: 150000 };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    arrieragesLoyers: {
                        findUnique: jest.fn().mockResolvedValue(mockArrierage)
                    }
                };
                return await callback(mockTx);
            });

            await expect(service.enregistrerPaiementPartiel(
                '123e4567-e89b-12d3-a456-426614174003',
                largePaiementDto,
                '123e4567-e89b-12d3-a456-426614174004'
            )).rejects.toThrow(BadRequestException);
        });

        it('should handle different payment modes correctly', async () => {
            const chequePaiementDto = {
                ...createPaiementDto,
                mode: ModePaiement.CHEQUE,
                reference: 'CHQ-123456'
            };

            const updatedArrierage = {
                ...mockArrierage,
                montantPaye: 75000,
                montantRestant: 75000,
                paiementsPartiels: [{
                    id: 'paiement-1',
                    date: new Date('2024-01-15'),
                    montant: 25000,
                    mode: ModePaiement.CHEQUE,
                    reference: 'CHQ-123456',
                    commentaire: 'Paiement partiel',
                    createdAt: new Date(),
                    createdBy: '123e4567-e89b-12d3-a456-426614174004'
                }]
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    arrieragesLoyers: {
                        findUnique: jest.fn().mockResolvedValue(mockArrierage),
                        update: jest.fn().mockResolvedValue(updatedArrierage)
                    },
                    paiementsPartielsArrierages: {
                        create: jest.fn().mockResolvedValue({})
                    }
                };
                return await callback(mockTx);
            });

            const result = await service.enregistrerPaiementPartiel(
                '123e4567-e89b-12d3-a456-426614174003',
                chequePaiementDto,
                '123e4567-e89b-12d3-a456-426614174004'
            );

            expect(result.paiementsPartiels[0].mode).toBe(ModePaiement.CHEQUE);
            expect(result.paiementsPartiels[0].reference).toBe('CHQ-123456');
        });
    });

    describe('getStatistiquesArrierages', () => {
        it('should calculate statistics correctly', async () => {
            const mockArrierages = [
                {
                    ...mockArrierage,
                    statut: StatutArrierage.EN_COURS,
                    montantRestant: 100000,
                    montantPaye: 50000
                },
                {
                    ...mockArrierage,
                    id: '123e4567-e89b-12d3-a456-426614174005',
                    statut: StatutArrierage.SOLDE,
                    montantRestant: 0,
                    montantPaye: 75000
                }
            ];

            (prisma.arrieragesLoyers.findMany as jest.Mock).mockResolvedValue(mockArrierages);

            const result = await service.getStatistiquesArrierages();

            expect(result).toBeDefined();
            expect(result.totalMontantArrierage).toBe(100000);
            expect(result.nombreArrieragesEnCours).toBe(1);
            expect(result.nombreArrieragesSoldes).toBe(1);
            expect(result.totalMontantPaye).toBe(125000);
        });

        it('should filter by immeuble when provided', async () => {
            const mockArrierages = [mockArrierage];
            (prisma.arrieragesLoyers.findMany as jest.Mock).mockResolvedValue(mockArrierages);

            await service.getStatistiquesArrierages('123e4567-e89b-12d3-a456-426614174001');

            expect(prisma.arrieragesLoyers.findMany).toHaveBeenCalledWith({
                where: {
                    lot: { immeubleId: '123e4567-e89b-12d3-a456-426614174001' }
                },
                include: expect.any(Object)
            });
        });

        it('should throw BadRequestException for invalid immeubleId', async () => {
            await expect(service.getStatistiquesArrierages('invalid-uuid'))
                .rejects.toThrow(BadRequestException);
        });

        it('should calculate average age correctly', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 30); // 30 days ago

            const mockArrierages = [
                {
                    ...mockArrierage,
                    statut: StatutArrierage.EN_COURS,
                    createdAt: oldDate
                }
            ];

            (prisma.arrieragesLoyers.findMany as jest.Mock).mockResolvedValue(mockArrierages);

            const result = await service.getStatistiquesArrierages();

            expect(result.ancienneteMoyenne).toBe(30);
        });

        it('should handle empty results', async () => {
            (prisma.arrieragesLoyers.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.getStatistiquesArrierages();

            expect(result.totalMontantArrierage).toBe(0);
            expect(result.nombreArrieragesEnCours).toBe(0);
            expect(result.nombreArrieragesSoldes).toBe(0);
            expect(result.totalMontantPaye).toBe(0);
            expect(result.ancienneteMoyenne).toBe(0);
        });
    });

    describe('calculerTauxRecouvrement', () => {
        it('should calculate recovery rate correctly', async () => {
            jest.spyOn(service, 'getStatistiquesArrierages').mockResolvedValue({
                totalMontantArrierage: 100000,
                totalMontantPaye: 200000,
                nombreArrieragesEnCours: 2,
                nombreArrieragesSoldes: 3,
                repartitionParImmeuble: [],
                ancienneteMoyenne: 15
            });

            const result = await service.calculerTauxRecouvrement();

            // 200000 / (100000 + 200000) * 100 = 66.67% rounded to 67%
            expect(result).toBe(67);
        });

        it('should return 100% when no arrears exist', async () => {
            jest.spyOn(service, 'getStatistiquesArrierages').mockResolvedValue({
                totalMontantArrierage: 0,
                totalMontantPaye: 0,
                nombreArrieragesEnCours: 0,
                nombreArrieragesSoldes: 0,
                repartitionParImmeuble: [],
                ancienneteMoyenne: 0
            });

            const result = await service.calculerTauxRecouvrement();

            expect(result).toBe(100);
        });
    });

    describe('getRepartitionParLocataire', () => {
        it('should return arrears breakdown by tenant', async () => {
            const mockArrierages = [
                {
                    ...mockArrierage,
                    montantRestant: 50000,
                    lot: {
                        ...mockLot,
                        locataireId: 'locataire-1',
                        locataire: { nom: 'John Doe' }
                    }
                },
                {
                    ...mockArrierage,
                    id: 'arrierage-2',
                    montantRestant: 30000,
                    lot: {
                        ...mockLot,
                        locataireId: 'locataire-1',
                        locataire: { nom: 'John Doe' }
                    }
                },
                {
                    ...mockArrierage,
                    id: 'arrierage-3',
                    montantRestant: 75000,
                    lot: {
                        ...mockLot,
                        locataireId: 'locataire-2',
                        locataire: { nom: 'Jane Smith' }
                    }
                }
            ];

            (prisma.arrieragesLoyers.findMany as jest.Mock).mockResolvedValue(mockArrierages);

            const result = await service.getRepartitionParLocataire();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                locataireId: 'locataire-1',
                locataireNom: 'John Doe',
                montantTotal: 80000,
                nombreArrierages: 2
            });
            expect(result[1]).toEqual({
                locataireId: 'locataire-2',
                locataireNom: 'Jane Smith',
                montantTotal: 75000,
                nombreArrierages: 1
            });
        });

        it('should handle lots without tenant', async () => {
            const mockArrierages = [
                {
                    ...mockArrierage,
                    montantRestant: 50000,
                    lot: {
                        ...mockLot,
                        locataireId: null,
                        locataire: null
                    }
                }
            ];

            (prisma.arrieragesLoyers.findMany as jest.Mock).mockResolvedValue(mockArrierages);

            const result = await service.getRepartitionParLocataire();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                locataireId: 'sans-locataire',
                locataireNom: 'Sans locataire',
                montantTotal: 50000,
                nombreArrierages: 1
            });
        });

        it('should sort by total amount descending', async () => {
            const mockArrierages = [
                {
                    ...mockArrierage,
                    montantRestant: 30000,
                    lot: {
                        ...mockLot,
                        locataireId: 'locataire-1',
                        locataire: { nom: 'John Doe' }
                    }
                },
                {
                    ...mockArrierage,
                    id: 'arrierage-2',
                    montantRestant: 75000,
                    lot: {
                        ...mockLot,
                        locataireId: 'locataire-2',
                        locataire: { nom: 'Jane Smith' }
                    }
                }
            ];

            (prisma.arrieragesLoyers.findMany as jest.Mock).mockResolvedValue(mockArrierages);

            const result = await service.getRepartitionParLocataire();

            expect(result[0].locataireNom).toBe('Jane Smith'); // Higher amount first
            expect(result[1].locataireNom).toBe('John Doe');
        });
    });

    describe('update', () => {
        const updateDto = {
            montantDu: 200000,
            description: 'Updated description'
        };

        it('should update arriéré successfully', async () => {
            const updatedArrierage = {
                ...mockArrierage,
                montantDu: 200000,
                montantRestant: 150000, // 200000 - 50000 (existing montantPaye)
                description: 'Updated description'
            };

            (prisma.arrieragesLoyers.findUnique as jest.Mock).mockResolvedValue(mockArrierage);
            (prisma.arrieragesLoyers.update as jest.Mock).mockResolvedValue(updatedArrierage);

            const result = await service.update(
                '123e4567-e89b-12d3-a456-426614174003',
                updateDto,
                'user-1'
            );

            expect(result.montantDu).toBe(200000);
            expect(result.montantRestant).toBe(150000);
            expect(result.description).toBe('Updated description');
        });

        it('should validate date ranges when updating dates', async () => {
            const invalidDateDto = {
                periodeDebut: '2024-03-31',
                periodeFin: '2024-01-01'
            };

            (prisma.arrieragesLoyers.findUnique as jest.Mock).mockResolvedValue(mockArrierage);

            await expect(service.update(
                '123e4567-e89b-12d3-a456-426614174003',
                invalidDateDto,
                'user-1'
            )).rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should delete arriéré successfully', async () => {
            (prisma.arrieragesLoyers.findUnique as jest.Mock).mockResolvedValue(mockArrierage);
            (prisma.arrieragesLoyers.delete as jest.Mock).mockResolvedValue(mockArrierage);

            await service.remove('123e4567-e89b-12d3-a456-426614174003');

            expect(prisma.arrieragesLoyers.delete).toHaveBeenCalledWith({
                where: { id: '123e4567-e89b-12d3-a456-426614174003' }
            });
        });

        it('should throw NotFoundException when arriéré does not exist', async () => {
            (prisma.arrieragesLoyers.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.remove('123e4567-e89b-12d3-a456-426614174003'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('edge cases and validation', () => {
        it('should handle very large amounts correctly', async () => {
            const largeAmountDto = {
                ...mockArrierage,
                montantDu: 999999999
            };

            (prisma.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
            (prisma.arrieragesLoyers.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.arrieragesLoyers.create as jest.Mock).mockResolvedValue(largeAmountDto);

            const createDto = {
                lotId: '123e4567-e89b-12d3-a456-426614174000',
                periodeDebut: '2024-01-01',
                periodeFin: '2024-03-31',
                montantDu: 999999999
            };

            const result = await service.create(createDto, 'user-1');

            expect(result.montantDu).toBe(999999999);
        });

        it('should handle concurrent payment attempts gracefully', async () => {
            // This would be tested with actual database constraints in integration tests
            // Here we just ensure the service handles transaction errors
            (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction conflict'));

            const createPaiementDto = {
                date: '2024-01-15',
                montant: 25000,
                mode: ModePaiement.CASH
            };

            await expect(service.enregistrerPaiementPartiel(
                '123e4567-e89b-12d3-a456-426614174003',
                createPaiementDto,
                'user-1'
            )).rejects.toThrow();
        });
    });
});