import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ImpayesService } from './impayes.service';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { RentCalculator } from './rent-calculator';

// Mock des utilitaires de date
jest.mock('../../common/utils/date.utils', () => ({
  getCurrentImpayesMonth: jest.fn(() => '2026-02'),
  getCurrentMonthYM: jest.fn(() => '2026-02'),
  addMonthsToYM: jest.fn((base, offset) => {
    const [year, month] = base.split('-').map(Number);
    const newMonth = month + offset;
    const newYear = year + Math.floor((newMonth - 1) / 12);
    const finalMonth = ((newMonth - 1) % 12) + 1;
    return `${newYear}-${String(finalMonth).padStart(2, '0')}`;
  })
}));

describe('ImpayesService', () => {
  let service: ImpayesService;
  let prismaService: jest.Mocked<PrismaService>;
  let paginationService: jest.Mocked<PaginationService>;

  const mockLot = {
    id: 'lot-1',
    numero: 'A101',
    loyerMensuelAttendu: 50000,
    statut: 'OCCUPE',
    immeuble: {
      id: 'immeuble-1',
      nom: 'Résidence Test',
      reference: 'REF-001'
    },
    locataire: {
      id: 'locataire-1',
      nom: 'John Doe'
    },
    encaissementsLoyers: []
  };

  beforeEach(async () => {
    const mockPrismaService = {
      lots: {
        findMany: jest.fn(),
        count: jest.fn()
      },
      $transaction: jest.fn()
    } as any;

    const mockPaginationService = {
      paginate: jest.fn()
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpayesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService
        }
      ],
    }).compile();

    service = module.get<ImpayesService>(ImpayesService);
    prismaService = module.get(PrismaService);
    paginationService = module.get(PaginationService);
  });

  describe('detecterImpayesPourMois', () => {
    it('should validate month format', async () => {
      const query = {
        mois: 'invalid-format',
        page: 1,
        limit: 20
      };

      await expect(service.detecterImpayesPourMois(query))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should validate UUID format for immeubleId', async () => {
      const query = {
        mois: '2026-02',
        immeubleId: 'invalid-uuid',
        page: 1,
        limit: 20
      };

      await expect(service.detecterImpayesPourMois(query))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should validate year range', async () => {
      const query = {
        mois: '1999-02',
        page: 1,
        limit: 20
      };

      await expect(service.detecterImpayesPourMois(query))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should validate month range', async () => {
      const query = {
        mois: '2026-13',
        page: 1,
        limit: 20
      };

      await expect(service.detecterImpayesPourMois(query))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should detect unpaid rent correctly', async () => {
      const lotWithUnpaidRent = {
        ...mockLot,
        encaissementsLoyers: [
          { montantEncaisse: 25000 } // Paiement partiel
        ]
      };

      (paginationService.paginate as jest.Mock).mockResolvedValue({
        data: [lotWithUnpaidRent],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      // Mock RentCalculator
      jest.spyOn(RentCalculator, 'calculerJoursRetard').mockReturnValue(10);
      jest.spyOn(RentCalculator, 'calculerDateEcheance').mockReturnValue(new Date('2026-02-05'));

      const query = {
        mois: '2026-02',
        page: 1,
        limit: 20
      };

      const result = await service.detecterImpayesPourMois(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        lotId: 'lot-1',
        montantAttendu: 50000,
        montantEncaisse: 25000,
        montantManquant: 25000,
        statut: 'PARTIEL',
        nombreJoursRetard: 10
      });
    });

    it('should not include lots with full payment', async () => {
      const lotWithFullPayment = {
        ...mockLot,
        encaissementsLoyers: [
          { montantEncaisse: 50000 } // Paiement complet
        ]
      };

      (paginationService.paginate as jest.Mock).mockResolvedValue({
        data: [lotWithFullPayment],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      const query = {
        mois: '2026-02',
        page: 1,
        limit: 20
      };

      const result = await service.detecterImpayesPourMois(query);

      expect(result.data).toHaveLength(0);
    });

    it('should skip lots with invalid rent amount', async () => {
      const lotWithInvalidRent = {
        ...mockLot,
        loyerMensuelAttendu: null
      };

      (paginationService.paginate as jest.Mock).mockResolvedValue({
        data: [lotWithInvalidRent],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      const query = {
        mois: '2026-02',
        page: 1,
        limit: 20
      };

      const result = await service.detecterImpayesPourMois(query);

      expect(result.data).toHaveLength(0);
    });

    it('should sort by days late and amount', async () => {
      const lot1 = {
        ...mockLot,
        id: 'lot-1',
        numero: 'A101',
        loyerMensuelAttendu: 30000,
        encaissementsLoyers: []
      };

      const lot2 = {
        ...mockLot,
        id: 'lot-2',
        numero: 'A102',
        loyerMensuelAttendu: 50000,
        encaissementsLoyers: []
      };

      (paginationService.paginate as jest.Mock).mockResolvedValue({
        data: [lot1, lot2],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      // Mock different days late
      jest.spyOn(RentCalculator, 'calculerJoursRetard')
        .mockReturnValueOnce(5)  // lot1: 5 jours
        .mockReturnValueOnce(10); // lot2: 10 jours

      jest.spyOn(RentCalculator, 'calculerDateEcheance').mockReturnValue(new Date('2026-02-05'));

      const query = {
        mois: '2026-02',
        page: 1,
        limit: 20
      };

      const result = await service.detecterImpayesPourMois(query);

      expect(result.data).toHaveLength(2);
      // lot2 should be first (more days late)
      expect(result.data[0].lotId).toBe('lot-2');
      expect(result.data[1].lotId).toBe('lot-1');
    });
  });

  describe('getStatistiquesImpayes', () => {
    it('should validate immeubleId UUID format', async () => {
      await expect(service.getStatistiquesImpayes('invalid-uuid'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should calculate statistics correctly', async () => {
      // Mock detecterImpayesPourMois
      const mockImpayes = [
        {
          lotId: 'lot-1',
          immeubleId: 'immeuble-1',
          immeubleNom: 'Résidence A',
          montantManquant: 25000
        },
        {
          lotId: 'lot-2',
          immeubleId: 'immeuble-1',
          immeubleNom: 'Résidence A',
          montantManquant: 30000
        }
      ];

      jest.spyOn(service, 'detecterImpayesPourMois').mockResolvedValue({
        data: mockImpayes as any,
        pagination: {
          page: 1,
          limit: 1000,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      // Mock countLotsOccupes
      (prismaService.lots.count as jest.Mock).mockResolvedValue(10);

      // Mock calculateEvolutionMensuelle
      (prismaService.lots.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getStatistiquesImpayes();

      expect(result.totalMontantImpaye).toBe(55000);
      expect(result.nombreLotsImpayes).toBe(2);
      expect(result.tauxImpayes).toBe(20); // 2/10 * 100
      expect(result.repartitionParImmeuble).toHaveLength(1);
      expect(result.repartitionParImmeuble[0]).toMatchObject({
        immeubleId: 'immeuble-1',
        immeubleNom: 'Résidence A',
        montant: 55000,
        nombreLots: 2
      });
    });

    it('should handle zero occupied lots', async () => {
      jest.spyOn(service, 'detecterImpayesPourMois').mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 1000,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      (prismaService.lots.count as jest.Mock).mockResolvedValue(0);
      (prismaService.lots.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getStatistiquesImpayes();

      expect(result.tauxImpayes).toBe(0);
      expect(result.totalMontantImpaye).toBe(0);
      expect(result.nombreLotsImpayes).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      (paginationService.paginate as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const query = {
        mois: '2026-02',
        page: 1,
        limit: 20
      };

      await expect(service.detecterImpayesPourMois(query))
        .rejects
        .toThrow(InternalServerErrorException);
    });

    it('should preserve BadRequestException', async () => {
      const query = {
        mois: 'invalid',
        page: 1,
        limit: 20
      };

      await expect(service.detecterImpayesPourMois(query))
        .rejects
        .toThrow(BadRequestException);
    });
  });
});