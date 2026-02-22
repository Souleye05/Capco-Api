import { Test, TestingModule } from '@nestjs/testing';
import { AudienceCronService } from './audience-cron.service';
import { PrismaService } from '../../common/services/prisma.service';
import { StatutAudience } from '@prisma/client';

describe('AudienceCronService', () => {
  let service: AudienceCronService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    audiences: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudienceCronService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AudienceCronService>(AudienceCronService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePassedAudienceStatuses', () => {
    it('should update passed audiences to PASSEE_NON_RENSEIGNEE', async () => {
      mockPrismaService.audiences.updateMany.mockResolvedValue({ count: 2 });

      await service.updatePassedAudienceStatuses();

      expect(mockPrismaService.audiences.updateMany).toHaveBeenCalledWith({
        where: {
          date: {
            lt: expect.any(Date),
          },
          statut: StatutAudience.A_VENIR,
        },
        data: {
          statut: StatutAudience.PASSEE_NON_RENSEIGNEE,
          updated_at: expect.any(Date),
        },
      });
    });

    it('should handle case when no audiences need updating', async () => {
      mockPrismaService.audiences.updateMany.mockResolvedValue({ count: 0 });

      await service.updatePassedAudienceStatuses();

      expect(mockPrismaService.audiences.updateMany).toHaveBeenCalled();
    });

    it('should handle errors gracefully without throwing', async () => {
      const error = new Error('Database error');
      mockPrismaService.audiences.updateMany.mockRejectedValue(error);

      // Should not throw
      await expect(service.updatePassedAudienceStatuses()).resolves.toBeUndefined();
    });

    it('should skip execution if already running', async () => {
      // Set isRunning to true by starting an execution
      const promise1 = service.updatePassedAudienceStatuses();
      const promise2 = service.updatePassedAudienceStatuses();

      await Promise.all([promise1, promise2]);

      // Should only be called once due to isRunning flag
      expect(mockPrismaService.audiences.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('triggerManualUpdate', () => {
    it('should call updatePassedAudienceStatuses', async () => {
      const spy = jest.spyOn(service, 'updatePassedAudienceStatuses').mockResolvedValue();

      await service.triggerManualUpdate();

      expect(spy).toHaveBeenCalled();
    });
  });
});