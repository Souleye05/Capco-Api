import { Test, TestingModule } from '@nestjs/testing';
import { ContentieuxService } from './contentieux.service';
import { AffairesService } from './affaires/affaires.service';
import { AudiencesService } from './audiences/audiences.service';
import { HonorairesService } from './honoraires/honoraires.service';
import { DepensesService } from './depenses/depenses.service';
import { JuridictionsService } from './juridictions/juridictions.service';

describe('ContentieuxService', () => {
    let service: ContentieuxService;

    const mockAffairesService = {
        getStatistics: jest.fn(),
        findAll: jest.fn(),
    };

    const mockAudiencesService = {
        getStatistics: jest.fn(),
        findAll: jest.fn(),
        getAudiencesRappelEnrolement: jest.fn(),
    };

    const mockHonorairesService = {
        getStatistics: jest.fn(),
        findAll: jest.fn(),
        findByAffaire: jest.fn(),
    };

    const mockDepensesService = {
        getStatistics: jest.fn(),
        findAll: jest.fn(),
        findByAffaire: jest.fn(),
    };

    const mockJuridictionsService = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContentieuxService,
                { provide: AffairesService, useValue: mockAffairesService },
                { provide: AudiencesService, useValue: mockAudiencesService },
                { provide: HonorairesService, useValue: mockHonorairesService },
                { provide: DepensesService, useValue: mockDepensesService },
                { provide: JuridictionsService, useValue: mockJuridictionsService },
            ],
        }).compile();

        service = module.get<ContentieuxService>(ContentieuxService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDashboard', () => {
        it('should aggregate stats from all sub-services', async () => {
            mockAffairesService.getStatistics.mockResolvedValue({ total: 10, actives: 6, cloturees: 3, radiees: 1 });
            mockAudiencesService.getStatistics.mockResolvedValue({ total: 20, aVenir: 8, tenues: 10, nonRenseignees: 2 });
            mockHonorairesService.getStatistics.mockResolvedValue({ totalFacture: 500000, totalEncaisse: 300000, totalRestant: 200000, nombreHonoraires: 5 });
            mockDepensesService.getStatistics.mockResolvedValue({ totalMontant: 100000, nombreDepenses: 4 });
            mockAudiencesService.getAudiencesRappelEnrolement.mockResolvedValue([
                { id: '1' }, { id: '2' }, { id: '3' },
            ]);

            const result = await service.getDashboard();

            expect(result.affaires.total).toBe(10);
            expect(result.audiences.total).toBe(20);
            expect(result.honoraires.totalFacture).toBe(500000);
            expect(result.depenses.totalMontant).toBe(100000);
            expect(result.alertes.audiencesRappelEnrolement).toBe(3);
            expect(result.alertes.audiencesRappel).toHaveLength(3);
        });

        it('should limit rappel audiences to 5', async () => {
            mockAffairesService.getStatistics.mockResolvedValue({ total: 0 });
            mockAudiencesService.getStatistics.mockResolvedValue({ total: 0 });
            mockHonorairesService.getStatistics.mockResolvedValue({ totalFacture: 0 });
            mockDepensesService.getStatistics.mockResolvedValue({ totalMontant: 0 });
            mockAudiencesService.getAudiencesRappelEnrolement.mockResolvedValue(
                Array.from({ length: 10 }, (_, i) => ({ id: `${i}` })),
            );

            const result = await service.getDashboard();

            expect(result.alertes.audiencesRappelEnrolement).toBe(10);
            expect(result.alertes.audiencesRappel).toHaveLength(5);
        });
    });

    describe('getResumeFinancierAffaire', () => {
        it('should calculate financial summary for an affaire', async () => {
            mockHonorairesService.findByAffaire.mockResolvedValue([
                { montantFacture: 100000, montantEncaisse: 60000 },
                { montantFacture: 50000, montantEncaisse: 30000 },
            ]);
            mockDepensesService.findByAffaire.mockResolvedValue([
                { montant: 15000 },
                { montant: 10000 },
            ]);

            const result = await service.getResumeFinancierAffaire('affaire-uuid-1');

            expect(result.honoraires.total).toBe(150000);
            expect(result.honoraires.encaisse).toBe(90000);
            expect(result.honoraires.restant).toBe(60000);
            expect(result.depenses.total).toBe(25000);
            expect(result.resultatNet).toBe(65000); // 90000 - 25000
        });

        it('should handle empty honoraires and depenses', async () => {
            mockHonorairesService.findByAffaire.mockResolvedValue([]);
            mockDepensesService.findByAffaire.mockResolvedValue([]);

            const result = await service.getResumeFinancierAffaire('affaire-uuid-1');

            expect(result.honoraires.total).toBe(0);
            expect(result.depenses.total).toBe(0);
            expect(result.resultatNet).toBe(0);
        });
    });

    describe('getPlanningAudiences', () => {
        it('should group audiences by date', async () => {
            const date1 = new Date('2026-03-15T12:00:00.000Z');
            const date2 = new Date('2026-03-15T14:00:00.000Z');
            const date3 = new Date('2026-03-16T10:00:00.000Z');

            mockAudiencesService.findAll.mockResolvedValue({
                data: [
                    { id: '1', date: date1, type: 'MISE_EN_ETAT' },
                    { id: '2', date: date2, type: 'PLAIDOIRIE' },
                    { id: '3', date: date3, type: 'REFERE' },
                ],
                pagination: { total: 3, page: 1, limit: 10, pages: 1 },
            });

            const result = await service.getPlanningAudiences();

            expect(result.total).toBe(3);
            expect(result.planning['2026-03-15']).toHaveLength(2);
            expect(result.planning['2026-03-16']).toHaveLength(1);
        });
    });

    describe('rechercheGlobale', () => {
        it('should search across affaires and audiences', async () => {
            mockAffairesService.findAll.mockResolvedValue({
                data: [{ id: 'aff-1', intitule: 'Dupont' }],
            });
            mockAudiencesService.findAll.mockResolvedValue({
                data: [{ id: 'aud-1', type: 'MISE_EN_ETAT' }],
            });

            const result = await service.rechercheGlobale('Dupont');

            expect(result.affaires).toHaveLength(1);
            expect(result.audiences).toHaveLength(1);
            expect(result.total).toBe(2);
        });

        it('should return empty results when nothing matches', async () => {
            mockAffairesService.findAll.mockResolvedValue({ data: [] });
            mockAudiencesService.findAll.mockResolvedValue({ data: [] });

            const result = await service.rechercheGlobale('inexistant');

            expect(result.total).toBe(0);
        });
    });

    describe('getIndicateursPerformance', () => {
        it('should calculate KPIs correctly', async () => {
            mockAffairesService.getStatistics.mockResolvedValue({ total: 10, actives: 4, cloturees: 6 });
            mockAudiencesService.getStatistics.mockResolvedValue({ total: 20, tenues: 15 });
            mockHonorairesService.getStatistics.mockResolvedValue({ totalFacture: 1000000, totalEncaisse: 800000 });
            mockDepensesService.getStatistics.mockResolvedValue({ totalMontant: 200000 });

            const result = await service.getIndicateursPerformance();

            expect(result.affaires.total).toBe(10);
            expect(result.affaires.tauxReussite).toBe(60); // 6/10 * 100
            expect(result.audiences.tauxRealisation).toBe(75); // 15/20 * 100
            expect(result.finances.tauxEncaissement).toBe(80); // 800000/1000000 * 100
            expect(result.finances.benefice).toBe(600000); // 800000 - 200000
        });

        it('should handle zero totals without division by zero', async () => {
            mockAffairesService.getStatistics.mockResolvedValue({ total: 0, cloturees: 0 });
            mockAudiencesService.getStatistics.mockResolvedValue({ total: 0, tenues: 0 });
            mockHonorairesService.getStatistics.mockResolvedValue({ totalFacture: 0, totalEncaisse: 0 });
            mockDepensesService.getStatistics.mockResolvedValue({ totalMontant: 0 });

            const result = await service.getIndicateursPerformance();

            expect(result.affaires.tauxReussite).toBe(0);
            expect(result.audiences.tauxRealisation).toBe(0);
            expect(result.finances.tauxEncaissement).toBe(0);
        });
    });

    describe('exporterDonnees', () => {
        it('should export affaires data', async () => {
            mockAffairesService.findAll.mockResolvedValue({
                data: [{ id: '1', intitule: 'Test' }],
            });

            const result = await service.exporterDonnees({
                type: 'affaires',
                format: 'json',
            });

            expect(result.type).toBe('affaires');
            expect(result.format).toBe('json');
            expect(result.nombreEnregistrements).toBe(1);
            expect(result.dateExport).toBeInstanceOf(Date);
        });

        it('should export audiences with date filter', async () => {
            mockAudiencesService.findAll.mockResolvedValue({
                data: [{ id: '1' }],
            });

            const result = await service.exporterDonnees({
                type: 'audiences',
                format: 'csv',
                dateDebut: new Date('2026-01-01'),
                dateFin: new Date('2026-03-31'),
            });

            expect(result.type).toBe('audiences');
            expect(result.format).toBe('csv');
        });

        it('should export honoraires data', async () => {
            mockHonorairesService.findAll.mockResolvedValue({
                data: [{ id: '1', montantFacture: 100000 }],
            });

            const result = await service.exporterDonnees({
                type: 'honoraires',
                format: 'json',
            });

            expect(result.type).toBe('honoraires');
            expect(result.nombreEnregistrements).toBe(1);
        });

        it('should export depenses data', async () => {
            mockDepensesService.findAll.mockResolvedValue({
                data: [{ id: '1', montant: 25000 }],
            });

            const result = await service.exporterDonnees({
                type: 'depenses',
                format: 'json',
            });

            expect(result.type).toBe('depenses');
            expect(result.nombreEnregistrements).toBe(1);
        });
    });
});
