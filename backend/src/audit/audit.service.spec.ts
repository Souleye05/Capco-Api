import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../common/services/prisma.service';
import { CreateAuditLogDto, AuditQueryDto } from './dto/audit.dto';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const createAuditLogDto: CreateAuditLogDto = {
        userId: 'user-123',
        userEmail: 'test@example.com',
        action: 'CREATE',
        module: 'users',
        entityType: 'User',
        entityId: 'entity-123',
        entityReference: 'USR-001',
      };

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        ...createAuditLogDto,
        createdAt: new Date(),
      });

      await service.log(createAuditLogDto);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: createAuditLogDto,
      });
    });

    it('should handle errors gracefully when creating audit log', async () => {
      const createAuditLogDto: CreateAuditLogDto = {
        userId: 'user-123',
        userEmail: 'test@example.com',
        action: 'CREATE',
        module: 'users',
        entityType: 'User',
      };

      mockPrismaService.auditLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(service.log(createAuditLogDto)).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const query: AuditQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockAuditLogs = [
        {
          id: 'audit-1',
          userId: 'user-1',
          userEmail: 'user1@example.com',
          action: 'CREATE',
          module: 'users',
          entityType: 'User',
          entityId: 'entity-1',
          entityReference: 'USR-001',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: mockAuditLogs,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply filters correctly', async () => {
      const query: AuditQueryDto = {
        page: 1,
        limit: 10,
        userId: 'user-123',
        module: 'users',
        action: 'CREATE',
        entityType: 'User',
        search: 'test',
      };

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          module: { contains: 'users', mode: 'insensitive' },
          action: { contains: 'CREATE', mode: 'insensitive' },
          entityType: { contains: 'User', mode: 'insensitive' },
          OR: [
            { userEmail: { contains: 'test', mode: 'insensitive' } },
            { action: { contains: 'test', mode: 'insensitive' } },
            { module: { contains: 'test', mode: 'insensitive' } },
            { entityType: { contains: 'test', mode: 'insensitive' } },
            { entityReference: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for a specific user', async () => {
      const userId = 'user-123';
      const query: AuditQueryDto = { page: 1, limit: 10 };

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findByUser(userId, query);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByModule', () => {
    it('should return audit logs for a specific module', async () => {
      const module = 'users';
      const query: AuditQueryDto = { page: 1, limit: 10 };

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findByModule(module, query);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { module: { contains: 'users', mode: 'insensitive' } },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getStatistics', () => {
    it('should return audit statistics', async () => {
      const mockActionStats = [{ action: 'CREATE', _count: { action: 5 } }];
      const mockModuleStats = [{ module: 'users', _count: { module: 3 } }];
      const mockUserStats = [{ userId: 'user-1', userEmail: 'user1@example.com', _count: { userId: 2 } }];

      mockPrismaService.auditLog.count.mockResolvedValue(10);
      mockPrismaService.auditLog.groupBy
        .mockResolvedValueOnce(mockActionStats)
        .mockResolvedValueOnce(mockModuleStats)
        .mockResolvedValueOnce(mockUserStats);

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalLogs: 10,
        actionBreakdown: [{ action: 'CREATE', count: 5 }],
        moduleBreakdown: [{ module: 'users', count: 3 }],
        topUsers: [{ userId: 'user-1', userEmail: 'user1@example.com', count: 2 }],
      });
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete old audit logs', async () => {
      const daysToKeep = 30;
      mockPrismaService.auditLog.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.cleanupOldLogs(daysToKeep);

      expect(result).toBe(5);
      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });
});