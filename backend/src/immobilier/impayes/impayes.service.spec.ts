import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ImpayesService } from './impayes.service';
import { PrismaService } from '../../common/services/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { AlertesService } from './alertes.service';
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
  let alertesService: jest.Mocked<AlertesService>;

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

    const mockAlertesService = {
      genererAlerteImpaye: jest.fn(),
      genererAlertesImpayesPourMois: jest.fn()
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
        },
        {
          provide: AlertesService,
          useValue: mockAlertesService
        }
      ],
    }).compile();

    service = module.get<ImpayesService>(ImpayesService);
    prismaService = module.get(PrismaService);
    paginationService = module.get(PaginationService);
    alertesService = module.get(AlertesService);
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

  describe('genererAlerteImpaye', () => {
    it('should generate alert for unpaid rent', async () => {
      const lotWithUnpaidRent = {
        ...mockLot,
        encaissementsLoyers: []
      };

      jest.spyOn(service, 'detecterImpayesPourMois').mockResolvedValue({
        data: [{
          lotId: 'lot-1',
          lotNumero: 'A101',
          immeubleId: 'immeuble-1',
          immeubleNom: 'Résidence Test',
          immeubleReference: 'REF-001',
          locataireId: 'locataire-1',
          locataireNom: 'John Doe',
          moisConcerne: '2026-02',
          montantAttendu: 50000,
          montantEncaisse: 0,
          montantManquant: 50000,
          nombreJoursRetard: 10,
          statut: 'IMPAYE',
          dateEcheance: new Date('2026-02-05')
        }],
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      await service.genererAlerteImpaye('lot-1', '2026-02', 'user-1');

      expect(alertesService.genererAlerteImpaye).toHaveBeenCalledWith(
        'lot-1',
        '2026-02',
        50000,
        10,
        'user-1'
      );
    });

    it('should not generate alert if no unpaid rent found', async () => {
      jest.spyOn(service, 'detecterImpayesPourMois').mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 1,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      await service.genererAlerteImpaye('lot-1', '2026-02', 'user-1');

      expect(alertesService.genererAlerteImpaye).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(service, 'detecterImpayesPourMois').mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(service.genererAlerteImpaye('lot-1', '2026-02', 'user-1')).resolves.toBeUndefined();
    });
  });

  describe('genererAlertesImpayesMoisCourant', () => {
    it('should generate alerts for current month', async () => {
      (alertesService.genererAlertesImpayesPourMois as jest.Mock).mockResolvedValue(5);

      const result = await service.genererAlertesImpayesMoisCourant('user-1');

      expect(result).toBe(5);
      expect(alertesService.genererAlertesImpayesPourMois).toHaveBeenCalledWith('2026-02', 'user-1');
    });
  });

  describe('getImpayesParImmeuble', () => {
    it('should get unpaid rents for specific building', async () => {
      const mockImpayes = [{
        lotId: 'lot-1',
        lotNumero: 'A101',
        immeubleId: 'immeuble-1',
        immeubleNom: 'Résidence Test',
        immeubleReference: 'REF-001',
        locataireId: 'locataire-1',
        locataireNom: 'John Doe',
        moisConcerne: '2026-02',
        montantAttendu: 50000,
        montantEncaisse: 0,
        montantManquant: 50000,
        nombreJoursRetard: 10,
        statut: 'IMPAYE' as const,
        dateEcheance: new Date('2026-02-05')
      }];

      jest.spyOn(service, 'detecterImpayesPourMois').mockResolvedValue({
        data: mockImpayes,
        pagination: {
          page: 1,
          limit: 1000,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      const result = await service.getImpayesParImmeuble('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockImpayes);
      expect(service.detecterImpayesPourMois).toHaveBeenCalledWith({
        mois: '2026-02',
        immeubleId: '123e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 1000
      });
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(service.getImpayesParImmeuble('invalid-uuid'))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('getImpayesParLot', () => {
    it('should get unpaid rents for specific lot', async () => {
      const mockImpayes = [{
        lotId: 'lot-1',
        lotNumero: 'A101',
        immeubleId: 'immeuble-1',
        immeubleNom: 'Résidence Test',
        immeubleReference: 'REF-001',
        locataireId: 'locataire-1',
        locataireNom: 'John Doe',
        moisConcerne: '2026-02',
        montantAttendu: 50000,
        montantEncaisse: 0,
        montantManquant: 50000,
        nombreJoursRetard: 10,
        statut: 'IMPAYE' as const,
        dateEcheance: new Date('2026-02-05')
      }];

      jest.spyOn(service, 'detecterImpayesPourMois').mockResolvedValue({
        data: mockImpayes,
        pagination: {
          page: 1,
          limit: 1000,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      const result = await service.getImpayesParLot('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockImpayes);
      expect(service.detecterImpayesPourMois).toHaveBeenCalledWith({
        mois: '2026-02',
        lotId: '123e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 1000
      });
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(service.getImpayesParLot('invalid-uuid'))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('edge cases and business logic', () => {
    it('should handle lots with zero rent correctly', async () => {
      const lotWithZeroRent = {
        ...mockLot,
        loyerMensuelAttendu: 0,
        encaissementsLoyers: []
      };

      (paginationService.paginate as jest.Mock).mockResolvedValue({
        data: [lotWithZeroRent],
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

    it('should handle lots with overpayment correctly', async () => {
      const lotWithOverpayment = {
        ...mockLot,
        encaissementsLoyers: [
          { montantEncaisse: 60000 } // Plus que le loyer attendu
        ]
      };

      (paginationService.paginate as jest.Mock).mockResolvedValue({
        data: [lotWithOverpayment],
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

    it('should handle multiple partial payments correctly', async () => {
      const lotWithMultiplePayments = {
        ...mockLot,
        encaissementsLoyers: [
          { montantEncaisse: 20000 },
          { montantEncaisse: 15000 },
          { montantEncaisse: 10000 }
        ]
      };

      (paginationService.paginate as jest.Mock).mockResolvedValue({
        data: [lotWithMultiplePayments],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      jest.spyOn(RentCalculator, 'calculerJoursRetard').mockReturnValue(5);
      jest.spyOn(RentCalculator, 'calculerDateEcheance').mockReturnValue(new Date('2026-02-05'));

      const query = {
        mois: '2026-02',
        page: 1,
        limit: 20
      };

      const result = await service.detecterImpayesPourMois(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        montantAttendu: 50000,
        montantEncaisse: 45000, // 20000 + 15000 + 10000
        montantManquant: 5000,
        statut: 'PARTIEL'
      });
    });

    it('should handle lots without tenant correctly', async () => {
      const lotWithoutTenant = {
        ...mockLot,
        locataire: null,
        encaissementsLoyers: []
      };

      (paginationService.paginate as jest.Mock).mockResolvedValue({
        data: [lotWithoutTenant],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      jest.spyOn(RentCalculator, 'calculerJoursRetard').mockReturnValue(10);
      jest.spyOn(RentCalculator, 'calculerDateEcheance').mockReturnValue(new Date('2026-02-05'));

      const query = {
        mois: '2026-02',
        page: 1,
        limit: 20
      };

      const result = await service.detecterImpayesPourMois(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].locataireNom).toBe('Non Renseigné');
      expect(result.data[0].locataireId).toBeUndefined();
    });
  });
});