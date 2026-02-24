import { Test, TestingModule } from '@nestjs/testing';
import { ActionsService } from './actions.service';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ActionsService', () => {
    let service: ActionsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        dossiersRecouvrement: {
            findUnique: jest.fn(),
        },
        actionsRecouvrement: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ActionsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<ActionsService>(ActionsService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should throw NotFoundException if dossier does not exist', async () => {
            mockPrismaService.dossiersRecouvrement.findUnique.mockResolvedValue(null);

            await expect(service.create({
                dossierId: 'invalid',
                date: '2026-02-24',
                typeAction: 'APPEL_TELEPHONIQUE',
                resume: 'test'
            } as any, 'user')).rejects.toThrow(NotFoundException);
        });

        it('should create an action if dossier exists', async () => {
            mockPrismaService.dossiersRecouvrement.findUnique.mockResolvedValue({ id: 'dossier-1' });
            mockPrismaService.actionsRecouvrement.create.mockResolvedValue({
                id: 'action-1',
                dossierId: 'dossier-1',
                date: new Date(),
                typeAction: 'APPEL_TELEPHONIQUE',
                resume: 'test',
            });

            const result = await service.create({
                dossierId: 'dossier-1',
                date: '2026-02-24',
                typeAction: 'APPEL_TELEPHONIQUE',
                resume: 'test'
            } as any, 'user');

            expect(result.id).toBe('action-1');
            expect(mockPrismaService.actionsRecouvrement.create).toHaveBeenCalled();
        });
    });
});
