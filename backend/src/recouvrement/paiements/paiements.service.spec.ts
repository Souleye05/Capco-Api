import { Test, TestingModule } from '@nestjs/testing';
import { PaiementsService } from './paiements.service';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PaiementsService', () => {
    let service: PaiementsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        dossiersRecouvrement: {
            findUnique: jest.fn(),
        },
        paiementsRecouvrement: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaiementsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<PaiementsService>(PaiementsService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should throw NotFoundException if dossier does not exist', async () => {
            mockPrismaService.dossiersRecouvrement.findUnique.mockResolvedValue(null);

            await expect(service.create({
                dossierId: 'invalid',
                date: '2026-02-24',
                montant: 5000,
                mode: 'ESPECES'
            } as any, 'user')).rejects.toThrow(NotFoundException);
        });

        it('should create a payment if dossier exists', async () => {
            mockPrismaService.dossiersRecouvrement.findUnique.mockResolvedValue({ id: 'dossier-1' });
            mockPrismaService.paiementsRecouvrement.create.mockResolvedValue({
                id: 'paiement-1',
                montant: 5000,
                date: new Date(),
            });

            const result = await service.create({
                dossierId: 'dossier-1',
                date: '2026-02-24',
                montant: 5000,
                mode: 'ESPECES'
            } as any, 'user');

            expect(result.id).toBe('paiement-1');
            expect(mockPrismaService.paiementsRecouvrement.create).toHaveBeenCalled();
        });
    });

    describe('getStatistics', () => {
        it('should return aggregated payment statistics', async () => {
            mockPrismaService.paiementsRecouvrement.aggregate.mockResolvedValue({
                _sum: { montant: 15000 },
                _count: 3
            });
            mockPrismaService.paiementsRecouvrement.groupBy.mockResolvedValue([
                { mode: 'ESPECES', _sum: { montant: 10000 }, _count: 2 },
                { mode: 'CHEQUE', _sum: { montant: 5000 }, _count: 1 }
            ]);

            const stats = await service.getStatistics();

            expect(stats.totalMontant).toBe(15000);
            expect(stats.parMode).toHaveLength(2);
            expect(stats.parMode[0].mode).toBe('ESPECES');
        });
    });
});
