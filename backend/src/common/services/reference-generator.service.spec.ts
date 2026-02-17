import { Test, TestingModule } from '@nestjs/testing';
import { ReferenceGeneratorService } from './reference-generator.service';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

describe('ReferenceGeneratorService', () => {
  let service: ReferenceGeneratorService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    affaires: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    dossiersRecouvrement: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    immeubles: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    clientsConseil: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    facturesConseil: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    executeTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferenceGeneratorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReferenceGeneratorService>(ReferenceGeneratorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAffaireReference', () => {
    it('should generate a reference with correct format', async () => {
      const currentYear = new Date().getFullYear();
      const expectedPattern = new RegExp(`^AFF-${currentYear}-\\d{3}$`);

      // Mock transaction execution
      mockPrismaService.executeTransaction.mockImplementation(async (fn) => {
        return await fn(mockPrismaService);
      });

      // Mock no existing reference
      mockPrismaService.affaires.findFirst.mockResolvedValue(null);

      const reference = await service.generateAffaireReference();

      expect(reference).toMatch(expectedPattern);
      expect(mockPrismaService.executeTransaction).toHaveBeenCalled();
    });

    it('should handle existing references and generate next available', async () => {
      const currentYear = new Date().getFullYear();
      
      // Mock transaction execution
      mockPrismaService.executeTransaction.mockImplementation(async (fn) => {
        return await fn(mockPrismaService);
      });

      // Mock first reference exists, second doesn't
      mockPrismaService.affaires.findFirst
        .mockResolvedValueOnce({ id: 'existing-id' }) // First call returns existing
        .mockResolvedValueOnce(null); // Second call returns null

      const reference = await service.generateAffaireReference();

      expect(reference).toBe(`AFF-${currentYear}-002`);
      expect(mockPrismaService.affaires.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateDossierRecouvrementReference', () => {
    it('should generate a reference with correct format', async () => {
      const expectedPattern = /^DOS-REC-\d{3}$/;

      // Mock transaction execution
      mockPrismaService.executeTransaction.mockImplementation(async (fn) => {
        return await fn(mockPrismaService);
      });

      // Mock no existing reference
      mockPrismaService.dossiersRecouvrement.findFirst.mockResolvedValue(null);

      const reference = await service.generateDossierRecouvrementReference();

      expect(reference).toMatch(expectedPattern);
      expect(reference).toBe('DOS-REC-001');
    });
  });

  describe('generateClientConseilReference', () => {
    it('should generate a reference with correct format', async () => {
      const expectedPattern = /^CLI-CONS-\d{3}$/;

      // Mock transaction execution
      mockPrismaService.executeTransaction.mockImplementation(async (fn) => {
        return await fn(mockPrismaService);
      });

      // Mock no existing reference
      mockPrismaService.clientsConseil.findFirst.mockResolvedValue(null);

      const reference = await service.generateClientConseilReference();

      expect(reference).toMatch(expectedPattern);
      expect(reference).toBe('CLI-CONS-001');
    });
  });

  describe('generateFactureReference', () => {
    it('should generate a reference with correct format', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const expectedPattern = new RegExp(`^FACT-${year}-${month}-\\d{3}$`);

      // Mock transaction execution
      mockPrismaService.executeTransaction.mockImplementation(async (fn) => {
        return await fn(mockPrismaService);
      });

      // Mock no existing reference
      mockPrismaService.facturesConseil.findFirst.mockResolvedValue(null);

      const reference = await service.generateFactureReference('client-id');

      expect(reference).toMatch(expectedPattern);
      expect(reference).toBe(`FACT-${year}-${month}-001`);
    });
  });

  describe('validateReferenceFormat', () => {
    it('should validate affaire reference format correctly', () => {
      expect(service.validateReferenceFormat('AFF-2024-001', 'affaire')).toBe(true);
      expect(service.validateReferenceFormat('AFF-2024-999', 'affaire')).toBe(true);
      expect(service.validateReferenceFormat('AFF-24-001', 'affaire')).toBe(false);
      expect(service.validateReferenceFormat('AFF-2024-1', 'affaire')).toBe(false);
      expect(service.validateReferenceFormat('INVALID', 'affaire')).toBe(false);
    });

    it('should validate recouvrement reference format correctly', () => {
      expect(service.validateReferenceFormat('DOS-REC-001', 'recouvrement')).toBe(true);
      expect(service.validateReferenceFormat('DOS-REC-999', 'recouvrement')).toBe(true);
      expect(service.validateReferenceFormat('DOS-REC-1', 'recouvrement')).toBe(false);
      expect(service.validateReferenceFormat('DOS-001', 'recouvrement')).toBe(false);
    });

    it('should validate facture reference format correctly', () => {
      expect(service.validateReferenceFormat('FACT-2024-01-001', 'facture')).toBe(true);
      expect(service.validateReferenceFormat('FACT-2024-12-999', 'facture')).toBe(true);
      expect(service.validateReferenceFormat('FACT-24-01-001', 'facture')).toBe(false);
      expect(service.validateReferenceFormat('FACT-2024-1-001', 'facture')).toBe(false);
    });
  });

  describe('extractDomainFromReference', () => {
    it('should extract correct domain from references', () => {
      expect(service.extractDomainFromReference('AFF-2024-001')).toBe('contentieux');
      expect(service.extractDomainFromReference('DOS-REC-001')).toBe('recouvrement');
      expect(service.extractDomainFromReference('IMM-001')).toBe('immobilier');
      expect(service.extractDomainFromReference('CLI-CONS-001')).toBe('conseil');
      expect(service.extractDomainFromReference('FACT-2024-01-001')).toBe('conseil');
      expect(service.extractDomainFromReference('INVALID-REF')).toBe(null);
    });
  });

  describe('getReferenceStats', () => {
    it('should return reference statistics', async () => {
      // Mock count methods
      mockPrismaService.affaires.count.mockResolvedValue(10);
      mockPrismaService.dossiersRecouvrement.count.mockResolvedValue(5);
      mockPrismaService.immeubles.count.mockResolvedValue(3);
      mockPrismaService.clientsConseil.count.mockResolvedValue(7);
      mockPrismaService.facturesConseil.count.mockResolvedValue(15);

      const stats = await service.getReferenceStats();

      expect(stats).toEqual({
        affaires: 10,
        dossiersRecouvrement: 5,
        immeubles: 3,
        clientsConseil: 7,
        facturesConseil: 15,
      });
    });

    it('should handle errors when getting statistics', async () => {
      mockPrismaService.affaires.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getReferenceStats()).rejects.toThrow('Database error');
    });
  });
});