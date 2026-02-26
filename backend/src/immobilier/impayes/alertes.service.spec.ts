import { Test, TestingModule } from '@nestjs/testing';
import { AlertesService } from './alertes.service';
import { PrismaService } from '../../common/services/prisma.service';
import { TypeAlerte, PrioriteAlerte } from '@prisma/client';

describe('AlertesService', () => {
  let service: AlertesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockLot = {
    id: 'lot-1',
    numero: 'A101',
    immeuble: {
      id: 'immeuble-1',
      nom: 'Résidence Test',
      reference: 'REF-001'
    },
    locataire: {
      id: 'locataire-1',
      nom: 'John Doe'
    }
  };

  const mockAlerte = {
    id: 'alerte-1',
    type: TypeAlerte.LOYER_IMPAYE,
    titre: 'Loyer impayé - Résidence Test - Lot A101',
    description: 'Le locataire John Doe a un impayé de 50 000 XOF pour le mois 2026-02. Retard: 10 jours.',
    lien: '/immobilier/lots/lot-1',
    priorite: PrioriteAlerte.MOYENNE,
    lu: false,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const mockPrismaService = {
      lots: {
        findUnique: jest.fn(),
        findMany: jest.fn()
      },
      alertes: {
        create: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn()
      }
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ],
    }).compile();

    service = module.get<AlertesService>(AlertesService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('genererAlerteImpaye', () => {
    it('should create alert for unpaid rent with correct priority (BASSE)', async () => {
      (prismaService.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
      (prismaService.alertes.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.alertes.create as jest.Mock).mockResolvedValue(mockAlerte);

      await service.genererAlerteImpaye('lot-1', '2026-02', 25000, 10, 'user-1');

      expect(prismaService.alertes.create).toHaveBeenCalledWith({
        data: {
          type: TypeAlerte.LOYER_IMPAYE,
          titre: 'Loyer impayé - Résidence Test - Lot A101',
          description: 'Le locataire John Doe a un impayé de 25 000 XOF pour le mois 2026-02. Retard: 10 jours.',
          lien: '/immobilier/lots/lot-1',
          priorite: PrioriteAlerte.BASSE,
          lu: false,
          userId: 'user-1'
        }
      });
    });

    it('should create alert with MOYENNE priority for 30+ days late', async () => {
      (prismaService.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
      (prismaService.alertes.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.alertes.create as jest.Mock).mockResolvedValue(mockAlerte);

      await service.genererAlerteImpaye('lot-1', '2026-02', 50000, 35, 'user-1');

      expect(prismaService.alertes.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priorite: PrioriteAlerte.MOYENNE
        })
      });
    });

    it('should create alert with HAUTE priority for 60+ days late', async () => {
      (prismaService.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
      (prismaService.alertes.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.alertes.create as jest.Mock).mockResolvedValue(mockAlerte);

      await service.genererAlerteImpaye('lot-1', '2026-02', 75000, 65, 'user-1');

      expect(prismaService.alertes.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priorite: PrioriteAlerte.HAUTE
        })
      });
    });

    it('should not create duplicate alert for same lot and month', async () => {
      (prismaService.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
      (prismaService.alertes.findFirst as jest.Mock).mockResolvedValue(mockAlerte);

      await service.genererAlerteImpaye('lot-1', '2026-02', 50000, 10, 'user-1');

      expect(prismaService.alertes.create).not.toHaveBeenCalled();
    });

    it('should handle lot not found gracefully', async () => {
      (prismaService.lots.findUnique as jest.Mock).mockResolvedValue(null);

      await service.genererAlerteImpaye('lot-1', '2026-02', 50000, 10, 'user-1');

      expect(prismaService.alertes.create).not.toHaveBeenCalled();
    });

    it('should handle lot without tenant', async () => {
      const lotWithoutTenant = {
        ...mockLot,
        locataire: null
      };

      (prismaService.lots.findUnique as jest.Mock).mockResolvedValue(lotWithoutTenant);
      (prismaService.alertes.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.alertes.create as jest.Mock).mockResolvedValue(mockAlerte);

      await service.genererAlerteImpaye('lot-1', '2026-02', 50000, 10, 'user-1');

      expect(prismaService.alertes.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: expect.stringContaining('Locataire non renseigné')
        })
      });
    });

    it('should handle database errors gracefully', async () => {
      (prismaService.lots.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(service.genererAlerteImpaye('lot-1', '2026-02', 50000, 10, 'user-1'))
        .resolves.toBeUndefined();
    });
  });

  describe('genererAlertesImpayesPourMois', () => {
    it('should generate alerts for all unpaid lots in month', async () => {
      const lotsWithUnpaidRent = [
        {
          id: 'lot-1',
          loyerMensuelAttendu: 50000,
          statut: 'OCCUPE',
          immeuble: { nom: 'Résidence A' },
          locataire: { nom: 'John Doe' },
          encaissementsLoyers: []
        },
        {
          id: 'lot-2',
          loyerMensuelAttendu: 40000,
          statut: 'OCCUPE',
          immeuble: { nom: 'Résidence B' },
          locataire: { nom: 'Jane Smith' },
          encaissementsLoyers: [{ montantEncaisse: 20000 }]
        }
      ];

      (prismaService.lots.findMany as jest.Mock).mockResolvedValue(lotsWithUnpaidRent);
      
      // Mock genererAlerteImpaye to avoid actual alert creation
      const genererAlerteSpy = jest.spyOn(service, 'genererAlerteImpaye').mockResolvedValue();

      const result = await service.genererAlertesImpayesPourMois('2026-02', 'user-1');

      expect(result).toBe(2);
      expect(genererAlerteSpy).toHaveBeenCalledTimes(2);
      expect(genererAlerteSpy).toHaveBeenCalledWith('lot-1', '2026-02', 50000, expect.any(Number), 'user-1');
      expect(genererAlerteSpy).toHaveBeenCalledWith('lot-2', '2026-02', 20000, expect.any(Number), 'user-1');
    });

    it('should skip lots without defined rent', async () => {
      const lotsWithInvalidRent = [
        {
          id: 'lot-1',
          loyerMensuelAttendu: null,
          statut: 'OCCUPE',
          immeuble: { nom: 'Résidence A' },
          locataire: { nom: 'John Doe' },
          encaissementsLoyers: []
        },
        {
          id: 'lot-2',
          loyerMensuelAttendu: 0,
          statut: 'OCCUPE',
          immeuble: { nom: 'Résidence B' },
          locataire: { nom: 'Jane Smith' },
          encaissementsLoyers: []
        }
      ];

      (prismaService.lots.findMany as jest.Mock).mockResolvedValue(lotsWithInvalidRent);
      
      const genererAlerteSpy = jest.spyOn(service, 'genererAlerteImpaye').mockResolvedValue();

      const result = await service.genererAlertesImpayesPourMois('2026-02', 'user-1');

      expect(result).toBe(0);
      expect(genererAlerteSpy).not.toHaveBeenCalled();
    });

    it('should skip lots with full payment', async () => {
      const lotsWithFullPayment = [
        {
          id: 'lot-1',
          loyerMensuelAttendu: 50000,
          statut: 'OCCUPE',
          immeuble: { nom: 'Résidence A' },
          locataire: { nom: 'John Doe' },
          encaissementsLoyers: [{ montantEncaisse: 50000 }]
        }
      ];

      (prismaService.lots.findMany as jest.Mock).mockResolvedValue(lotsWithFullPayment);
      
      const genererAlerteSpy = jest.spyOn(service, 'genererAlerteImpaye').mockResolvedValue();

      const result = await service.genererAlertesImpayesPourMois('2026-02', 'user-1');

      expect(result).toBe(0);
      expect(genererAlerteSpy).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (prismaService.lots.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await service.genererAlertesImpayesPourMois('2026-02', 'user-1');

      expect(result).toBe(0);
    });
  });

  describe('supprimerAlertesImpayesResolues', () => {
    it('should delete resolved unpaid rent alerts', async () => {
      (prismaService.alertes.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      await service.supprimerAlertesImpayesResolues('lot-1', '2026-02');

      expect(prismaService.alertes.deleteMany).toHaveBeenCalledWith({
        where: {
          type: TypeAlerte.LOYER_IMPAYE,
          lien: '/immobilier/lots/lot-1',
          description: {
            contains: '2026-02'
          }
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      (prismaService.alertes.deleteMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(service.supprimerAlertesImpayesResolues('lot-1', '2026-02'))
        .resolves.toBeUndefined();
    });
  });

  describe('calculerJoursRetard', () => {
    beforeEach(() => {
      // Mock current date to 2026-02-15
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-15'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate days late correctly for current month', () => {
      // Access private method through service instance
      const calculerJoursRetard = (service as any).calculerJoursRetard;
      
      const joursRetard = calculerJoursRetard('2026-02');
      
      // From Feb 5 to Feb 15 = 10 days
      expect(joursRetard).toBe(10);
    });

    it('should calculate days late correctly for previous month', () => {
      const calculerJoursRetard = (service as any).calculerJoursRetard;
      
      const joursRetard = calculerJoursRetard('2026-01');
      
      // From Jan 5 to Feb 15 = 41 days
      expect(joursRetard).toBe(41);
    });

    it('should return 0 for future months', () => {
      const calculerJoursRetard = (service as any).calculerJoursRetard;
      
      const joursRetard = calculerJoursRetard('2026-03');
      
      expect(joursRetard).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large unpaid amounts', async () => {
      (prismaService.lots.findUnique as jest.Mock).mockResolvedValue(mockLot);
      (prismaService.alertes.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.alertes.create as jest.Mock).mockResolvedValue(mockAlerte);

      await service.genererAlerteImpaye('lot-1', '2026-02', 1000000, 10, 'user-1');

      expect(prismaService.alertes.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: expect.stringContaining('1 000 000 XOF')
        })
      });
    });

    it('should handle special characters in tenant names', async () => {
      const lotWithSpecialChars = {
        ...mockLot,
        locataire: {
          id: 'locataire-1',
          nom: "Jean-Pierre O'Connor"
        }
      };

      (prismaService.lots.findUnique as jest.Mock).mockResolvedValue(lotWithSpecialChars);
      (prismaService.alertes.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.alertes.create as jest.Mock).mockResolvedValue(mockAlerte);

      await service.genererAlerteImpaye('lot-1', '2026-02', 50000, 10, 'user-1');

      expect(prismaService.alertes.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: expect.stringContaining("Jean-Pierre O'Connor")
        })
      });
    });
  });
});